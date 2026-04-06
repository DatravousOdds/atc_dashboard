const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { path } = require('d3');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));


// PostgreSQL Connection
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
    // connectionString: process.env.DATABASE_URL,
    // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});


// Test the connection
pool.query('SELECT NOW()', (err,res) => {
    if (err) {
        console.error('❌ Database connection failed:', err)
    } else {
        console.log('✅ Database connected successfully!', res.rows[0])
    }
})

// Routes
app.get('/api/contracts', async(req, res) => {
    try {
        const {year, month, contract, status } = req.query;
        // console.log(contract,year,month)

        let query = `SELECT * FROM contracts WHERE 1=1`;

        const params = []

        if (year && year !== 'all') {
            query += ' AND EXTRACT(YEAR FROM date_awarded) = $' + (params.length + 1)
            params.push(year)
        }

        if (month && month !== 'all') {
            query += ' AND EXTRACT(MONTH FROM date_awarded) = $' + (params.length + 1)
            params.push(month)
        }

        if (contract && contract !=='all') {
            query += ' AND contract_name = $' + (params.length + 1)
            params.push(contract)
        }

        if (status) {
            query+= ' AND status = $' + (params.length + 1)
            params.push(status)
        }

        const result = await pool.query(query, params)
        res.json(result.rows)
        // console.log(result.rows)

    } catch (err) {
        console.log(err.message)
    }
});

app.get('/api/contracts/value', async(req, res) => {
    try {
        const { contractId, year, month } = req.query;
        let query = 'SELECT SUM(total_bid_amount) as total_contract_value FROM contracts WHERE 1=1';
        const params = [];

        if (contractId && contractId !== 'all') {
            query += ' AND id = $' + (params.length + 1)
            params.push(contractId)
        }

        if (year && year !== 'all') {
            query += ' AND EXTRACT(YEAR FROM date_awarded) = $' + (params.length + 1)
            params.push(year)
        }

        if (month && month !== 'all') {
            query += ' AND EXTRACT(MONTH FROM date_awarded) = $' + (params.length + 1)
            params.push(month)
        }

        // console.log('Total Contract Value Query:', query);
        // console.log('With Parameters:', params);

        const result = await pool.query(query, params)

        // console.log("Total Contract Value Result:", result.rows[0]);
        res.json(result.rows[0])
    } catch (error) {
        
    }
    
    // console.log(result.rows)
})

// get contracts completed each month FILTERS: (year, month)
app.get('/api/contracts/perMonth', async(req, res) => {
    const { year, month } = req.query;

    let query = 
    `SELECT 
        count(*),
        EXTRACT(MONTH FROM date_awarded) as month,
        EXTRACT(YEAR FROM date_awarded) as year
    FROM contracts
    WHERE 1=1
        AND status = 'active'
    `;
    const params = [];
    
    if (year && year !== 'all') {
        query += ' AND EXTRACT(YEAR FROM date_awarded) = $' + (params.length + 1);
        params.push(year);
    }

    if (month && month !== 'all') {
        query += ' AND EXTRACT(MONTH FROM date_awarded) = $' + (params.length + 1);
        params.push(month);
    }

    query += ` GROUP BY EXTRACT(MONTH FROM date_awarded), EXTRACT(YEAR FROM date_awarded)`;

    const result = await pool.query(query, params)

    // console.log( "contracts per month:", result.rows)
    res.json(result.rows)
    
})

