const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { path } = require('d3');
require('dotenv').config();
const bcrypt = require('bcryptjs')

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
});

app.post('/api/login/new-user', async (req, res) => {
    const { email, pwd } = req.body;

    if (!email || !pwd) {
        return res.status(400).json({ message: "Email and password is required to create new user!"})
    }

    try {
        const passwordHash = await bcrypt.hash(pwd, 12);
        console.log("password hash: ", passwordHash);

        const newUserQuery = 'INSERT INTO users(useremail, passwordhash) VALUES ($1, $2) RETURNING id, useremail'
        const results = await pool.query(newUserQuery, [email, passwordHash]);

        if (results.rows.length === 0) {
            return res.status(500).json({message: "Failed to create user!"})
        }

        return res.status(200).json({ message: "New user added!" })

    } catch (err) {
        console.log(err.message);
        res.status(500).json({message: "Failed to create user " + err})
    }
})

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(username,password)

    if (!username || !password) {
        return res.status(400).json({ message: "Email and password is required to login!"})
    }

    try {
        const userQuery = 'SELECT * FROM users WHERE useremail = $1'
        const results = await pool.query(userQuery, [username]);

        if (results.rows.length === 0) {
            return res.status(401).json({message: "Email or password is invalid!"})
        }

        const passwordHash = results.rows[0].passwordhash;

        console.log("password hash:",passwordHash)

        const isMatch = await bcrypt.compare(password, passwordHash);

        console.log("Is there an match",isMatch)

        if(!isMatch) {
            return res.status(401).json({message: "Email or password is invalid!"})
        }

        res.status(200).json({ success: true, message: "User is authenticated" })

    } catch (err) {
        console.log(err.message);
        res.status(500).json({message: "Failed to log in " + err})
    }
})

// Routes
app.get('/api/contracts', async(req, res) => {
    try {
        const { year, month, contract, status } = req.query;
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
                    t.contract_id,
                    EXTRACT(MONTH FROM t.date_worked) AS month,
                    EXTRACT(YEAR FROM t.date_worked) AS year,
                    CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)) AS total_expense
                FROM time_entries t
                JOIN employees e ON t.employee_id = e.id
                GROUP BY t.contract_id, EXTRACT(MONTH FROM t.date_worked), EXTRACT(YEAR FROM t.date_worked)
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

        // console.log("Revenue vs Expense:", results.rows);

        const response = {
            revenue: results.rows.map(row => row.total_revenue),
            expense: results.rows.map(row => row.total_expense),
            month: results.rows.map(row => row.month),
            year: results.rows.map(row => row.year),
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
            JOIN time_entries t ON t.contract_id = c.id 
            JOIN employees e ON t.employee_id = e.id
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
        console.log(query)

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

// Client/customer search (clients table is the source of truth for customers)
app.get('/api/clients/search', async(req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.json([])
        }

        const searchQuery = `
            SELECT id, name, city
            FROM clients
            WHERE name ILIKE $1
            ORDER BY name ASC
            LIMIT 10
        `;

        const result = await pool.query(searchQuery, [`%${query}%`])
        res.json(result.rows)

    } catch (err) {
        console.log(err.message);
    }
})

