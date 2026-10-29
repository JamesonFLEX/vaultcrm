'use strict';
/**
 * VaultCRM test suite (node:test, no extra dependencies).
 * - Validator tests always run.
 * - API tests run when a database is reachable (PGHOST etc. set), e.g. in CI.
 */
const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const { app, pool, validateSchemaDef, sanitizePayload } = require('../server.js');

const ACCT = '3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b';
const status = (fn) => { try { fn(); return 200; } catch (e) { return e.status; } };

describe('schema validation', () => {
  test('normalizes type names', () => {
    const s = validateSchemaDef({ a: 'text', b: 'Number', c: 'REF:' + ACCT.toUpperCase() });
    assert.deepEqual(s, { a: 'TEXT', b: 'NUMBER', c: 'REF:' + ACCT });
  });
  test('rejects unknown types, bad names, empty schemas', () => {
    assert.equal(status(() => validateSchemaDef({ x: 'JSON' })), 400);
    assert.equal(status(() => validateSchemaDef({ 'drop table;': 'TEXT' })), 400);
    assert.equal(status(() => validateSchemaDef({})), 400);
  });
});

describe('payload validation', () => {
  const schema = validateSchemaDef({ first_name: 'TEXT', amount: 'NUMBER', close_date: 'DATE', active: 'BOOLEAN', account: 'REF:' + ACCT });

  test('coerces values and drops unknown fields', () => {
    const r = sanitizePayload(schema, { first_name: 'Ann', amount: '1250.50', close_date: '2026-11-01', active: 'true', account: ACCT, hacker: 'x' });
    assert.deepEqual(r.clean, { first_name: 'Ann', amount: 1250.5, close_date: '2026-11-01', active: true, account: ACCT });
    assert.deepEqual(r.dropped, ['hacker']);
  });
  test('rejects bad values', () => {
    for (const bad of [{ amount: 'abc' }, { amount: 'Infinity' }, { close_date: '2026-02-31' },
      { close_date: '11/01/2026' }, { account: '1' }, { first_name: { $gt: '' } }]) {
      assert.equal(status(() => sanitizePayload(schema, bad)), 400, JSON.stringify(bad));
    }
    assert.equal(status(() => sanitizePayload(schema, ['a'])), 400);
  });
  test('skips empty strings', () => {
    assert.deepEqual(sanitizePayload(schema, { first_name: '', amount: '' }).clean, {});
  });
});

describe('API (needs database)', { skip: !process.env.PGHOST && 'PGHOST not set' }, () => {
  let base, server;
  const call = async (method, url, body) => {
    const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  };
  after(async () => { server && server.close(); await pool.end(); });

  test('full CRM flow: tables, records, filters, links', async () => {
    server = app.listen(0);
    base = `http://127.0.0.1:${server.address().port}`;
    const app_name = 'test_' + Date.now();

    assert.equal((await call('GET', '/api/health')).status, 200);

    const acc = await call('POST', '/api/registry/create-table', { app_name, table_name: 'Accounts', fields_schema: { name: 'TEXT' } });
    assert.equal(acc.status, 201);
    const accId = acc.body.registry_id;

    const dup = await call('POST', '/api/registry/create-table', { app_name, table_name: 'Accounts', fields_schema: { name: 'TEXT' } });
    assert.equal(dup.status, 409);

    const con = await call('POST', '/api/registry/create-table', {
      app_name, table_name: 'Contacts', fields_schema: { first_name: 'TEXT', amount: 'NUMBER', account: 'REF:' + accId }
    });
    assert.equal(con.status, 201);
    const conId = con.body.registry_id;

    const acme = (await call('POST', '/api/vault/insert-record', { registry_id: accId, payload: { name: 'Acme Solar' } })).body.record;
    const ann = await call('POST', '/api/vault/insert-record', { registry_id: conId, payload: { first_name: 'Ann', amount: '900', junk: 1 } });
    assert.equal(ann.status, 201);
    assert.deepEqual(ann.body.dropped_fields, ['junk']);
    assert.equal(ann.body.record.payload.amount, 900);

    const bad = await call('POST', '/api/vault/insert-record', { registry_id: conId, payload: { amount: 'lots' } });
    assert.equal(bad.status, 400);

    // A REF must point at a record in the correct table
    const wrongRef = await call('POST', '/api/vault/insert-record', { registry_id: conId, payload: { account: ann.body.record.id } });
    assert.equal(wrongRef.status, 400);

    const link = await call('POST', '/api/vault/link-records', { registry_id: conId, record_id: ann.body.record.id, field: 'account', target_record_id: acme.id });
    assert.equal(link.status, 200);
    assert.equal(link.body.record.payload.account, acme.id);

    const byAccount = await call('POST', '/api/vault/query-records', { registry_id: conId, filterField: 'account', filterValue: acme.id, expand: true });
    assert.equal(byAccount.body.records.length, 1);
    assert.equal(byAccount.body.refs[acme.id].payload.name, 'Acme Solar');

    const byAmount = await call('POST', '/api/vault/query-records', { registry_id: conId, filterField: 'amount', filterValue: '900' });
    assert.equal(byAmount.body.records.length, 1);

    const isolated = await call('POST', '/api/vault/query-records', { registry_id: accId });
    assert.equal(isolated.body.records.length, 1);

    const unlink = await call('POST', '/api/vault/link-records', { registry_id: conId, record_id: ann.body.record.id, field: 'account', target_record_id: null });
    assert.equal(unlink.body.record.payload.account, undefined);

    const upd = await call('POST', '/api/vault/update-record', { registry_id: conId, record_id: ann.body.record.id, payload: { amount: '1200', first_name: null } });
    assert.equal(upd.status, 200);
    assert.deepEqual(upd.body.record.payload, { amount: 1200 });
    assert.equal((await call('POST', '/api/vault/update-record', { registry_id: conId, record_id: ann.body.record.id, payload: { amount: 'x' } })).status, 400);
    assert.equal((await call('POST', '/api/vault/update-record', { registry_id: accId, record_id: ann.body.record.id, payload: { name: 'x' } })).status, 404);

    const typed = await call('POST', '/api/registry/create-table', { app_name, table_name: 'Typed', fields_schema: { site: 'URL', status: 'CHOICE:Open|Done' } });
    assert.equal(typed.status, 201);
    assert.equal((await call('POST', '/api/vault/insert-record', { registry_id: typed.body.registry_id, payload: { status: 'Nope' } })).status, 400);
    assert.equal((await call('POST', '/api/vault/insert-record', { registry_id: typed.body.registry_id, payload: { site: 'https://x.io', status: 'Open' } })).status, 201);

    const del = await call('DELETE', `/api/vault/record/${conId}/${ann.body.record.id}`);
    assert.equal(del.status, 200);
  });
});