// awaiting invoices to be paid
app.get('/api/contracts/win-rate', async(req, res) => {
    try {
        const { contractId, year, month } = req.query;
            let query = `
                SELECT  SUM(i.amount_paid) as pending_invoices
                FROM invoices i
                WHERE 1=1 AND i.payment_status = 'pending'
                 
                    
            `; 

            const params = [];

            if (contractId && contractId !== 'all') {
                query += ' AND i.contract_id = $' + (params.length + 1)
                params.push(contractId)
            }

            if (year && year !== 'all') {
                query += ' AND EXTRACT(YEAR FROM invoice_date) = $' + (params.length + 1)
                params.push(year)
            }

            if (month && month !== 'all') {
                query += ' AND EXTRACT(MONTH FROM invoice_date) = $' + (params.length + 1)
                params.push(month)
            }

            query += ` GROUP BY i.payment_status`;

            const result = await pool.query(query, params)

            // console.log("results: ", { pending_invoices: result.rows[0]?.pending_invoices || 0 });

            res.json({ pending_invoices: result.rows[0]?.pending_invoices || 0 })
    
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch win rate data' });
        console.log("Error occurred when fetching win rate data...", error)
    }
})

// ========================
//  Contracts Routes
// ========================
app.get('/api/contracts/year/dropdown', async(req,res) => {
    const query = 'SELECT DISTINCT EXTRACT(YEAR FROM date_awarded) FROM contracts WHERE 1=1 ORDER BY EXTRACT(YEAR FROM date_awarded) ASC'

    const result = await pool.query(query)
    res.json(result.rows)
})

app.get('/api/contracts/finance/revenue-vs-expense', async(req,res) => {

    const { year, month, contractId } = req.query;

    let query = `
            SELECT 
                c.contract_name AS project,
                te.month,
                te.year,
                COALESCE(i.total_revenue, 0) AS total_revenue,
                te.total_expense
            FROM contracts c
            JOIN (
                SELECT 
                    e.contract_id,
                    EXTRACT(MONTH FROM t.date_worked) AS month,
                    EXTRACT(YEAR FROM t.date_worked) AS year,
                    CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS total_expense
                FROM time_entries t
                JOIN employees e ON t.employee_id = e.id
                GROUP BY e.contract_id, EXTRACT(MONTH FROM t.date_worked), EXTRACT(YEAR FROM t.date_worked)
            ) te ON te.contract_id = c.id
            LEFT JOIN (
                SELECT contract_id, EXTRACT(MONTH FROM invoice_date) AS invoice_month, EXTRACT(YEAR FROM invoice_date) AS invoice_year, SUM(amount_paid) AS total_revenue
                FROM invoices
                GROUP BY contract_id, EXTRACT(MONTH FROM invoice_date), EXTRACT(YEAR FROM invoice_date)
            ) i ON i.contract_id = c.id AND i.invoice_month = te.month AND i.invoice_year = te.year
            WHERE 1=1
    `;

    const params = [];

    if (year && year !== 'all') {
        query += ' AND te.year = $' + (params.length + 1)
        params.push(parseInt(year))
    }

    if (month && month !== 'all') {
        query += ' AND te.month = $' + (params.length + 1)
        params.push(parseInt(month))
    }
    if (contractId && contractId !== 'all') {
        query += ' AND c.id = $' + (params.length + 1)
        params.push(parseInt(contractId))
    }


    try {
        const results = await pool.query(query, params);

        console.log("Revenue vs Expense:", results.rows);

        const response = {
            revenue: results.rows.map(row => row.total_revenue),
            expense: results.rows.map(row => row.total_expense),
            labels: results.rows.map(row => `${row.month}/${row.year}`),
            project: results.rows.map(row => row.project)
        }

        // console.log("Revenue vs Expense results:",response);
        res.json(response);

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch revenue vs expense data' });
        console.log("Error occurred when fetching revenue vs expense data...", error)
    }
})

app.get('/api/contracts/dropdown', async(req,res) => {
    const query = 'SELECT DISTINCT id, contract_name FROM contracts WHERE 1=1 ORDER BY contract_name ASC'

    const result = await pool.query(query)
    res.json(result.rows)
})

