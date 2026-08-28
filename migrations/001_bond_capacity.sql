-- Run this once against the app database before using the Bond Capacity
-- dashboard chart / Settings field. No migration tool is wired up yet
-- (see CLAUDE.md "Database Notes"), so this is applied by hand, e.g.:
--   psql "$DATABASE_URL" -f migrations/001_bond_capacity.sql

CREATE TABLE IF NOT EXISTS bond_capacity (
    id SERIAL PRIMARY KEY,
    total_capacity NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO bond_capacity (total_capacity)
SELECT 0
WHERE NOT EXISTS (SELECT 1 FROM bond_capacity);
