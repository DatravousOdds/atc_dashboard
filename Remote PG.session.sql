-- This query oversee project performance by the number of completed projects
-- WITH last_time_entry AS (
--     SELECT 
--         contract_id, 
--         MAX(date_worked) AS last_entry_date
--     FROM time_entries
--     GROUP BY contract_id
-- )
-- SELECT 
--     COUNT(*) AS completed_projects, 
--     TO_CHAR(last_entry_date, 'YYYY-MM') AS month
-- FROM contracts c
-- JOIN last_time_entry lte ON c.id = lte.contract_id
-- WHERE c.status = 'completed'
-- GROUP BY TO_CHAR(last_entry_date, 'YYYY-MM')
-- ORDER BY month;





-- -- CTE approach to calculate total spend and utilization for a specific contract
-- WITH labor_costs AS (
--     SELECT 
--         t.contract_id,
--         SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS total_labor_cost
--     FROM time_entries t
--     JOIN employees e ON t.employee_id = e.id
--     GROUP BY t.contract_id
-- ),
-- invoice_totals AS (
--     SELECT 
--         contract_id,
--         SUM(amount_paid) AS total_revenue
--     FROM invoices
--     GROUP BY contract_id
-- )
-- SELECT 
--     c.contract_name AS project,
--     c.total_bid_amount AS budget,
--     ROUND(COALESCE(lc.total_labor_cost, 0), 2) AS actual_spend,
--     ROUND((COALESCE(lc.total_labor_cost, 0) / NULLIF(c.total_bid_amount, 0)) * 100, 2) AS utilization
-- FROM contracts c
-- LEFT JOIN labor_costs lc ON c.id = lc.contract_id
-- LEFT JOIN invoice_totals it ON c.id = it.contract_id




--- This SQL query calculates the project name, total revenue, total expenses (including labor costs), net profit, progress percentage based on paid invoices, and project status for each contract. It joins the contracts table with materials, employees, time entries, and invoices to gather all necessary data. The results are grouped by project name, total bid amount, material costs, and status, and ordered alphabetically by project name.
-- SELECT 
--     c.contract_name AS project,
--     c.total_bid_amount AS revenue,
--     (m.total_cost + CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2))) AS expense,
--     (c.total_bid_amount - (m.total_cost + CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)))) AS net_profit,
--     ROUND(SUM(i.amount_paid) / c.total_bid_amount * 100, 2) AS progress_percent,
--     c.status
-- FROM contracts c
-- LEFT JOIN materials m ON m.contract_id = c.id
-- LEFT JOIN employees e ON e.contract_id = c.id
-- LEFT JOIN time_entries t ON t.employee_id = e.id
-- LEFT JOIN invoices i ON i.contract_id = c.id AND i.payment_status = 'paid'
-- GROUP BY c.contract_name, c.total_bid_amount, m.total_cost, c.status
-- HAVING c.contract_name NOT LIKE '%Zamora Inc%' AND c.contract_name NOT LIKE '%TxDOT%'
-- ORDER BY c.contract_name ASC

-- SELECT
--      EXTRACT('MONTH' FROM te.date_worked)  AS month,
--     COUNT(DISTINCT c.id) AS completed_projects
-- FROM contracts c
-- INNER JOIN time_entries te ON te.contract_id = c.id
-- WHERE c.status = 'completed' AND EXTRACT('YEAR' FROM te.date_worked) = '2026'
-- GROUP BY EXTRACT('MONTH' FROM te.date_worked) 
-- ORDER BY month ASC;


-- SELECT 
--     c.contract_name AS project,
--     te.month,
--     te.year,
--     COALESCE(i.total_revenue, 0) AS total_revenue,
--     te.total_expense
-- FROM contracts c
-- JOIN (
--     SELECT 
--         e.contract_id,
--         EXTRACT(MONTH FROM t.date_worked) AS month,
--         EXTRACT(YEAR FROM t.date_worked) AS year,
--         CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS total_expense
--     FROM time_entries t
--     JOIN employees e ON t.employee_id = e.id
--     GROUP BY e.contract_id, EXTRACT(MONTH FROM t.date_worked), EXTRACT(YEAR FROM t.date_worked)
-- ) te ON te.contract_id = c.id
-- LEFT JOIN (
--     SELECT contract_id, EXTRACT(MONTH FROM invoice_date) AS invoice_month, EXTRACT(YEAR FROM invoice_date) AS invoice_year, SUM(amount_paid) AS total_revenue
--     FROM invoices
--     GROUP BY contract_id, EXTRACT(MONTH FROM invoice_date), EXTRACT(YEAR FROM invoice_date)
-- ) i ON i.contract_id = c.id AND i.invoice_month = te.month AND i.invoice_year = te.year
-- WHERE 1=1

