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









--WOW % Change Formula
-- ((This week completed - last week completed) / last week completd * 100)
--How to get the previous week count
--What's returned (%)
--


-- Last week completed work orders
-- WITH last_week_completed_work_orders AS (
--     SELECT 
--         COUNT(*) FILTER(WHERE status = 'completed') as total_completed,
--         COUNT(*) FILTER(WHERE status = 'in-progress') as total_in_progress
--         FROM work_orders
--         WHERE contract_id = 1 
--         AND start_date >= NOW() - INTERVAL '2 week'
--         AND start_date < NOW() - INTERVAL '1 week'  
-- )
-- SELECT 
--     COUNT(*) as total_work_orders,
--     COUNT(*) FILTER(WHERE status = 'completed') as total_completed,
--     ROUND(
--         COALESCE(COUNT(*) FILTER(WHERE status = 'completed')::numeric
--         / NULLIF(COUNT(*),0),0)
--         * 100,2) as completion_percent,

--     (COUNT(*) FILTER(WHERE status = 'completed') - MAX(lw.total_completed))::numeric
--      / NULLIF(MAX(lw.total_completed),0) * 100 as wow_completed_percent,

--     COUNT(*) FILTER(WHERE status = 'assigned') as total_assigned,
--     COUNT(*) FILTER(WHERE status = 'in-progress') as total_in_progress,
--     COUNT(*) FILTER(WHERE status = 'in-progress') - MAX(lw.total_in_progress) as wow_assigned_count,
--     COALESCE(AVG(due_date - start_date) FILTER(WHERE status = 'completed'), 0) as avg_cycle_time
-- FROM work_orders
-- CROSS JOIN last_week_completed_work_orders lw
-- WHERE contract_id = 1 
-- AND start_date >= NOW() - INTERVAL '1 week'



-- SELECT * FROM work_orders WHERE 1=1 AND contract_id = 1;

-- SELECT c.contract_name, li.id, bi.description, bi.unit_of_measure, 
--         bi.quantity, li.qty_completed, (li.qty_assigned - li.qty_completed) as remaining_qty,
--         ((li.qty_completed / li.qty_assigned) * 100) as progress
-- FROM bid_items bi
-- JOIN line_items li ON bi.id = li.bid_item_id
-- JOIN contracts c ON bi.contract_id = c.id

-- SELECT c.contract_name, li.id, bi.description, bi.unit_of_measure, 
--     bi.quantity, li.qty_completed, (li.qty_assigned - li.qty_completed) as remaining_qty,
--     ((li.qty_completed / li.qty_assigned) * 100) as progress
-- FROM bid_items bi
-- JOIN line_items li ON bi.id = li.bid_item_id
-- JOIN contracts c ON bi.contract_id = c.id 
-- WHERE 1=1 AND c.id = 5;


-- INSERT INTO line_items (work_order_id, item, description, unit, qty, qty_completed, remaining_qty)
-- VALUES
--     ('WO-2024-014', 'Coil Unit', 'AHU-3 replacement coil unit', 'EA', 1, 1, 0),
--     ('WO-2024-014', 'Refrigerant R-410A', 'Refrigerant recharge after coil swap', 'LB', 10, 10, 0),
--     ('WO-2024-014', 'Copper Tubing', '3/4 inch copper tubing for connections', 'FT', 20, 20, 0),
--     ('WO-2024-014', 'Insulation Wrap', 'Foam insulation for piping', 'FT', 15, 15, 0),
--     ('WO-2024-014', 'Brazing Rod', 'Silver brazing rods for connections', 'EA', 5, 5, 0),
--     ('WO-2024-014', 'Filter', '20x20x1 MERV-8 air filter', 'EA', 4, 4, 0),
--     ('WO-2024-014', 'Labor - Tech', 'HVAC technician labor hours', 'HR', 8, 8, 0),
--     ('WO-2024-014', 'Labor - Helper', 'Helper labor hours', 'HR', 4, 4, 0),
--     ('WO-2024-014', 'Vacuum Pump Usage', 'System evacuation service', 'HR', 2, 2, 0),
--     ('WO-2024-014', 'Nitrogen', 'Nitrogen for pressure testing', 'CF', 50, 50, 0),
--     ('WO-2024-014', 'Sheet Metal Screws', 'Misc fasteners for panel reinstall', 'EA', 12, 12, 0),
--     ('WO-2024-014', 'Condensate Pan Treatment', 'Pan treatment tablets', 'EA', 2, 2, 0);


-- SELECT 
--     work_order_id,
--     title,
--     assignee,
--     status,
--     total_items,
--     due_date - start_date as progress,
--     due_date,
--     value
-- FROM work_orders WHERE 1=1;

-- ALTER TABLE work_orders ADD items_completed NUMERIC(4,2)

-- SELECT * FROM work_orders;

-- SELECT 
--     total_items, 
--     items_completed, 
--     ROUND( 
--         COALESCE(
--         (items_completed * 100.0) / NULLIF(total_items, 0),
--                 0)
--         , 2) AS percentage_completed
-- FROM work_orders;

WITH last_week_completed_work_orders AS (
    SELECT 
        COUNT(*) FILTER(WHERE status = 'completed') as total_completed,
        COUNT(*) FILTER(WHERE status = 'in-progress') as total_in_progress
        FROM work_orders
        WHERE contract_id = 1 
        AND start_date >= NOW() - INTERVAL '2 week'
        AND start_date < NOW() - INTERVAL '1 week'  
    )

    SELECT 
        COUNT(*) as total_work_orders,
        COUNT(*) FILTER(WHERE status = 'completed') as total_completed,
        ROUND(
            COALESCE(COUNT(*) FILTER(WHERE status = 'completed')::numeric
            / NULLIF(COUNT(*),0),0)
            * 100,2) as completion_percent,

        COALESCE((COUNT(*) FILTER(WHERE status = 'completed') - MAX(lw.total_completed))::numeric
        / NULLIF(MAX(lw.total_completed),0) * 100, 0) as wow_completed_percent,

        COUNT(*) FILTER(WHERE status = 'assigned') as total_assigned,
        COUNT(*) FILTER(WHERE status = 'in-progress') as total_in_progress,
        COALESCE(COUNT(*) FILTER(WHERE status = 'in-progress') - MAX(lw.total_in_progress), 0) as wow_assigned_count,
        COALESCE(AVG(due_date - start_date) FILTER(WHERE status = 'completed'), 0) as avg_cycle_time
    FROM work_orders
    CROSS JOIN last_week_completed_work_orders lw
    WHERE contract_id = 1
    AND start_date >= NOW() - INTERVAL '1 week';