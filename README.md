# VaultCRM

![CI](../../actions/workflows/ci.yml/badge.svg)

Self-hosted low-code database + CRM. PostgreSQL JSONB storage, Express API, Tailwind dashboard. Sized for 1 vCPU / 2 GB RAM.

## Two ways to run it

| | **Browser mode** (GitHub Pages) | **Server mode** (Docker) |
|---|---|---|
| Where | `https://<user>.github.io/vaultcrm/` | Any VPS, 1 vCPU / 2 GB |
| Storage | This browser only (IndexedDB) | PostgreSQL |
| Sync across devices | No — use Export/Import backup | Yes |
| Cost | Free | ~$5–6/month |

Browser mode turns on automatically on `*.github.io` (or add `?local=1` to the URL). It uses the same field types, validation and relationship rules as the server (`public/local-engine.js`), and backups export as JSON.

**Turn on GitHub Pages:** repo Settings → Pages → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)`.

**Browser-mode caution:** clearing site data or using private browsing wipes it. Export a backup regularly.

## Repo layout

```
init.sql              PostgreSQL schema (loaded automatically by Docker)
server.js             Express API + validation engine
index.html            GitHub Pages entry (redirects to public/)
public/index.html     Dashboard (served by the API, or by Pages)
public/local-engine.js  In-browser engine for GitHub Pages mode
test/                 Validator, server API, and browser-engine tests
docker-compose.yml    Postgres + app with memory limits
Dockerfile            App image
.github/workflows/    CI: schema load, tests vs. real Postgres, Docker build
```

## Deploy (checklist)

- [ ] Install Docker + Docker Compose on the server
- [ ] `git clone` this repo onto the server
- [ ] `cp .env.example .env` and set `PGPASSWORD` and `API_KEY`
- [ ] `docker compose up -d --build`
- [ ] Open `http://<server-ip>:3000`, paste your `API_KEY` in the header box
- [ ] Put it behind HTTPS (Caddy or Nginx) before real data goes in

## How it works

- **No runtime DDL.** A "table" is a row in `sys_registry`. Every record is a row in `app_records_vault`, scoped by `registry_id`.
- **Field types:** `TEXT`, `NUMBER`, `DATE`, `BOOLEAN`, `REF:<registry_id>`.
- **Validation:** every insert is checked against `fields_schema`. Bad types → 400. Unknown fields → dropped and reported in `dropped_fields`.
- **Index:** GIN `jsonb_path_ops` on `payload` powers `@>` filters.

## Relationships (Contact → Account)

1. Create `Accounts` table.
2. Create `Contacts` with a field `account: "REF:<accounts registry_id>"`.
3. Insert a contact with `account: "<account record uuid>"` — or link later:

```
POST /api/vault/link-records
{ "registry_id": "<contacts>", "record_id": "<contact>", "field": "account", "target_record_id": "<account>" }
```

`target_record_id: null` unlinks. The server confirms the target record exists **in the right table** before writing.

- Contact → its Account: `query-records` with `expand: true` (one extra query, no N+1).
- Account → all its Contacts: `query-records` on Contacts with `filterField: "account", filterValue: "<account uuid>"` (hits the GIN index).

## API

| Method | Path | Body |
|---|---|---|
| GET | `/api/health` | — |
| POST | `/api/registry/create-table` | `app_name, table_name, fields_schema` |
| GET | `/api/registry/list` | — |
| GET | `/api/registry/:id` | — |
| POST | `/api/vault/insert-record` | `registry_id, payload` |
| POST | `/api/vault/query-records` | `registry_id, filterField?, filterValue?, limit?, offset?, expand?` |
| POST | `/api/vault/link-records` | `registry_id, record_id, field, target_record_id` |
| DELETE | `/api/vault/record/:registryId/:id` | — |

All `/api` routes except `/health` require header `x-api-key` when `API_KEY` is set.

## Develop / test

```
npm install
npm test                 # validator tests only
PGHOST=localhost npm test  # + full API tests against a database loaded with init.sql
```

## Known limits

- Single shared API key — no per-user accounts or roles yet.
- Filters are exact-match only (`@>`). No ranges, "contains" text search, or sorting by field yet.
- Schemas are create-only — no edit-table endpoint yet.
- Deleting a record doesn't clear REF fields pointing at it; those show as a short ID in the grid.