-- SELECT 
--     c.contract_name AS project,
--     te.month,
--     te.year,
--     COALESCE(i.total_revenue, 0) AS total_revenue,
--     te.total_expense
-- FROM contracts c
-- JOIN (
--     SELECT 
--         e.contract_id,
--         EXTRACT(MONTH FROM t.date_worked) AS month,
--         EXTRACT(YEAR FROM t.date_worked) AS year,
--         CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS total_expense
--     FROM time_entries t
--     JOIN employees e ON t.employee_id = e.id
--     GROUP BY e.contract_id, EXTRACT(MONTH FROM t.date_worked), EXTRACT(YEAR FROM t.date_worked)
-- ) te ON te.contract_id = c.id
-- LEFT JOIN (
--     SELECT contract_id, EXTRACT(MONTH FROM invoice_date) AS invoice_month, EXTRACT(YEAR FROM invoice_date) AS invoice_year, SUM(amount_paid) AS total_revenue
--     FROM invoices
--     GROUP BY contract_id, EXTRACT(MONTH FROM invoice_date), EXTRACT(YEAR FROM invoice_date)
-- ) i ON i.contract_id = c.id AND i.invoice_month = te.month AND i.invoice_year = te.year
-- WHERE 1=1


-- SELECT c.contract_name AS project,
--     CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0) AS NUMERIC(10,2)) AS total_hours,
--     CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS total_labor_cost,
--     inv.total_revenue AS revenue,
--     CAST(inv.total_revenue  - SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS profit,
--     CAST((inv.total_revenue - SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate)) / NULLIF(inv.total_revenue, 0) * 100 AS NUMERIC(5,2)) AS profit_margin_percent
-- FROM contracts c
-- JOIN employees e ON c.id = e.contract_id
-- JOIN time_entries t ON t.employee_id = e.id
-- JOIN (
--     SELECT contract_id, MAX(total_amount) AS total_revenue
--     FROM invoices
--     GROUP BY contract_id
-- ) inv ON inv.contract_id = c.id
-- GROUP BY c.contract_name, inv.total_revenue;

-- SELECT 
--     c.contract_name AS project,
--     te.month,
--     te.year,
--     COALESCE(i.total_revenue, 0) AS total_revenue,
--     te.total_expense
-- FROM contracts c
-- JOIN (
--     SELECT 
--         t.contract_id,
--         EXTRACT(MONTH FROM t.date_worked) AS month,
--         EXTRACT(YEAR FROM t.date_worked) AS year,
--         CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS total_expense
--     FROM time_entries t
--     JOIN employees e ON t.employee_id = e.id
--     GROUP BY t.contract_id, EXTRACT(MONTH FROM t.date_worked), EXTRACT(YEAR FROM t.date_worked)
-- ) te ON te.contract_id = c.id
-- LEFT JOIN (
--     SELECT contract_id, EXTRACT(MONTH FROM invoice_date) AS invoice_month, EXTRACT(YEAR FROM invoice_date) AS invoice_year, SUM(amount_paid) AS total_revenue
--     FROM invoices
--     GROUP BY contract_id, EXTRACT(MONTH FROM invoice_date), EXTRACT(YEAR FROM invoice_date)
-- ) i ON i.contract_id = c.id AND i.invoice_month = te.month AND i.invoice_year = te.year
-- WHERE 1=1


-- SELECT 
--     c.contract_name AS project,
--     c.total_bid_amount AS revenue,
--     (m.total_cost + CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2))) AS expense,
--     (c.total_bid_amount - (m.total_cost + CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)))) AS net_profit,
--     ROUND(SUM(i.amount_paid) / c.total_bid_amount * 100, 2) AS progress_percent,
--     c.status
-- FROM contracts c
-- LEFT JOIN materials m ON m.contract_id = c.id
-- LEFT JOIN time_entries t ON t.contract_id = c.id
-- LEFT JOIN employees e ON t.employee_id = e.id
-- LEFT JOIN invoices i ON i.contract_id = c.id AND i.payment_status = 'paid'
-- GROUP BY c.contract_name, c.total_bid_amount, m.total_cost, c.status
-- HAVING c.contract_name NOT LIKE '%Zamora Inc%' AND c.contract_name NOT LIKE '%TxDOT%'
-- ORDER BY c.contract_name ASC


-- SELECT c.contract_name AS project,
--     CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0) AS NUMERIC(10,2)) AS total_hours,
--     CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS total_labor_cost,
--     inv.total_revenue AS revenue,
--     CAST(inv.total_revenue  - SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS profit,
--     CAST((inv.total_revenue - SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate)) / NULLIF(inv.total_revenue, 0) * 100 AS NUMERIC(5,2)) AS profit_margin_percent
-- FROM contracts c
-- JOIN time_entries t ON t.contract_id = c.id 
-- JOIN employees e ON t.employee_id = e.id
-- JOIN (
--     SELECT contract_id, MAX(total_amount) AS total_revenue
--     FROM invoices
--     GROUP BY contract_id
-- ) inv ON inv.contract_id = c.id
-- GROUP BY c.contract_name, inv.total_revenue