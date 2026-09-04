-- Adds per-day quantities, material, and equipment to line_items so this
-- data survives past work order creation (used in the assignment email PDF).
-- No migration tool is wired up yet (see CLAUDE.md "Database Notes"), so
-- this is applied by hand, e.g.:
--   psql "$DATABASE_URL" -f migrations/002_line_item_details.sql

ALTER TABLE line_items
    ADD COLUMN IF NOT EXISTS mon INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tue INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS wed INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS thu INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fri INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS material VARCHAR(255),
    ADD COLUMN IF NOT EXISTS equipment VARCHAR(255);
