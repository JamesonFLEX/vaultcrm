'use strict';
/**
 * VaultCRM :: Backend Processing Engine
 * Express + pg. Treats PostgreSQL as a JSONB document engine.
 * Every write is validated against sys_registry.fields_schema.
 */
const path = require('path');
const express = require('express');
const { Pool } = require('pg');

// ---------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------
const PORT = parseInt(process.env.PORT || '3000', 10);
const API_KEY = process.env.API_KEY || ''; // empty = auth disabled (dev only)

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'vault',
  password: process.env.PGPASSWORD || 'vault',
  database: process.env.PGDATABASE || 'vaultcrm',
  max: parseInt(process.env.PG_POOL_MAX || '5', 10), // 1 core: small pool beats big pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000
});
pool.on('error', (err) => console.error('[pg] idle client error', err.message));

// ---------------------------------------------------------------------
// Schema + validation: shared with the browser engine so both modes
// enforce identical rules (see public/local-engine.js)
// ---------------------------------------------------------------------
const { validateSchemaDef, sanitizePayload, coerce, parseType, isUuid, HttpError } =
  require('./public/local-engine.js');

/** Make sure every REF value in a payload points at a real record in the right table. */
async function verifyRefs(client, schema, clean) {
  const checks = [];
  for (const [k, v] of Object.entries(clean)) {
    const pt = parseType(schema[k]);
    if (pt && pt.base === 'REF') checks.push({ k, id: v, target: pt.target });
  }
  if (!checks.length) return;
  const { rows } = await client.query(
    'SELECT id, registry_id FROM app_records_vault WHERE id = ANY($1::uuid[])',
    [checks.map((c) => c.id)]
  );
  const found = new Map(rows.map((r) => [r.id, r.registry_id]));
  const errors = checks
    .filter((c) => found.get(c.id) !== c.target)
    .map((c) => `${c.k}: record ${c.id} not found in target table ${c.target}`);
  if (errors.length) throw new HttpError(400, 'Broken reference', errors);
}

async function getRegistry(client, registryId) {
  if (!isUuid(registryId)) throw new HttpError(400, 'registry_id must be a UUID');
  const { rows } = await client.query('SELECT * FROM sys_registry WHERE id = $1', [registryId]);
  if (!rows.length) throw new HttpError(404, 'Table not found');
  return rows[0];
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------------------------------------------------------------------
// App
// ---------------------------------------------------------------------
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Optional shared-key auth on the API (set API_KEY in production)
app.use('/api', (req, res, next) => {
  if (!API_KEY || req.path === '/health') return next();
  if (req.get('x-api-key') === API_KEY) return next();
  res.status(401).json({ error: 'Unauthorized' });
});

app.get('/api/health', wrap(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true, pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount } });
}));

// ---- Registry --------------------------------------------------------

// 1. Create table definition (no DDL — just a registry row)
app.post('/api/registry/create-table', wrap(async (req, res) => {
  const { app_name, table_name, fields_schema } = req.body || {};
  if (typeof app_name !== 'string' || !app_name.trim() || app_name.length > 100) {
    throw new HttpError(400, 'app_name required (max 100 chars)');
  }
  if (typeof table_name !== 'string' || !table_name.trim() || table_name.length > 100) {
    throw new HttpError(400, 'table_name required (max 100 chars)');
  }
  const schema = validateSchemaDef(fields_schema);

  // REF targets must exist
  const targets = [...new Set(Object.values(schema).filter((t) => t.startsWith('REF:')).map((t) => t.slice(4)))];
  if (targets.length) {
    const { rows } = await pool.query('SELECT id FROM sys_registry WHERE id = ANY($1::uuid[])', [targets]);
    const have = new Set(rows.map((r) => r.id));
    const missing = targets.filter((t) => !have.has(t));
    if (missing.length) throw new HttpError(400, 'Reference target table(s) not found', missing);
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO sys_registry (app_name, table_name, fields_schema)
       VALUES ($1, $2, $3::jsonb) RETURNING id, app_name, table_name, fields_schema, created_at`,
      [app_name.trim(), table_name.trim(), JSON.stringify(schema)]
    );
    res.status(201).json({ registry_id: rows[0].id, table: rows[0] });
  } catch (e) {
    if (e.code === '23505') throw new HttpError(409, 'A table with that name already exists in this app');
    throw e;
  }
}));

app.get('/api/registry/list', wrap(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.id, r.app_name, r.table_name, r.fields_schema, r.created_at, r.updated_at,
            (SELECT count(*)::int FROM app_records_vault v WHERE v.registry_id = r.id) AS record_count
       FROM sys_registry r ORDER BY r.app_name, r.table_name`
  );
  res.json({ tables: rows });
}));

app.get('/api/registry/:id', wrap(async (req, res) => {
  res.json({ table: await getRegistry(pool, req.params.id) });
}));

// ---- Vault -----------------------------------------------------------

// 2. Insert a validated record
app.post('/api/vault/insert-record', wrap(async (req, res) => {
  const { registry_id, payload } = req.body || {};
  const reg = await getRegistry(pool, registry_id);
  const { clean, dropped } = sanitizePayload(reg.fields_schema, payload);
  await verifyRefs(pool, reg.fields_schema, clean);
  const { rows } = await pool.query(
    `INSERT INTO app_records_vault (registry_id, payload) VALUES ($1, $2::jsonb)
     RETURNING id, registry_id, payload, date_created, date_modified`,
    [reg.id, JSON.stringify(clean)]
  );
  res.status(201).json({ record: rows[0], dropped_fields: dropped });
}));