// Employees, for populating the "Assign to associate" dropdown on the work order modal
app.get('/api/employees', async(req, res) => {
    try {
        const query = `
            SELECT id, first_name, last_name
            FROM employees
            ORDER BY first_name ASC, last_name ASC
        `;

        const result = await pool.query(query)
        res.json(result.rows)

    } catch (err) {
        console.log(err.message);
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

// Project Status Route
app.get('/api/projects/status', async(req, res) => {
    const query = `
        SELECT 
            c.contract_name AS project,
            c.total_bid_amount AS revenue,
            (m.total_cost + CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2))) AS expense,
            (c.total_bid_amount - (m.total_cost + CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)))) AS net_profit,
            ROUND(SUM(i.amount_paid) / c.total_bid_amount * 100, 2) AS progress_percent,
            c.status
        FROM contracts c
        LEFT JOIN materials m ON m.contract_id = c.id
        LEFT JOIN time_entries t ON t.contract_id = c.id
        LEFT JOIN employees e ON t.employee_id = e.id
        LEFT JOIN invoices i ON i.contract_id = c.id AND i.payment_status = 'paid'
        GROUP BY c.contract_name, c.total_bid_amount, m.total_cost, c.status
        HAVING c.contract_name NOT LIKE '%Zamora Inc%' AND c.contract_name NOT LIKE '%TxDOT%' AND c.status <> 'completed'
        ORDER BY c.contract_name ASC
    `;

    try {
        const results = await pool.query(query);
        // console.log("Project Status results:", results.rows);
        res.json(results.rows);
    } catch (error) {
        console.error("Error occurred when fetching project status data...", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
})
        

// Project Budget Utilization Route
app.get('/api/projects/budget/utilization', async(req, res) => {
    // create query to calculate project budget utilization
    const query = `
        WITH labor_costs AS (
            SELECT 
                t.contract_id,
                SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS total_labor_cost
            FROM time_entries t
            JOIN employees e ON t.employee_id = e.id
            GROUP BY t.contract_id
        ),
        invoice_totals AS (
            SELECT 
                contract_id,
                SUM(amount_paid) AS total_revenue
            FROM invoices
            GROUP BY contract_id
        )
        SELECT 
            c.contract_name AS project,
            c.total_bid_amount AS budget,
            ROUND(COALESCE(lc.total_labor_cost, 0), 2) AS actual_spend,
            ROUND((COALESCE(lc.total_labor_cost, 0) / NULLIF(c.total_bid_amount, 0)) * 100, 2) AS utilization
        FROM contracts c
        LEFT JOIN labor_costs lc ON c.id = lc.contract_id
        LEFT JOIN invoice_totals it ON c.id = it.contract_id
        WHERE c.contract_name NOT LIKE '%Zamora Inc%' AND c.contract_name NOT LIKE '%TxDOT%'
     `;

    try {
        const results = await pool.query(query);
        // console.log("Budget Utilization results:", results.rows);
        res.json(results.rows);

    } catch (error) {
        console.error("Error occurred when fetching budget utilization data...", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

app.get('/api/projects/performance', async(req, res) => {

    let query = `
        SELECT
            EXTRACT('MONTH' FROM te.date_worked)  AS month,
            COUNT(DISTINCT c.id) AS completed_projects
        FROM contracts c
        INNER JOIN time_entries te ON te.contract_id = c.id
        WHERE c.status = 'completed' AND EXTRACT('YEAR' FROM te.date_worked) = '2025'
        GROUP BY EXTRACT('MONTH' FROM te.date_worked) 
        ORDER BY month ASC;
    `;


    try {
        const results = await pool.query(query);
        // console.log("Project Performance results:", results.rows);
        res.json(results.rows);

    } catch (error) {
        console.error("Error occurred when fetching project performance data...", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ==================
//  Reports Routes
// ==================

// Pull Reports > Project Performance: revenue, expense, and progress by project.
// Same shape as /api/projects/status but without that route's "active projects only"
// filter - a report should cover full project history, not just what's in progress.
app.get('/api/projects/reports/project-performance', async(req, res) => {
    const { contractId, year, month } = req.query;

    let query = `
        SELECT
            c.contract_name AS project,
            c.total_bid_amount AS revenue,
            (m.total_cost + CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2))) AS expense,
            (c.total_bid_amount - (m.total_cost + CAST(SUM(EXTRACT(EPOCH FROM t.hours_worked) / 3600.0 * e.hourly_rate) AS NUMERIC(10,2)))) AS net_profit,
            ROUND(SUM(i.amount_paid) / c.total_bid_amount * 100, 2) AS progress_percent,
            c.status
        FROM contracts c
        LEFT JOIN materials m ON m.contract_id = c.id
        LEFT JOIN time_entries t ON t.contract_id = c.id
        LEFT JOIN employees e ON t.employee_id = e.id
        LEFT JOIN invoices i ON i.contract_id = c.id AND i.payment_status = 'paid'
        WHERE c.contract_name NOT LIKE '%Zamora Inc%' AND c.contract_name NOT LIKE '%TxDOT%'
    `;

    const params = [];

    if (contractId && contractId !== 'all') {
        query += ' AND c.id = $' + (params.length + 1);
        params.push(contractId);
    }

    if (year && year !== 'all') {
        query += ' AND EXTRACT(YEAR FROM c.date_awarded) = $' + (params.length + 1);
        params.push(year);
    }

    if (month && month !== 'all') {
        query += ' AND EXTRACT(MONTH FROM c.date_awarded) = $' + (params.length + 1);
        params.push(month);
    }

    query += ' GROUP BY c.contract_name, c.total_bid_amount, m.total_cost, c.status ORDER BY c.contract_name ASC';

    try {
        const results = await pool.query(query, params);
        res.json(results.rows);
    } catch (error) {
        console.error("Error occurred when fetching project performance report data...", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

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
});

app.get('/api/contracts/labor-vs-profit', async(req, res) => {
    const { contractId, month, year } = req.query;
    // console.log("Received labor vs profit request with filters - Contract ID:", contractId, "Year:", year, "Month:", month);
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
                JOIN time_entries t ON t.contract_id = c.id
                JOIN employees e ON e.id = t.employee_id
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

        // console.log("Labor vs Profit results:",results.rows);
        res.json(results.rows);

    } catch (error) {
        console.log("Error occurred when fetching...", error)
    }
});

// ===================
// Project Routes
//====================

app.get('/api/projects/kpis', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_projects,
                COUNT(*) FILTER (WHERE status = 'completed' ) as completed_projects,
                COUNT(*) FILTER (WHERE status = 'overdue') as overdue_projects
            FROM contracts`
        );
        res.json(result.rows[0])
        
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
});

// ===================
// Work Orders Routes
//====================

// Gets stats (Average cycle time, total, total completed work orders, etc)
app.get('/api/contracts/work-orders/:id/kpis', async(req, res) => {
    const contractId = req.params.id;

    // console.log(contractId);

    let q = `
    WITH last_week_completed_work_orders AS (
    SELECT
        COUNT(*) FILTER(WHERE status = 'completed') as total_completed,
        COUNT(*) FILTER(WHERE status = 'in progress') as total_in_progress
        FROM work_orders
        WHERE contract_id = $1
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

        COUNT(*) as total_assigned,
        COUNT(*) FILTER(WHERE status = 'in progress') as total_in_progress,
        COALESCE(COUNT(*) FILTER(WHERE status = 'in progress') - MAX(lw.total_in_progress), 0) as wow_assigned_count,
        COALESCE(AVG(due_date - start_date) FILTER(WHERE status = 'completed'), 0) as avg_cycle_time
    FROM work_orders
    CROSS JOIN last_week_completed_work_orders lw
    WHERE contract_id = $1
    `;

    try {
        const result = await pool.query(q,[contractId]);
        // console.log("KPI results: ", result.rows[0]);
        return res.json(result.rows[0])
    } catch (error) {
        console.log(error);
    }
});

// Gets line items for a specific work order
app.get('/api/contracts/work-orders/:id/line-items', async (req, res) => {
    const contractId = req.params.id;
    console.log("Select lines for contract: ", contractId);

    if(!contractId) return res.status(404).json({ success: false, message: `contract ${contractId}, not found! `});

    let query = `SELECT c.contract_name, li.id, bi.id AS bid_item_id, bi.description, bi.unit_of_measure,
                    bi.quantity, li.qty_completed, (li.qty_assigned - li.qty_completed) as remaining_qty,
                    ROUND(COALESCE((li.qty_completed * 100.0) / NULLIF(li.qty_assigned, 0), 0), 0) as progress
                FROM bid_items bi
                JOIN line_items li ON bi.id = li.bid_item_id
                JOIN contracts c ON bi.contract_id = c.id 
                WHERE 1=1

    `;

    const params = [];

    if (contractId !== "all" && contractId) {
        query += ` AND c.id = $` + (params.length + 1)
        params.push(contractId);
    }

    console.log(query)

    try {
        const result =  await pool.query(query, params);
        console.log("line items returned: ",result.rows)
        res.json(result.rows)
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
});

// Line items for a specific set of work orders - used by both the Export button (a batch
// of ids) and the Line Items table (a single selected work order's id). Unlike the route
// above, this is scoped by line_items.work_order_id directly rather than by contract, but
// still needs the same bid_items join since description/unit/quantity live there, not on
// line_items itself.
app.get('/api/contracts/work-orders/line-items/export', async(req, res) => {
    try {
        const { workOrderIds } = req.query;

        if (!workOrderIds) {
            return res.json([]);
        }

        const ids = workOrderIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !Number.isNaN(id));

        if (ids.length === 0) {
            return res.json([]);
        }

        const query = `
            SELECT
                li.id AS line_item_id,
                wo.work_order_id,
                bi.bid_item_no,
                bi.description,
                bi.unit_of_measure,
                bi.quantity,
                li.qty_assigned,
                li.qty_completed,
                (li.qty_assigned - li.qty_completed) as remaining_qty,
                ROUND(COALESCE((li.qty_completed * 100.0) / NULLIF(li.qty_assigned, 0), 0), 0) AS progress
            FROM line_items li
            LEFT JOIN bid_items bi ON bi.id = li.bid_item_id
            LEFT JOIN work_orders wo ON wo.id = li.work_order_id
            WHERE li.work_order_id = ANY($1::int[])
        `;

        const result = await pool.query(query, [ids]);
        res.json(result.rows);
    } catch (err) {
        console.log(err.message);
    }
});

app.patch('/api/contracts/work-orders/line-items/:id', async(req,res) => {
    const { id } = req.params;
    const { qtyAssigned, qtyCompleted } = req.body;

    try {
        const result = await pool.query(
            `UPDATE line_items SET qty_completed = $1, qty_assigned = $2 WHERE id = $3 RETURNING *
            `,[parseInt(qtyCompleted), parseInt(qtyAssigned), id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.log(error.message)
    }
})

// Permanently deletes a single line item.
app.delete('/api/contracts/work-orders/line-items/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM line_items WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Line item not found' });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Failed to delete line item' });
    }
});

// Gets work for a specific contract
app.get('/api/contracts/work-orders/:id', async (req, res) => {
    const contractId  = req.params.id;
    console.log("WO ID:",contractId);

    let query = `SELECT
                    wo.id,
                    wo.work_order_id,
                    wo.title,
                    NULLIF(TRIM(CONCAT(e.first_name, ' ', e.last_name)), '') AS assignee_name,
                    wo.status,
                    wo.total_items,
                    ROUND(
                        COALESCE(
                        (wo.items_completed * 100.0) / NULLIF(wo.total_items, 0),
                                0)
                        , 0) AS progress,
                    wo.due_date,
                    wo.value
                FROM work_orders wo
                LEFT JOIN employees e ON e.id = wo.assignee
                WHERE 1=1`;
    const params = [];

    if (contractId && contractId !=='all') {
            query += ' AND wo.contract_id = $' + (params.length + 1)
            params.push(contractId);
    };

    try {
       const results = await pool.query(query, params);
       res.json(results.rows)
    } catch (error) {
        console.log(error)
    }
});

// Permanently deletes a work order and its line items. No schema file exists
// to confirm line_items.work_order_id has ON DELETE CASCADE, so line items
// are deleted explicitly in the same transaction rather than assumed.
app.delete('/api/contracts/work-orders/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM line_items WHERE work_order_id = $1', [id]);
        const result = await client.query('DELETE FROM work_orders WHERE id = $1 RETURNING id', [id]);
        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Work order not found' });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.log(error.message);
        res.status(500).json({ error: 'Failed to delete work order' });
    } finally {
        client.release();
    }
});

// Creates the work order itself. Does not touch line_items - bid_item_id isn't
// collected by the modal yet, so line items are inserted separately via
// /api/contracts/work-orders/line-items/insert once that gap is closed.
app.post('/api/contracts/work-orders', async(req, res) => {
    const {
        workOrderTitle,
        workOrderContractId,
        workOrderClientId,
        workOrderValue,
        workOrderProject,
        startDate,
        endDate,
        lineItems,
    } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const year = new Date().getFullYear();
        const totalItems = Array.isArray(lineItems) ? lineItems : [];
        const value = workOrderValue ? parseFloat(workOrderValue) : 0;
        const assignee = workOrderProject ? parseInt(workOrderProject, 10) : null;

        const insertQuery = `
            WITH new_id AS (
                SELECT nextval('work_orders_id_seq') AS id
            )
            INSERT INTO work_orders
            (
                id, contract_id, client_id, work_order_id, title, status,
                total_items, start_date, due_date, value, assignee, items_completed, created_at, updated_at
            )
            SELECT
                id, $1, $2, 'WO-' || $3 || '-' || LPAD(id::text, 3, '0'), $4, 'pending',
                $5, $6, $7, $8, $9, 0, NOW(), NOW()
            FROM new_id
            RETURNING id, work_order_id
        `;

        const result = await client.query(insertQuery, [
            workOrderContractId,
            workOrderClientId,
            year,
            workOrderTitle,
            totalItems.length,
            new Date(startDate),
            new Date(endDate),
            value,
            assignee,
        ]);

        for (const item of totalItems) {
            const { bidItemId, qtyAssigned } = item;
            const insertQuery = `
                INSERT INTO line_items (work_order_id, bid_item_id, qty_assigned, qty_completed)
                VALUES ($1, $2, $3, $4)
            `;
            await client.query(insertQuery, [result.rows[0].id, bidItemId, qtyAssigned, 0]);
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, workOrder: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.log(error.message);
        res.status(500).json({ error: 'Failed to create work order' });
    } finally {
        client.release();
    }
})

app.post('/api/contracts/work-orders/line-items/insert', async(req, res) => {
    const { workOrderId, lineItems } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        // Insert line items for the specified work orders
        for (const item of lineItems) {
            const { bidItemId, qtyAssigned } = item;
            const insertQuery = `
                INSERT INTO line_items (work_order_id, bid_item_id, qty_assigned, qty_completed)
                VALUES ($1, $2, $3, $4)
            `;
            await client.query(insertQuery, [workOrderId, bidItemId, qtyAssigned, 0]);
        }
        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Line items inserted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.log(error.message);
        res.status(500).json({ error: 'Failed to insert line item' });
    } finally {
        client.release();
    }
})

const PORT = process.env.PORT || 3300;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
