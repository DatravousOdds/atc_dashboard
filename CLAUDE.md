# Project Overview

ATC Analytics Dashboard — an internal tool for ATC's CEO and leadership to monitor
construction projects, work orders, inventory, invoicing, and bid/contract analysis
in one place.

Core tabs (sidebar, single-page app):
- **Dashboard** — high-level KPIs and charts (revenue vs. expense, win rate, project performance)
- **Projects** — per-project analysis: work completed, budget utilization, time-to-complete
  (time tracking is sourced from an external app called **Timero**, not built here)
- **Work Orders** — create/assign work orders to a project; line items (qty, unit, material,
  equipment, observations), date ranges, and Excel import of work order assignments
- **Inventory**
- **Pull Reports**
- **Invoices** — submitted invoices and outstanding/unpaid invoices
- **Contract/Bid AI Agent** — parses construction bid proposals and contract documents to
  extract structured contract info (not yet implemented — see Known Gaps)
- **Settings**
- **Log out**

## Tech Stack

- **Backend**: Node.js + Express 5, raw SQL via `pg` (no ORM)
- **Database**: PostgreSQL (connection via `pg.Pool`, credentials in `.env`, gitignored)
- **Frontend**: Vanilla JS (ES modules) + jQuery — no framework, no bundler, no build step.
  `public/` is served directly via `express.static`.
- **Libraries (loaded via CDN in `public/index.html`, not bundled)**: Chart.js, DataTables
  (+ percentBar plugin), SheetJS/xlsx (Excel import), Flatpickr (date range picker),
  Font Awesome
- **Dev**: `nodemon` for the `dev` script. No test suite configured (`npm test` is a stub).

## Architecture Reality Check

This matters more than usual here because the folder structure implies an MVC layout that
**does not actually exist yet**:

- `src/controllers`, `src/models`, `src/middleware`, `src/utils` — all **empty stubs**.
- `src/routes/contracts.js` — exists but is **dead code**, not wired into `server.js`.
- Almost everything actually lives in **`server.js`** (~950 lines): Express setup, the `pg`
  Pool, and every route handler with its SQL inline.
- Routes are defined directly with `app.get(...)` / `app.post(...)` — there is no
  `express.Router()` split by resource yet.
- Frontend is one `public/index.html` with sidebar `<li data-tab="...">` items that toggle
  `.tab-content` panels via plain JS in `public/js/main.js` — not a router, just show/hide.

When asked to add backend functionality, default to following the existing pattern (inline
route + inline SQL in `server.js`) unless the user asks for a refactor into the `src/`
structure. Don't silently start a parallel MVC layer for one new route — that produces two
inconsistent patterns in the same codebase.

## Key Files

- `server.js` — Express app, DB pool, and all API routes (`/api/contracts/*`, `/api/projects/*`)
- `public/index.html` — single HTML shell, all tabs/panels live here
- `public/js/main.js` — sidebar/tab switching, core page wiring
- `public/js/charts.js` — Chart.js setup for dashboard/project charts
- `public/js/dataTables.js` — DataTables init for tabular views
- `public/js/workOrders.js` — work order modal, line items, Excel import logic
- `public/js/flatpickr.js` — date range picker config
- `public/js/shared.js` / `theme.js` — shared helpers, theme toggling
- `public/css/variables.css` — design tokens (colors, spacing)
- `Remote PG.session.sql` — scratch SQL queries used while designing dashboard metrics
  (useful as schema/metric reference, not executed by the app)

## Database Notes

No formal schema file exists in-repo — infer table shapes from queries in `server.js` and
`Remote PG.session.sql`. Known tables referenced in queries:

`contracts`, `bid_items`, `contractor_bids`, `clients`, `vendors`, `employees`,
`time_entries`, `materials`, `invoices`, `work_orders`, `line_items`

Notable relationships seen in queries:
- `time_entries` joins `employees` (hourly_rate) to compute labor cost
- `invoices.payment_status` distinguishes paid vs. unpaid
- `contracts.status` drives win/loss and completed-project metrics
- Work order endpoints are nested under `/api/contracts/work-orders/:id/...` even though
  conceptually they're their own feature — match this existing route prefix unless asked
  to restructure.

Before adding a new metric/endpoint, check `Remote PG.session.sql` first — there may already
be a hand-tuned query for it.

## Conventions & Preferences

- Match existing code style in `server.js`: `async (req, res) => { try { ... } catch (err) {
  console.log(err.message) } }`. Don't introduce a different error-handling pattern in one
  route while the rest of the file uses this one.
- Build SQL with parameterized queries (`$1`, `$2`, ...) appended conditionally based on
  query params — follow the existing `WHERE 1=1` + dynamic `AND` pattern used throughout
  `server.js` (see `/api/contracts`).
- Frontend JS is plain DOM/jQuery — no JSX, no framework components. Keep new UI code
  consistent with that (vanilla DOM manipulation, event listeners, `data-*` attributes for
  state).
- No bundler: new third-party frontend libraries should be added as a `<script>`/`<link>`
  CDN tag in `index.html` like the existing ones, not via npm + import, unless the user
  explicitly wants to introduce a build step.
- `.env` holds `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` — never commit
  real values, never print `.env` contents back.

## Known Gaps / Things Not to Assume Exist

- No authentication/session logic yet — "Log out" button is UI-only.
- No tests — don't claim something is "verified" without manually checking the running app.
- The contract/bid-parsing AI agent feature (parsing bid proposals/contracts) has not been
  built yet — there's no AI integration in the codebase currently.
- `chart.js` v4 is in `package.json` dependencies but the page actually loads Chart.js v3.9.1
  from a CDN — don't assume the npm-installed version is what's running in the browser.
- `d3` is required in `server.js` (`const { path } = require('d3')`) but appears unused —
  flag before relying on it, don't assume it's load-bearing.