// 3. Query with JSONB containment (@>), optional reference expansion
app.post('/api/vault/query-records', wrap(async (req, res) => {
  const { registry_id, filterField, filterValue, expand } = req.body || {};
  const limit = Math.min(Math.max(parseInt(req.body.limit || '100', 10) || 100, 1), 500);
  const offset = Math.max(parseInt(req.body.offset || '0', 10) || 0, 0);
  const reg = await getRegistry(pool, registry_id);

  let sql = 'SELECT id, registry_id, payload, date_created, date_modified FROM app_records_vault WHERE registry_id = $1';
  const params = [reg.id];

  if (filterField !== undefined && filterField !== null && filterField !== '') {
    if (!Object.prototype.hasOwnProperty.call(reg.fields_schema, filterField)) {
      throw new HttpError(400, `Unknown filter field "${filterField}"`);
    }
    const r = coerce(reg.fields_schema[filterField], filterValue);
    if (!r.ok || r.value === null) throw new HttpError(400, `filterValue: ${r.error || 'required'}`);
    params.push(JSON.stringify({ [filterField]: r.value }));
    sql += ` AND payload @> $${params.length}::jsonb`;
  }

  params.push(limit, offset);
  sql += ` ORDER BY date_created DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
  const { rows } = await pool.query(sql, params);

  // expand=true: resolve REF fields in ONE extra query (no N+1)
  let refs = {};
  if (expand) {
    const refKeys = Object.keys(reg.fields_schema).filter((k) => reg.fields_schema[k].startsWith('REF:'));
    const ids = [...new Set(rows.flatMap((r) => refKeys.map((k) => r.payload[k]).filter(Boolean)))];
    if (ids.length) {
      const q = await pool.query('SELECT id, registry_id, payload FROM app_records_vault WHERE id = ANY($1::uuid[])', [ids]);
      refs = Object.fromEntries(q.rows.map((r) => [r.id, r]));
    }
  }

  res.json({ table: reg, records: rows, refs, limit, offset });
}));

// Update a record: validated partial merge. Fields sent as null/'' are removed.
app.post('/api/vault/update-record', wrap(async (req, res) => {
  const { registry_id, record_id, payload } = req.body || {};
  if (!isUuid(record_id)) throw new HttpError(400, 'record_id must be a UUID');
  const reg = await getRegistry(pool, registry_id);
  const { clean, dropped, cleared } = sanitizePayload(reg.fields_schema, payload);
  await verifyRefs(pool, reg.fields_schema, clean);
  const { rows } = await pool.query(
    `UPDATE app_records_vault SET payload = (payload - $3::text[]) || $2::jsonb
      WHERE id = $1 AND registry_id = $4
      RETURNING id, registry_id, payload, date_created, date_modified`,
    [record_id, JSON.stringify(clean), cleared, reg.id]
  );
  if (!rows.length) throw new HttpError(404, 'Record not found in this table');
  res.json({ record: rows[0], dropped_fields: dropped });
}));

// 4. Link records: write a target record UUID into a REF field.
//    Relationship = REF:<target registry> type in the schema + UUID in the payload.
//    Many-to-one (Contact -> Account) is native. One-to-many is a reverse
//    query: query-records on Contacts where account = <account uuid>
//    (hits the GIN index via @>).
app.post('/api/vault/link-records', wrap(async (req, res) => {
  const { registry_id, record_id, field, target_record_id } = req.body || {};
  if (!isUuid(record_id)) throw new HttpError(400, 'record_id must be a UUID');
  if (target_record_id !== null && !isUuid(target_record_id)) {
    throw new HttpError(400, 'target_record_id must be a UUID (or null to unlink)');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reg = await getRegistry(client, registry_id);
    const type = reg.fields_schema[field];
    const pt = parseType(type);
    if (!pt || pt.base !== 'REF') throw new HttpError(400, `"${field}" is not a REF field`);

    const src = await client.query(
      'SELECT id FROM app_records_vault WHERE id = $1 AND registry_id = $2 FOR UPDATE',
      [record_id, reg.id]
    );
    if (!src.rows.length) throw new HttpError(404, 'Source record not found in this table');

    let sql, params;
    if (target_record_id === null) {
      sql = 'UPDATE app_records_vault SET payload = payload - $2 WHERE id = $1 RETURNING *';
      params = [record_id, field];
    } else {
      await verifyRefs(client, reg.fields_schema, { [field]: target_record_id.toLowerCase() });
      sql = 'UPDATE app_records_vault SET payload = payload || jsonb_build_object($2::text, $3::text) WHERE id = $1 RETURNING *';
      params = [record_id, field, target_record_id.toLowerCase()];
    }
    const { rows } = await client.query(sql, params);
    await client.query('COMMIT');
    res.json({ record: rows[0] });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

app.delete('/api/vault/record/:registryId/:id', wrap(async (req, res) => {
  if (!isUuid(req.params.registryId) || !isUuid(req.params.id)) throw new HttpError(400, 'Bad UUID');
  const { rowCount } = await pool.query(
    'DELETE FROM app_records_vault WHERE id = $1 AND registry_id = $2',
    [req.params.id, req.params.registryId]
  );
  if (!rowCount) throw new HttpError(404, 'Record not found');
  res.json({ deleted: true });
}));

// ---- Static dashboard --------------------------------------------------
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ---- Errors ------------------------------------------------------------
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err instanceof HttpError || err.expose) return res.status(err.status).json({ error: err.message, details: err.details });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Payload too large' });
  console.error('[server]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Only bind the port when run directly (`node server.js`), so tests can
// require this file without starting a server.
if (require.main === module) {
  const server = app.listen(PORT, () => console.log(`[vaultcrm] listening on :${PORT}`));

  const shutdown = (sig) => {
    console.log(`[vaultcrm] ${sig} received, draining`);
    server.close(() => pool.end().then(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { app, pool, validateSchemaDef, sanitizePayload, coerce };
