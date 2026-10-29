/**
 * VaultCRM :: Core engine
 *
 * 1. Validation core (field types, schema + payload validation). Shared by
 *    server.js (require) and the browser, so both modes enforce the same rules.
 * 2. Local engine: the full API running in the browser on IndexedDB, used
 *    on GitHub Pages (browser mode).
 *
 * Field types:
 *   TEXT, LONGTEXT, NUMBER, DATE, BOOLEAN, URL, EMAIL, PHONE,
 *   CHOICE:Option A|Option B, REF:<registry uuid>
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------------
  // Validation core
  // ---------------------------------------------------------------------
  const FIELD_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[0-9+().\-\s xX#]{7,30}$/;
  const BASE_TYPES = new Set(['TEXT', 'LONGTEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'URL', 'EMAIL', 'PHONE']);
  const MAX_TEXT = 10000;
  const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

  class HttpError extends Error {
    constructor(status, message, details) { super(message); this.status = status; this.details = details; this.expose = true; }
  }

  /** Parse a type token -> {base, target?, options?} or null. */
  function parseType(t) {
    if (typeof t !== 'string') return null;
    const trimmed = t.trim();
    const up = trimmed.toUpperCase();
    if (BASE_TYPES.has(up)) return { base: up };
    if (up.startsWith('REF:')) {
      const target = trimmed.slice(4).toLowerCase();
      return isUuid(target) ? { base: 'REF', target } : null;
    }
    if (up.startsWith('CHOICE:')) {
      const options = trimmed.slice(7).split('|').map((s) => s.trim()).filter(Boolean);
      if (!options.length || options.length > 50) return null;
      if (options.some((o) => o.length > 60)) return null;
      if (new Set(options).size !== options.length) return null;
      return { base: 'CHOICE', options };
    }
    return null;
  }

  const typeToken = (pt) => pt.base === 'REF' ? `REF:${pt.target}` : pt.base === 'CHOICE' ? `CHOICE:${pt.options.join('|')}` : pt.base;

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
      clean[k] = typeToken(pt);
    }
    if (errors.length) throw new HttpError(400, 'Invalid fields_schema', errors);
    return clean;
  }

  function coerceText(raw) {
    if (typeof raw === 'object') return { ok: false, error: 'expected text' };
    const s = String(raw);
    return s.length > MAX_TEXT ? { ok: false, error: `text exceeds ${MAX_TEXT} chars` } : { ok: true, value: s };
  }

  /** Coerce + check one value. Returns {ok, value, error}. */
  function coerce(type, raw) {
    if (raw === null || raw === undefined || raw === '') return { ok: true, value: null };
    const pt = parseType(type);
    switch (pt && pt.base) {
      case 'TEXT':
      case 'LONGTEXT':
        return coerceText(raw);
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
      case 'URL': {
        if (typeof raw !== 'string' || raw.length > 2000) return { ok: false, error: 'expected a web address' };
        try {
          const u = new URL(raw.trim());
          if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error();
          return { ok: true, value: u.href };
        } catch (_) { return { ok: false, error: 'expected a web address starting with http:// or https://' }; }
      }
      case 'EMAIL': {
        const s = typeof raw === 'string' ? raw.trim() : '';
        return s.length <= 254 && EMAIL_RE.test(s) ? { ok: true, value: s } : { ok: false, error: 'expected an email address' };
      }
      case 'PHONE': {
        const s = typeof raw === 'string' || typeof raw === 'number' ? String(raw).trim() : '';
        const digits = s.replace(/\D/g, '').length;
        return PHONE_RE.test(s) && digits >= 7 && digits <= 15 ? { ok: true, value: s } : { ok: false, error: 'expected a phone number' };
      }
      case 'CHOICE':
        return typeof raw === 'string' && pt.options.includes(raw) ? { ok: true, value: raw }
          : { ok: false, error: `expected one of: ${pt.options.join(', ')}` };
      case 'REF':
        return isUuid(raw) ? { ok: true, value: raw.toLowerCase() } : { ok: false, error: 'expected record UUID' };
      default:
        return { ok: false, error: 'unknown field type' };
    }
  }

  /**
   * Validate a payload. Unknown fields are dropped (reported back).
   * Fields set to null/'' are listed in `cleared` (used by updates to remove them).
   */
  function sanitizePayload(schema, payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new HttpError(400, 'payload must be an object');
    const clean = {}, errors = [], dropped = [], cleared = [];
    for (const key of Object.keys(payload)) {
      if (!Object.prototype.hasOwnProperty.call(schema, key)) { dropped.push(key); continue; }
      const r = coerce(schema[key], payload[key]);
      if (!r.ok) errors.push(`${key}: ${r.error}`);
      else if (r.value === null) cleared.push(key);
      else clean[key] = r.value;
    }
    if (errors.length) throw new HttpError(400, 'Payload failed schema validation', errors);
    return { clean, dropped, cleared };
  }

  // ---------------------------------------------------------------------
  // Local engine storage: one state object in IndexedDB, memory fallback
  // ---------------------------------------------------------------------
  const DB_NAME = 'vaultcrm', STORE = 'kv', KEY = 'state';
  const emptyState = () => ({ version: 1, registry: [], records: [] });
  let state = null, persistent = false, idb = null, loading = null;

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

  function load() {
    if (state) return Promise.resolve();
    if (!loading) {
      loading = (async () => {
        idb = await openIdb();
        const saved = idb ? await idbGet() : null;
        persistent = !!idb;
        state = saved && Array.isArray(saved.registry) && Array.isArray(saved.records) ? saved : emptyState();
      })();
    }
    return loading;
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

  function findRecord(reg, id) {
    if (!isUuid(id)) throw new HttpError(400, 'record_id must be a UUID');
    const rec = state.records.find((r) => r.id === id.toLowerCase() && r.registry_id === reg.id);
    if (!rec) throw new HttpError(404, 'Record not found in this table');
    return rec;
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

    'POST /api/vault/update-record': async (b) => {
      const reg = getRegistry(b.registry_id);
      const rec = findRecord(reg, b.record_id);
      const { clean, dropped, cleared } = sanitizePayload(reg.fields_schema, b.payload);
      verifyRefs(reg.fields_schema, clean);
      cleared.forEach((k) => { delete rec.payload[k]; });
      Object.assign(rec.payload, clean);
      rec.date_modified = now();
      await save();
      return { record: clone(rec), dropped_fields: dropped };
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
      let m;
      if (!handler && method === 'GET' && (m = path.match(/^\/api\/registry\/([^/]+)$/))) {
        handler = () => ({ table: clone(getRegistry(m[1])) });
      }
      if (!handler && method === 'DELETE' && (m = path.match(/^\/api\/vault\/record\/([^/]+)\/([^/]+)$/))) {
        handler = async () => {
          if (!isUuid(m[1]) || !isUuid(m[2])) throw new HttpError(400, 'Bad UUID');
          const i = state.records.findIndex((r) => r.id === m[2].toLowerCase() && r.registry_id === m[1].toLowerCase());
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

  const api = {
    request, exportData, importData,
    validateSchemaDef, sanitizePayload, coerce, parseType, isUuid, HttpError,
    _reset: () => { state = emptyState(); loading = Promise.resolve(); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VaultLocal = api;
})(typeof window !== 'undefined' ? window : globalThis);