app.get('/api/contracts/bidItems', async(req, res) => {
    
        const { contractId } = req.query;

        // console.log("Contract ID received:", name);

        let query = `SELECT 
                        c.contract_name AS project,
                        bi.unit_of_measure AS uom,
                        bi.description AS desc,
                        AVG(CASE WHEN cb.bidder_id = 5 THEN cb.unit_price END) AS txdot_price,
                        MIN(CASE WHEN cb.bidder_id != 2 AND cb.bidder_id != 5 THEN cb.unit_price END) AS competitor_price,
                        AVG(CASE WHEN cb.bidder_id = 2 THEN cb.unit_price END) AS our_price,
                        MAX(cb.unit_price) AS max_price,
                        MAX(CASE WHEN cb.bidder_id IN (2, 5) THEN cb.total_price ELSE 0 END) AS total,
                        bi.quantity AS quantity
                    FROM contracts c
                    INNER JOIN bid_items bi ON c.id = bi.contract_id
                    INNER JOIN contractor_bids cb ON bi.id = cb.bid_item_id
                    WHERE 1=1
        `;
        const params = [];

        if (contractId && contractId !== 'all') {
            query += ' AND c.id = $' + (params.length + 1);
            params.push(contractId);
        }

        query += ` GROUP BY 
                        c.contract_name, 
                        bi.description, 
                        bi.unit_price, 
                        bi.quantity, 
                        bi.unit_of_measure 
                    ORDER BY c.contract_name, bi.unit_of_measure`;

    try {

        const results = await pool.query(query, params)
        // console.log("Bid Items rows return from api:",results.rows);

        res.json(results.rows)

    } catch(error) {
        res.status(500).json({ error: 'Failed to fetch bid items' });
        console.log("Error occurred when fetching bid items...", error)
    }
})

app.get('/api/contracts/item-profit', async(req, res) => {
    const { contractId } = req.query;

    let query = `
        SELECT
            c.contract_name AS project,
            bi.description AS item,
            SUM(m.quantity) AS qty,
            (MAX(m.date_used) - MIN(m.date_used)) AS time,
            COALESCE(te.cost, 0.00) AS cost
        FROM bid_items bi
        JOIN contracts c ON bi.contract_id = c.id
        LEFT JOIN materials m ON m.bid_item_id = bi.id
        LEFT JOIN  (
            SELECT 
                t.bid_item_id,
                CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS cost
            FROM time_entries t
            JOIN employees e ON t.employee_id = e.id
            GROUP BY t.bid_item_id
        ) te ON te.bid_item_id = bi.id
        WHERE 1=1
     `;

    const params = [];

    if (contractId && contractId !== 'all') {
        query += ' AND c.id = $' + (params.length + 1);
        params.push(contractId);
    }

    query += ` GROUP BY c.contract_name, bi.description, te.cost ORDER BY c.contract_name, bi.description`;
        
    try {

        const results = await pool.query(query, params);
        // console.log("Item Profit results:", results.rows);
        res.json(results.rows);

    } catch (error) {
        res.status(500).json({ error: 'Error fetching item profits' });
    }
})

app.get('/api/contracts/winLoss', async(req, res) => {
    try {
        const { contractId, year, month} = req.query;

        const params = [];

        let query = `
            SELECT c.contract_name AS project,
                CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0) AS NUMERIC(10,2)) AS total_hours,
                CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS total_labor_cost,
                inv.total_revenue AS revenue,
                CAST(inv.total_revenue  - SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS profit,
                CAST((inv.total_revenue - SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate)) / NULLIF(inv.total_revenue, 0) * 100 AS NUMERIC(5,2)) AS profit_margin_percent
            FROM contracts c
            JOIN employees e ON c.id = e.contract_id
            JOIN time_entries t ON t.employee_id = e.id
            JOIN (
                SELECT contract_id, MAX(total_amount) AS total_revenue
                FROM invoices
                GROUP BY contract_id
            ) inv ON inv.contract_id = c.id
            WHERE 1=1
        `;

        if (contractId && contractId !== 'all') {
            
            query += ' AND c.id = $' + (params.length + 1);
            params.push(contractId)
        }

        if (year && year !== 'all') {
            query += ' AND EXTRACT(YEAR FROM c.date_awarded) = $' + (params.length + 1)
            params.push(year)
        }

        if (month && month !== 'all') {
            query += ' AND EXTRACT(MONTH FROM c.date_awarded) = $' + (params.length + 1)
            params.push(month)
        }

        query += ` GROUP BY c.contract_name, inv.total_revenue`;

        

        const results = await pool.query(query, params)
        
        if (results.rows.length === 0) {
            return res.json({ contracts_submitted: 0, bids_won: 0, win_rate: 0 });
        }

        // console.log("Win/Loss results:",results.rows);
        res.json(results.rows)

    } catch(error) {
        res.status(500).json({ error: 'Failed to fetch win/loss data' });
        console.log("Error occured when fetching win/loss data...", error)
    }
})

