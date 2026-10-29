-- =====================================================================
-- VaultCRM :: Storage Layer
-- Hybrid relational/document engine. Zero dynamic DDL at runtime.
-- All user "tables" live as rows in sys_registry; all user data lives
-- as JSONB rows in app_records_vault, isolated by registry_id.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- Registry: one row per user-defined table
-- fields_schema example:
--   {"first_name":"TEXT","amount":"NUMBER","close_date":"DATE",
--    "is_active":"BOOLEAN","account":"REF:<registry uuid>"}
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sys_registry (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_name       VARCHAR(100) NOT NULL,
    table_name     VARCHAR(100) NOT NULL,
    fields_schema  JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fields_schema_is_object CHECK (jsonb_typeof(fields_schema) = 'object'),
    CONSTRAINT uq_app_table UNIQUE (app_name, table_name)
);

-- ---------------------------------------------------------------------
-- Vault: every record for every user table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_records_vault (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registry_id    UUID        NOT NULL REFERENCES sys_registry(id) ON DELETE CASCADE,
    payload        JSONB       NOT NULL DEFAULT '{}'::jsonb,
    date_created   TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_modified  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT payload_is_object CHECK (jsonb_typeof(payload) = 'object')
);

-- ---------------------------------------------------------------------
-- Indexes
-- jsonb_path_ops GIN: ~30-50% smaller than default jsonb_ops and faster
-- for the @> containment operator, which is the only JSONB operator the
-- API uses. Matters on a 2GB box.
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_vault_payload_gin
    ON app_records_vault USING GIN (payload jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_vault_registry_id
    ON app_records_vault USING BTREE (registry_id);

-- Composite for the default "list newest records in a table" grid view
CREATE INDEX IF NOT EXISTS idx_vault_registry_created
    ON app_records_vault (registry_id, date_created DESC);

-- ---------------------------------------------------------------------
-- Auto-maintain modified timestamps
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_touch_registry() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_touch_vault() RETURNS trigger AS $$
BEGIN
    NEW.date_modified := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_registry ON sys_registry;
CREATE TRIGGER touch_registry BEFORE UPDATE ON sys_registry
    FOR EACH ROW EXECUTE FUNCTION trg_touch_registry();

DROP TRIGGER IF EXISTS touch_vault ON app_records_vault;
CREATE TRIGGER touch_vault BEFORE UPDATE ON app_records_vault
    FOR EACH ROW EXECUTE FUNCTION trg_touch_vault();
