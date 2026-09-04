-- Adds the field-facing weekly progress report workflow: a per-work-order
-- token link for foremen to submit quantities against (no login), and a
-- pending/approved report record that an office admin reviews before it's
-- applied to line_items/work_orders (see the "Progress Reports" tab).
-- No migration tool is wired up yet (see CLAUDE.md "Database Notes"), so
-- this is applied by hand:
--   psql "$DATABASE_URL" -f migrations/003_field_reports.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS field_report_links (
    id SERIAL PRIMARY KEY,
    token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (work_order_id)
);

CREATE TABLE IF NOT EXISTS weekly_reports (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    foreman_name VARCHAR(255),
    crew_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS weekly_report_line_items (
    id SERIAL PRIMARY KEY,
    weekly_report_id INTEGER NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
    bid_item_id INTEGER NOT NULL REFERENCES bid_items(id),
    qty_this_week NUMERIC NOT NULL
);
