/**
 * VaultCRM :: Local Engine (GitHub Pages mode)
 *
 * Runs the same API as server.js entirely in the browser, so the dashboard
 * works on static hosting. Same field types, same validation, same
 * relationship rules. Data is stored in this browser's IndexedDB.
 *
 * Usage: await VaultLocal.request('POST', '/api/vault/insert-record', body)
 *        -> { status, body }
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------------
  // Validation (mirrors server.js)
  // ---------------------------------------------------------------------
  const FIELD_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
  const BASE_TYPES = new Set(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN']);
  const MAX_TEXT = 10000;
  const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

  class HttpError extends Error {
    constructor(status, message, details) { super(message); this.status = status; this.details = details; }
  }

  function parseType(t) {
    if (typeof t !== 'string') return null;
    const up = t.trim().toUpperCase();
    if (BASE_TYPES.has(up)) return { base: up };
    if (up.startsWith('REF:')) {
      const target = t.trim().slice(4).toLowerCase();
      return isUuid(target) ? { base: 'REF', target } : null;
    }
    return null;
  }

  function validateSchemaDef(schema) {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw new HttpError(400, 'fields_schema must be an object');
    const keys = Object.keys(schema);
    if (!keys.length) throw new HttpError(400, 'fields_schema needs at least one field');
    if (keys.length > 100) throw new HttpError(400, 'fields_schema max 100 fields');
    const clean = {}, errors = [];
    for (const k of keys) {
      if (!FIELD_NAME_RE.test(k)) { errors.push(`${k}: invalid field name`); continue; }
      const pt = parseType(schema[k]);
      if (!pt) { errors.push(`${k}: unknown type "${schema[k]}"`); continue; }
      clean[k] = pt.base === 'REF' ? `REF:${pt.target}` : pt.base;
    }
    if (errors.length) throw new HttpError(400, 'Invalid fields_schema', errors);
    return clean;
  }

  function coerce(type, raw) {
    if (raw === null || raw === undefined || raw === '') return { ok: true, value: null };
    const pt = parseType(type);
    switch (pt && pt.base) {
      case 'TEXT': {
        if (typeof raw === 'object') return { ok: false, error: 'expected text' };
        const s = String(raw);
        return s.length > MAX_TEXT ? { ok: false, error: `text exceeds ${MAX_TEXT} chars` } : { ok: true, value: s };
      }
      case 'NUMBER': {
        const n = typeof raw === 'number' ? raw : (typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN);
        return Number.isFinite(n) ? { ok: true, value: n } : { ok: false, error: 'expected number' };
      }
      case 'DATE': {
        if (typeof raw !== 'string' || !ISO_DATE_RE.test(raw) || Number.isNaN(Date.parse(raw))) {
          return { ok: false, error: 'expected ISO 8601 date (YYYY-MM-DD)' };
        }
        const [y, m, d] = raw.slice(0, 10).split('-').map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d));
        if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
          return { ok: false, error: 'invalid calendar date' };
        }
        return { ok: true, value: raw };
      }
      case 'BOOLEAN':
        if (typeof raw === 'boolean') return { ok: true, value: raw };
        if (raw === 'true' || raw === 1 || raw === '1') return { ok: true, value: true };
        if (raw === 'false' || raw === 0 || raw === '0') return { ok: true, value: false };
        return { ok: false, error: 'expected boolean' };
      case 'REF':
        return isUuid(raw) ? { ok: true, value: raw.toLowerCase() } : { ok: false, error: 'expected record UUID' };
      default:
        return { ok: false, error: 'unknown field type' };
    }
  }

  function sanitizePayload(schema, payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new HttpError(400, 'payload must be an object');
    const clean = {}, errors = [], dropped = [];
    for (const key of Object.keys(payload)) {
      if (!Object.prototype.hasOwnProperty.call(schema, key)) { dropped.push(key); continue; }
      const r = coerce(schema[key], payload[key]);
      if (!r.ok) errors.push(`${key}: ${r.error}`);
      else if (r.value !== null) clean[key] = r.value;
    }
    if (errors.length) throw new HttpError(400, 'Payload failed schema validation', errors);
    return { clean, dropped };
  }

  // ---------------------------------------------------------------------
  // Storage: one state object in IndexedDB, memory fallback
  // ---------------------------------------------------------------------
  const DB_NAME = 'vaultcrm', STORE = 'kv', KEY = 'state';
  const emptyState = () => ({ version: 1, registry: [], records: [] });
  let state = null, persistent = false, idb = null;

  function openIdb() {
    return new Promise((resolve) => {
      try {
        if (!root.indexedDB) return resolve(null);
        const req = root.indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (_) { resolve(null); }
    });
  }
  const idbGet = () => new Promise((resolve) => {
    try {
      const r = idb.transaction(STORE).objectStore(STORE).get(KEY);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => resolve(null);
    } catch (_) { resolve(null); }
  });
  const idbPut = (val) => new Promise((resolve, reject) => {
    try {
      const tx = idb.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(val, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (e) { reject(e); }
  });

  async function load() {
    if (state) return;
    idb = await openIdb();
    const saved = idb ? await idbGet() : null;
    persistent = !!idb;
    state = saved && Array.isArray(saved.registry) && Array.isArray(saved.records) ? saved : emptyState();
  }
  async function save() {
    if (!idb) return;
    try { await idbPut(state); }
    catch (e) { persistent = false; throw new HttpError(507, 'Could not save to browser storage: ' + (e && e.message)); }
  }

  const now = () => new Date().toISOString();
  const uuid = () => (root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    }));
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function getRegistry(id) {
    if (!isUuid(id)) throw new HttpError(400, 'registry_id must be a UUID');
    const reg = state.registry.find((r) => r.id === id.toLowerCase());
    if (!reg) throw new HttpError(404, 'Table not found');
    return reg;
  }

  function verifyRefs(schema, clean) {
    const errors = [];
    for (const [k, v] of Object.entries(clean)) {
      const pt = parseType(schema[k]);
      if (pt && pt.base === 'REF') {
        const target = state.records.find((r) => r.id === v);
        if (!target || target.registry_id !== pt.target) errors.push(`${k}: record ${v} not found in target table ${pt.target}`);
      }
    }
    if (errors.length) throw new HttpError(400, 'Broken reference', errors);
  }

  // ---------------------------------------------------------------------
  // Routes (same paths + shapes as server.js)
  // ---------------------------------------------------------------------
  const routes = {
    'GET /api/health': () => ({ ok: true, mode: 'local', persistent }),

    'GET /api/registry/list': () => ({
      tables: state.registry
        .map((r) => ({ ...clone(r), record_count: state.records.filter((v) => v.registry_id === r.id).length }))
        .sort((a, b) => (a.app_name + a.table_name).localeCompare(b.app_name + b.table_name))
    }),

    'POST /api/registry/create-table': async (b) => {
      const { app_name, table_name, fields_schema } = b;
      if (typeof app_name !== 'string' || !app_name.trim() || app_name.length > 100) throw new HttpError(400, 'app_name required (max 100 chars)');
      if (typeof table_name !== 'string' || !table_name.trim() || table_name.length > 100) throw new HttpError(400, 'table_name required (max 100 chars)');
      const schema = validateSchemaDef(fields_schema);
      const targets = [...new Set(Object.values(schema).filter((t) => t.startsWith('REF:')).map((t) => t.slice(4)))];
      const missing = targets.filter((t) => !state.registry.some((r) => r.id === t));
      if (missing.length) throw new HttpError(400, 'Reference target table(s) not found', missing);
      if (state.registry.some((r) => r.app_name === app_name.trim() && r.table_name === table_name.trim())) {
        throw new HttpError(409, 'A table with that name already exists in this app');
      }
      const row = { id: uuid(), app_name: app_name.trim(), table_name: table_name.trim(), fields_schema: schema, created_at: now(), updated_at: now() };
      state.registry.push(row);
      await save();
      return { __status: 201, registry_id: row.id, table: clone(row) };
    },

    'POST /api/vault/insert-record': async (b) => {
      const reg = getRegistry(b.registry_id);
      const { clean, dropped } = sanitizePayload(reg.fields_schema, b.payload);
      verifyRefs(reg.fields_schema, clean);
      const rec = { id: uuid(), registry_id: reg.id, payload: clean, date_created: now(), date_modified: now() };
      state.records.push(rec);
      await save();
      return { __status: 201, record: clone(rec), dropped_fields: dropped };
    },

    'POST /api/vault/query-records': (b) => {
      const reg = getRegistry(b.registry_id);
      const limit = Math.min(Math.max(parseInt(b.limit || '100', 10) || 100, 1), 500);
      const offset = Math.max(parseInt(b.offset || '0', 10) || 0, 0);
      let rows = state.records.filter((r) => r.registry_id === reg.id);

      if (b.filterField !== undefined && b.filterField !== null && b.filterField !== '') {
        if (!Object.prototype.hasOwnProperty.call(reg.fields_schema, b.filterField)) throw new HttpError(400, `Unknown filter field "${b.filterField}"`);
        const r = coerce(reg.fields_schema[b.filterField], b.filterValue);
        if (!r.ok || r.value === null) throw new HttpError(400, `filterValue: ${r.error || 'required'}`);
        rows = rows.filter((rec) => rec.payload[b.filterField] === r.value); // same semantics as @> on one key
      }

      rows = rows.slice().sort((a, b2) => (a.date_created < b2.date_created ? 1 : -1)).slice(offset, offset + limit);

      const refs = {};
      if (b.expand) {
        const refKeys = Object.keys(reg.fields_schema).filter((k) => reg.fields_schema[k].startsWith('REF:'));
        const ids = new Set(rows.flatMap((r) => refKeys.map((k) => r.payload[k]).filter(Boolean)));
        state.records.filter((r) => ids.has(r.id)).forEach((r) => { refs[r.id] = { id: r.id, registry_id: r.registry_id, payload: clone(r.payload) }; });
      }
      return { table: clone(reg), records: clone(rows), refs, limit, offset };
    },

    'POST /api/vault/link-records': async (b) => {
      if (!isUuid(b.record_id)) throw new HttpError(400, 'record_id must be a UUID');
      if (b.target_record_id !== null && !isUuid(b.target_record_id)) throw new HttpError(400, 'target_record_id must be a UUID (or null to unlink)');
      const reg = getRegistry(b.registry_id);
      const pt = parseType(reg.fields_schema[b.field]);
      if (!pt || pt.base !== 'REF') throw new HttpError(400, `"${b.field}" is not a REF field`);
      const rec = state.records.find((r) => r.id === b.record_id.toLowerCase() && r.registry_id === reg.id);
      if (!rec) throw new HttpError(404, 'Source record not found in this table');
      if (b.target_record_id === null) delete rec.payload[b.field];
      else {
        const target = b.target_record_id.toLowerCase();
        verifyRefs(reg.fields_schema, { [b.field]: target });
        rec.payload[b.field] = target;
      }
      rec.date_modified = now();
      await save();
      return { record: clone(rec) };
    }
  };

  async function request(method, url, body) {
    try {
      await load();
      const path = url.split('?')[0];
      let handler = routes[`${method} ${path}`];
      let params = null;
      let m;
      if (!handler && method === 'GET' && (m = path.match(/^\/api\/registry\/([^/]+)$/))) {
        handler = () => ({ table: clone(getRegistry(m[1])) });
      }
      if (!handler && method === 'DELETE' && (m = path.match(/^\/api\/vault\/record\/([^/]+)\/([^/]+)$/))) {
        params = { registryId: m[1], id: m[2] };
        handler = async () => {
          if (!isUuid(params.registryId) || !isUuid(params.id)) throw new HttpError(400, 'Bad UUID');
          const i = state.records.findIndex((r) => r.id === params.id.toLowerCase() && r.registry_id === params.registryId.toLowerCase());
          if (i < 0) throw new HttpError(404, 'Record not found');
          state.records.splice(i, 1);
          await save();
          return { deleted: true };
        };
      }
      if (!handler) throw new HttpError(404, 'Not found');
      const out = await handler(body || {});
      const status = out.__status || 200;
      delete out.__status;
      return { status, body: out };
    } catch (e) {
      if (e instanceof HttpError) return { status: e.status, body: { error: e.message, details: e.details } };
      return { status: 500, body: { error: 'Internal error: ' + (e && e.message) } };
    }
  }

  // ---------------------------------------------------------------------
  // Backup
  // ---------------------------------------------------------------------
  async function exportData() {
    await load();
    return JSON.stringify({ app: 'vaultcrm', exported_at: now(), ...state }, null, 2);
  }

  async function importData(text) {
    await load();
    let data;
    try { data = JSON.parse(text); } catch (_) { throw new Error('File is not valid JSON'); }
    if (!data || !Array.isArray(data.registry) || !Array.isArray(data.records)) throw new Error('Not a VaultCRM backup file');
    for (const r of data.registry) {
      if (!isUuid(r.id) || typeof r.app_name !== 'string' || typeof r.table_name !== 'string') throw new Error('Backup has a malformed table');
      r.fields_schema = validateSchemaDef(r.fields_schema);
    }
    const regIds = new Set(data.registry.map((r) => r.id));
    for (const rec of data.records) {
      if (!isUuid(rec.id) || !regIds.has(rec.registry_id)) throw new Error('Backup has a malformed record');
      const reg = data.registry.find((r) => r.id === rec.registry_id);
      rec.payload = sanitizePayload(reg.fields_schema, rec.payload).clean;
    }
    state = { version: 1, registry: data.registry, records: data.records };
    await save();
    return { tables: state.registry.length, records: state.records.length };
  }

  const api = { request, exportData, importData, validateSchemaDef, sanitizePayload, coerce,
    _reset: () => { state = emptyState(); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VaultLocal = api;
})(typeof window !== 'undefined' ? window : globalThis);
