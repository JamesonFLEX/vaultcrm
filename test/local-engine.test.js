'use strict';
/** Browser-mode engine (public/local-engine.js) — runs in Node with memory storage. */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const V = require('../public/local-engine.js');

beforeEach(() => V._reset());

test('full CRM flow matches the server API', async () => {
  const call = (m, u, b) => V.request(m, u, b);

  assert.equal((await call('GET', '/api/health')).status, 200);

  const acc = await call('POST', '/api/registry/create-table', { app_name: 'Sales', table_name: 'Accounts', fields_schema: { name: 'TEXT' } });
  assert.equal(acc.status, 201);
  const accId = acc.body.registry_id;
  assert.equal((await call('POST', '/api/registry/create-table', { app_name: 'Sales', table_name: 'Accounts', fields_schema: { name: 'TEXT' } })).status, 409);

  const con = await call('POST', '/api/registry/create-table', {
    app_name: 'Sales', table_name: 'Contacts', fields_schema: { first_name: 'TEXT', amount: 'NUMBER', account: 'REF:' + accId }
  });
  const conId = con.body.registry_id;

  const acme = (await call('POST', '/api/vault/insert-record', { registry_id: accId, payload: { name: 'Acme Solar' } })).body.record;
  const ann = await call('POST', '/api/vault/insert-record', { registry_id: conId, payload: { first_name: 'Ann', amount: '900', junk: 1 } });
  assert.equal(ann.status, 201);
  assert.deepEqual(ann.body.dropped_fields, ['junk']);
  assert.equal(ann.body.record.payload.amount, 900);

  assert.equal((await call('POST', '/api/vault/insert-record', { registry_id: conId, payload: { amount: 'lots' } })).status, 400);
  assert.equal((await call('POST', '/api/vault/insert-record', { registry_id: conId, payload: { account: ann.body.record.id } })).status, 400);

  const link = await call('POST', '/api/vault/link-records', { registry_id: conId, record_id: ann.body.record.id, field: 'account', target_record_id: acme.id });
  assert.equal(link.body.record.payload.account, acme.id);

  const q = await call('POST', '/api/vault/query-records', { registry_id: conId, filterField: 'account', filterValue: acme.id, expand: true });
  assert.equal(q.body.records.length, 1);
  assert.equal(q.body.refs[acme.id].payload.name, 'Acme Solar');
  assert.equal((await call('POST', '/api/vault/query-records', { registry_id: conId, filterField: 'amount', filterValue: '900' })).body.records.length, 1);
  assert.equal((await call('POST', '/api/vault/query-records', { registry_id: accId })).body.records.length, 1);

  const list = await call('GET', '/api/registry/list');
  assert.equal(list.body.tables.find((t) => t.id === conId).record_count, 1);

  const unlink = await call('POST', '/api/vault/link-records', { registry_id: conId, record_id: ann.body.record.id, field: 'account', target_record_id: null });
  assert.equal(unlink.body.record.payload.account, undefined);

  assert.equal((await call('DELETE', `/api/vault/record/${conId}/${ann.body.record.id}`)).status, 200);
  assert.equal((await call('DELETE', `/api/vault/record/${conId}/${ann.body.record.id}`)).status, 404);
});

test('backup export/import round-trips and rejects junk', async () => {
  const t = await V.request('POST', '/api/registry/create-table', { app_name: 'A', table_name: 'T', fields_schema: { n: 'NUMBER' } });
  await V.request('POST', '/api/vault/insert-record', { registry_id: t.body.registry_id, payload: { n: 5 } });
  const backup = await V.exportData();

  V._reset();
  assert.deepEqual(await V.importData(backup), { tables: 1, records: 1 });
  await assert.rejects(V.importData('not json'));
  await assert.rejects(V.importData('{"registry":[],"records":[{"id":"x"}]}'));
});

test('new field types validate in both modes', () => {
  const s = V.validateSchemaDef({ site: 'URL', mail: 'EMAIL', tel: 'PHONE', body: 'LONGTEXT', status: 'CHOICE: Intake | Delivered ' });
  assert.equal(s.status, 'CHOICE:Intake|Delivered');
  const ok = V.sanitizePayload(s, { site: 'https://example.com', mail: 'a@b.co', tel: '(916) 555-0100', body: 'x', status: 'Delivered' });
  assert.equal(ok.clean.site, 'https://example.com/');
  for (const bad of [{ site: 'javascript:alert(1)' }, { site: 'example.com' }, { mail: 'nope' }, { tel: '12' }, { status: 'delivered' }]) {
    assert.throws(() => V.sanitizePayload(s, bad), (e) => e.status === 400, JSON.stringify(bad));
  }
  assert.throws(() => V.validateSchemaDef({ x: 'CHOICE:' }), (e) => e.status === 400);
  assert.throws(() => V.validateSchemaDef({ x: 'CHOICE:a|a' }), (e) => e.status === 400);
});

test('update-record merges, clears, validates', async () => {
  const t = await V.request('POST', '/api/registry/create-table', { app_name: 'A', table_name: 'P', fields_schema: { title: 'TEXT', status: 'CHOICE:Open|Done', due: 'DATE' } });
  const id = t.body.registry_id;
  const rec = (await V.request('POST', '/api/vault/insert-record', { registry_id: id, payload: { title: 'Loop', status: 'Open', due: '2026-11-01' } })).body.record;
  const up = await V.request('POST', '/api/vault/update-record', { registry_id: id, record_id: rec.id, payload: { status: 'Done', due: null } });
  assert.equal(up.status, 200);
  assert.deepEqual(up.body.record.payload, { title: 'Loop', status: 'Done' });
  assert.equal((await V.request('POST', '/api/vault/update-record', { registry_id: id, record_id: rec.id, payload: { status: 'Maybe' } })).status, 400);
  const other = await V.request('POST', '/api/registry/create-table', { app_name: 'A', table_name: 'Q', fields_schema: { n: 'TEXT' } });
  assert.equal((await V.request('POST', '/api/vault/update-record', { registry_id: other.body.registry_id, record_id: rec.id, payload: { n: 'x' } })).status, 404);
});
