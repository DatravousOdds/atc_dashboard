const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
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

        let query = 'SELECT * FROM contracts WHERE 1=1';
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

        // console.log('query:', query)
        // console.log('params:',params)

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

app.get('/api/contracts/perMonth', async(req, res) => {
    const query = 
    `   SELECT count(*),
            
             EXTRACT(MONTH FROM date_awarded) as month FROM contracts 
        GROUP BY month ORDER BY month`;
    const result = await pool.query(query)
    res.json(result.rows)
    // console.log(result.rows)
    
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

            query += `GROUP BY i.payment_status`;

            const result = await pool.query(query, params)
            res.json(result.rows[0])
   
    
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch win rate data' });
        console.log("Error occured when fetching win rate data...", error)
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
                TO_CHAR(te.month, 'Mon YYYY') as period,
                COALESCE(i.amount_paid, 0) AS total_revenue,
                te.total_expense
            FROM contracts c
            JOIN (
            SELECT 
                e.contract_id,
                DATE_TRUNC('month', t.date_worked) AS month,
                CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS total_expense
            FROM time_entries t
            JOIN employees e ON t.employee_id = e.id
            GROUP BY e.contract_id, DATE_TRUNC('month', t.date_worked)
            ) te ON te.contract_id = c.id
            LEFT JOIN (
            SELECT contract_id, invoice_date, MAX(amount_paid) AS amount_paid
            FROM invoices
            GROUP BY contract_id, invoice_date
            ) i ON i.contract_id = c.id AND DATE_TRUNC('month', i.invoice_date) = te.month
            WHERE 1=1
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
        query += ' AND c.id = $' + (params.length + 1)
        params.push(contractId)
    }

    query += ` GROUP BY period, i.invoice_date, i.amount_paid, te.total_expense ORDER BY i.invoice_date ASC`;

    try {
        const results = await pool.query(query, params);

        const response = {
            revenue: results.rows.map(row => row.total_revenue),
            expense: results.rows.map(row => row.total_expense),
            labels: results.rows.map(row => row.period)
        }

        console.log("Revenue vs Expense results:",response);
        res.json(response);

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch revenue vs expense data' });
        console.log("Error occured when fetching revenue vs expense data...", error)
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
                        bi.specification_section_no AS spec,
                        bi.description AS desc,
                        bi.unit_price AS unit_price,
                        MIN(CASE WHEN cb.bidder_id != 2 THEN cb.unit_price END) AS competitor_price,
                        MAX(CASE WHEN cb.bidder_id = 2 THEN cb.unit_price END) AS our_price,
                        MAX(cb.unit_price) AS max_price,
                        MAX(CASE WHEN cb.bidder_id = 2 THEN cb.total_price END) AS total,
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
                        bi.specification_section_no 
                    ORDER BY c.contract_name, bi.specification_section_no`;

    try {

        const results = await pool.query(query, params)
        // console.log("Bid Items rows return from api:",results.rows);

        res.json(results.rows)

    } catch(error) {
        res.status(500).json({ error: 'Failed to fetch bid items' });
        console.log("Error occured when fetching bid items...", error)
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

app.get('/api/contracts/revenue/customer', async(req, res) => {
    
        const { year, month, contractId } = req.query;
       
        let query = `
            SELECT 
                cl.name AS customer_name,
                c.contract_name AS project,
                CAST(SUM(i.amount_paid) AS NUMERIC(10,2)) AS total_revenue
            FROM contracts c
            JOIN invoices i ON i.contract_id = c.id
            JOIN clients cl ON i.client_id = cl.id
            WHERE 1=1 AND i.payment_status = 'paid'
            
            
        `;

        const params = [];

        if (year && year !== 'all') {
            query += ' AND EXTRACT(YEAR FROM c.date_awarded) = $' + (params.length + 1)
            params.push(year)
        }

        if (month && month !== 'all') {
            query += ' AND EXTRACT(MONTH FROM c.date_awarded) = $' + (params.length + 1)
            params.push(month)
        }
        if (contractId && contractId !== 'all') {
            query += ' AND c.id = $' + (params.length + 1)
            params.push(contractId)
        }

        query += `GROUP BY cl.name, c.contract_name ORDER BY total_revenue DESC`;

    try {
        const results = await pool.query(query, params);

        if (results.rows.length === 0) {
            return res.status(404).json({ error: "No data found for the given contract ID" });
        }
        
        // console.log("Revenue by Customer results:",results.rows);

        res.json(results.rows)

    } catch (error) {
        console.error("Error occured when fetching revenue by customer...", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

app.get('/api/contracts/revenue', async(req, res) => {
    try {

        let query = `
            SELECT  SUM(i.amount_paid) as total_revenue
                FROM invoices i
            WHERE 1=1 AND i.payment_status = 'paid'
            GROUP BY i.payment_status
        `;

    
        const results = await pool.query(query);

        if (results.rows.length === 0) {
            return res.status(404).json({ error: "No data found for the given contract ID" });
        }
        
        res.json(results.rows[0])

        // console.log("revenue returned:",results.rows[0])

    } catch (error) {
        console.error("Error occured when fetching average contract value...", error.message);
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
    

    try {
        const { contractId, month, year } = req.query;
        const params = [];

        let query = `
                SELECT 
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

        query += ` GROUP BY i.total_amount ORDER BY profit DESC`;

        const results = await pool.query(query, params);

        console.log("Labor vs Profit results:",results.rows);
        res.json(results.rows);

    } catch (error) {
        console.log("Error occured when fetching...", error)
    }
})

const PORT = process.env.PORT || 3300;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
