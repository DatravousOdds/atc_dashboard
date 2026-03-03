
-- ALTER TABLE invoices
-- ADD COLUMN client_id INT REFERENCES clients(id);

-- INSERT INTO contracts 
-- (contract_name, total_bid_amount, status, bid_open, bid_close, awarded_to, reference_number, date_awarded)
-- VALUES ('SH190 & Midway Rd', 148889.29, 'pending', '08/07/2025', '08/10/2025', 1, '202508072007', '08/10/2025');


-- INSERT INTO invoices (contract_id, payment_status, invoice_date, invoice_number, amount_paid, total_amount, client_id)
-- VALUES (1, 'pending', '2026-02-25', '202601240801', 30271.75, 178253.25, 1)

-- update invoices
-- set amount_paid = 8262.50
-- where id = 1;

-- DROP TABLE vendors;

-- SELECT * FROM invoices;

-- TRUNCATE TABLE contracts RESTART IDENTITY CASCADE;


-- CREATE TABLE quotes (
--   contract_id INT REFERENCES contracts(id),
--   vendor_id INT REFERENCES vendors(id),
--   bid_item_id INT REFERENCES bid_items(id),
--   quote_number VARCHAR(50),
--   payment_terms VARCHAR(100),
--   unit_price NUMERIC(10,2),
--   line_total NUMERIC(10,2)

-- )

-- CREATE TABLE vendors (
--   id INT PRIMARY KEY,
--   name VARCHAR(100),
--   address VARCHAR(100),
--   phone VARCHAR(50)

-- )

-- CREATE TABLE materials (
--   id INT PRIMARY KEY,
--   contract_id INT REFERENCES contracts(id),
--   vendor_id INT REFERENCES vendors(id),
--   bid_item_id INT REFERENCES bid_items(id),
--   quantity NUMERIC(10,0),
--   unit_cost NUMERIC(10,2),
--   total_cost NUMERIC(10,2),
--   date_used DATE
-- )

-- SELECT 
--     CAST(
--         i.total_amount - 
--         SUM(EXTRACT(EPOCH FROM t.hours_worked)
--         / 3600.0 * e.hourly_rate) 
--     AS NUMERIC(10,2)) as profit,
--     CAST
--     (
--         SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)
--     ) AS labor_cost
-- FROM contracts c
-- JOIN employees e ON c.id = e.contract_id
-- JOIN time_entries t ON t.employee_id = e.id
-- JOIN invoices i ON i.contract_id = c.id
-- WHERE c.id = 1
-- GROUP BY i.total_amount;

-- SELECT COUNT(*) FROM invoices WHERE contract_id = 1;

SELECT c.contract_name AS project,
    CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0) AS NUMERIC(10,2)) AS total_hours,
    CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS total_labor_cost,
    inv.total_revenue AS revenue,
    CAST(inv.total_revenue - SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS profit,
    CAST((inv.total_revenue - SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate)) / NULLIF(inv.total_revenue, 0) * 100 AS NUMERIC(5,2)) AS profit_margin_percent
FROM contracts c
JOIN employees e ON c.id = e.contract_id
JOIN time_entries t ON t.employee_id = e.id
JOIN (
    SELECT contract_id, SUM(total_amount) AS total_revenue
    FROM invoices
    GROUP BY contract_id
) inv ON inv.contract_id = c.id
WHERE 1=1
GROUP BY c.contract_name, inv.total_revenue;


-- SELECT CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0) AS NUMERIC(10,2)) AS total_hours
-- FROM time_entries t
-- JOIN employees e ON t.employee_id = e.id
-- JOIN contracts c ON e.contract_id = c.id
-- WHERE c.id = 1;

-- SELECT
--     cl.name AS customer,
--     c.contract_name AS project,
--     i.total_amount AS revenue
-- FROM contracts c
-- JOIN invoices i ON i.contract_id = c.id
-- JOIN clients cl ON i.client_id = cl.id
-- WHERE 1=1 AND i.payment_status = 'pending'
-- ORDER BY i.total_amount DESC
            


-- SELECT v.name AS vendor_name,
--        bi.description AS item,
--        LAG(m.unit_cost, 1, 0.00) OVER (PARTITION BY v.id ORDER BY m.date_used) AS previous_price,
--         m.unit_cost AS current_price,
--         m.unit_cost - LAG(m.unit_cost, 1, 0.00) OVER (PARTITION BY v.id ORDER BY m.date_used) AS price_change
-- FROM materials m
-- JOIN vendors v ON m.vendor_id = v.id
-- JOIN bid_items bi ON m.bid_item_id = bi.id
-- WHERE m.contract_id = 1
-- ORDER BY m.date_used DESC;                                                                                                                           


-- SELECT 
--     TO_CHAR(i.invoice_date, 'Mon YYYY') as period,
--     i.total_amount AS total_revenue,
--     CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2))  AS total_expense
-- FROM contracts c
-- JOIN employees e ON c.id = e.contract_id
-- JOIN time_entries t ON t.employee_id = e.id
-- JOIN invoices i ON i.contract_id = c.id
-- WHERE 1=1
-- GROUP BY period, i.invoice_date, i.total_amount
-- ORDER BY i.invoice_date ASC;


-- SELECT * FROM contracts;


-- SELECT c.contract_name,
--         CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0) AS NUMERIC(10,2)) AS total_hours,
--         CAST
--         (
--             SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate)
--         AS NUMERIC(10,2)) AS total_labor_cost,
--         i.total_amount AS revenue,
--         CAST
--         (
--             i.total_amount - 
--             SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) 
--         AS NUMERIC(10,2)) AS profit,
--         CAST 
--         (
--             (i.total_amount - 
--             SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate)) / NULLIF(i.total_amount, 0) * 100 
--         AS NUMERIC(5,2)) AS profit_margin_percentage
        
-- FROM contracts c
-- JOIN employees e ON c.id = e.contract_id
-- JOIN time_entries t ON t.employee_id = e.id
-- JOIN invoices i ON i.contract_id = c.id
-- WHERE c.id = 1
-- GROUP BY c.contract_name;


-- SELECT  SUM(i.total_amount) as total_revenue
--             FROM invoices i
--             WHERE 1=1;




-- Total labor cost is each person's hours worked multiplied by their labor cost per hour, summed across all personnel on the project.
-- SELECT 
--     c.contract_name AS project,
--    CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0) AS NUMERIC(10,2)) AS total_hours,
--     e.first_name AS employee_first_name,
--     e.hourly_rate AS labor_cost_per_hour,
--     CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS total_labor_cost
-- FROM contracts c
-- JOIN employees e ON c.id = e.contract_id
-- JOIN time_entries t ON t.employee_id = e.id
-- WHERE c.id = 1
-- GROUP BY c.contract_name, e.first_name, e.hourly_rate;