// ==================================
//  Search Route
// ==================================

// Search
app.get('/api/contract/search', async(req, res) => {
    try {
        
        const { query } = req.query;
        // console.log(query)

        if (!query) {
            return res.json([])
        }
        
        const searchQuery = `
            SELECT DISTINCT
                contract_name,
                id,
                date_awarded,
                total_bid_amount
            FROM contracts
            WHERE 
                contract_name ILIKE $1
            ORDER BY contract_name ASC
            LIMIT 10
        `;

        const result = await pool.query(searchQuery, [`%${query}`])
        res.json(result.rows)

    } catch (err) {
        res.status(500).json({ error: 'Search query failed' });
        console.log("Error occured during search...", err.message); 
    }
})

// Average Contract Value
app.get('/api/contracts/average', async(req, res) => {
    try {

        const { year, month, contractId } = req.query;

        const params = [];

        let query = `
            SELECT 
                ROUND(AVG(total_bid_amount),2) as average_contract_value 
            FROM contracts
            WHERE 1=1
        `;

        if (year && year !== 'all') {
            query += ' AND EXTRACT(YEAR FROM date_awarded) = $' + (params.length + 1)
            params.push(year)
        }

        if (month && month !== 'all') {
            query += ' AND EXTRACT(MONTH FROM date_awarded) = $' + (params.length + 1)
            params.push(month)
        }
        if (contractId && contractId !== 'all') {
            query += ' AND id = $' + (params.length + 1)
            params.push(contractId)
        }

        // console.log("Average Contract Value Query:", query);
        // console.log("With Parameters:", params);

        const results = await pool.query(query, params);

        if (results.rows.length === 0) {
            return res.status(404).json({ error: "No data found for the given contract ID" });
        }
        
        // console.log("Average Contract Value results:",results.rows[0]);

        res.json(results.rows[0])

    } catch (error) {
        console.error("Error occured when fetching average contract value...", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

// Revenue By Customers
app.get('/api/contracts/revenue/customer', async(req, res) => {
    
        const { year, month, contractId } = req.query;
       
        let query = `
            select cl.name, SUM(i.amount_paid) as total_revenue
            FROM invoices i
            JOIN clients cl ON cl.id = i.client_id
    
        `;

        const params = [];

        if (year && year !== 'all') {
            query += ' AND EXTRACT(YEAR FROM i.invoice_date) = $' + (params.length + 1)
            params.push(year)
        }

        if (month && month !== 'all') {
            query += ' AND EXTRACT(MONTH FROM i.invoice_date) = $' + (params.length + 1)
            params.push(month)
        }
        if (contractId && contractId !== 'all') {
            query += ' AND i.contract_id = $' + (params.length + 1)
            params.push(contractId)
        }

        query += `GROUP BY cl.name`;

        // console.log(query);

    try {
        const results = await pool.query(query, params);

        if (results.rows.length === 0) {
            return res.status(404).json({ error: "No data found for the given contract ID" });
        }
        
        // console.log("Revenue by Customer results:",results.rows);

        res.json(results.rows)

    } catch (error) {
        console.error("Error occurred when fetching revenue by customer...", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

app.get('/api/contracts/revenue', async(req, res) => {
    const { year, month, contractId } = req.query;
    // console.log("contractID:", contractId)
    try {

        let query = `
            SELECT  
                i.contract_id,
                SUM(i.amount_paid) as total_revenue
            FROM invoices i
            JOIN contracts c ON c.id = i.contract_id
            WHERE i.payment_status = 'paid'
        `;

        const params = [];

        if (contractId && contractId !== 'all') {
            query += ' AND i.contract_id = $' + (params.length + 1);
            params.push(contractId);
        }

        if (year && year !== 'all') {
            query += ' AND EXTRACT(YEAR FROM i.invoice_date) = $' + (params.length + 1);
            params.push(year)
        }

        if (month && month !== 'all') {
            query += ' AND EXTRACT(MONTH FROM i.invoice_date) = $' + (params.length + 1);
            params.push(month);
        }

        query += ' GROUP BY i.contract_id'

    
        const results = await pool.query(query, params);

        // console.log(results.rows);

        if (results.rows.length === 0) {
            return res.status(200).json([{ contract_id: null, total_revenue: 0 }]);
        }
        
        res.json(results.rows)

        // console.log("revenue returned:",results.rows)

    } catch (error) {
        console.error("Error occurred when fetching average contract value...", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

// ==================
//  Vendors Routes
// ==================

app.get('/api/contracts/vendor/performance', async(req, res) => {
    

    try {
        const { contractId } = req.query;
        const params = [];

        let query = `
            SELECT v.name AS vendor_name,
                bi.description AS item,
                LAG(m.unit_cost, 1, 0.00) OVER (PARTITION BY v.id ORDER BY m.date_used) AS previous_price,
                    m.unit_cost AS current_price,
                    m.unit_cost - LAG(m.unit_cost, 1, 0.00) OVER (PARTITION BY v.id ORDER BY m.date_used) AS price_change
            FROM materials m
            JOIN vendors v ON m.vendor_id = v.id
            JOIN bid_items bi ON m.bid_item_id = bi.id
            WHERE 1=1  
        `;

        
        
        if (contractId && contractId !== 'all') {
            query += ` AND c.id = $` + (params.length + 1)
            params.push(contractId);
        }

        query += `ORDER BY m.date_used DESC`;

        const results = await pool.query(query, params);

        // console.log("Vendor Performance results:",results.rows);

        return res.json(results.rows);

    } catch (error) {
        console.log("Error occured when fetching...", error)
    }
})

app.get('/api/contracts/labor-vs-profit', async(req, res) => {
    const { contractId, month, year } = req.query;
    console.log("Received labor vs profit request with filters - Contract ID:", contractId, "Year:", year, "Month:", month);
    const params = [];

    try {
        

        let query = `
                SELECT
                    c.contract_name AS project,
                    CAST(
                        i.total_amount - 
                        SUM(EXTRACT(EPOCH FROM t.hours_worked)
                        / 3600.0 * e.hourly_rate) 
                    AS NUMERIC(10,2)) as profit,
                    CAST
                    (
                        SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)
                    ) AS labor_cost
                FROM contracts c
                JOIN employees e ON c.id = e.contract_id
                JOIN time_entries t ON t.employee_id = e.id
                JOIN (
                    SELECT contract_id, MAX(total_amount) AS total_amount
                    FROM invoices
                    GROUP BY contract_id
                ) i ON i.contract_id = c.id
                WHERE 1=1  
        `;

        
        
        if (contractId && contractId !== 'all') {
            query += ` AND c.id = $` + (params.length + 1)
            params.push(contractId);
        }

        if (year && year !== 'all') {
            query += ` AND EXTRACT(YEAR FROM c.date_awarded) = $` + (params.length + 1);
            params.push(year);
        }

        if (month && month !== 'all') {
            query += ` AND EXTRACT(MONTH FROM c.date_awarded) = $` + (params.length + 1);
            params.push(month);
        }

        query += ` GROUP BY i.total_amount, c.contract_name ORDER BY profit DESC`;

        const results = await pool.query(query, params);

        console.log("Labor vs Profit results:",results.rows);
        res.json(results.rows);

    } catch (error) {
        console.log("Error occurred when fetching...", error)
    }
})

const PORT = process.env.PORT || 3300;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
