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
    // user: process.env.DB_USER,
    // password: process.env.DB_PASSWORD,
    // host: process.env.DB_HOST,
    // port: process.env.DB_PORT,
    // database: process.env.DB_NAME
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
    const query = 'SELECT count(*), EXTRACT(MONTH FROM date_awarded) as month FROM contracts GROUP BY month ORDER BY month';
    const result = await pool.query(query)
    res.json(result.rows)
    // console.log(result.rows)
    
})

app.get('/api/contracts/win-rate', async(req, res) => {
    try {
        const { contractId, year, month } = req.query;
            let query = `
                SELECT
                    COUNT(*) as total_contracts,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as won_contracts,
                    ROUND(
                        COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric /
                        NULLIF(COUNT(*), 0)::numeric * 100,
                        2
                    ) as win_rate
                FROM contracts 
                WHERE 1=1
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

            console.log('Win Rate Query:', query);
            console.log('With Parameters:', params);

            const result = await pool.query(query, params)
            res.json(result.rows[0])
            console.log("Win Rate Result:", result.rows);
   
    
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

app.get('/api/contracts/revenue/customer', async(req,res) => {
    try {
        let query = `
                    SELECT DISTINCT 
                        contract_name, 
                        SUM(total_bid_amount) as revenue
                    FROM contracts
                    GROUP BY contract_name
                    ORDER BY revenue ASC
                    LIMIT 5
        `;

        const results = await pool.query(query);
        res.json(results.rows);

    } catch (error) {

    }
})



app.get('/api/contracts/dropdown', async(req,res) => {
    const query = 'SELECT DISTINCT id, contract_name FROM contracts WHERE 1=1 ORDER BY contract_name ASC'

    const result = await pool.query(query)
    res.json(result.rows)
})

app.get('/api/contracts/bidItems', async(req, res) => {
    try {
        const { contractId, month, year } = req.query;

        // console.log("Contract ID received:", name);

        let query = `SELECT 
                        c.contract_name, 
                        bi.bid_item_no,
                        bi.description, 
                        bi.unit_price, 
                        bi.bid_value 
                    FROM bid_items bi
                    INNER JOIN contracts c ON c.id = bi.contract_id
                    WHERE 1=1 
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
        // console.log("Final Query:", query);        
        // console.log("With Parameters:", params);

        const results = await pool.query(query, params)
        console.log("Bid Items rows return from api:",results.rows);

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
            SELECT 
                b.company_name,
                COUNT(*) as contracts_submitted,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as bids_won,
                ROUND(
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) /
                    COUNT(*) * 100,
                    2
                ) as win_rate
            FROM contracts c
            INNER JOIN bidders b ON c.awarded_to = b.id
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

        query += ` GROUP BY b.company_name
                    ORDER BY win_rate DESC
        `;

        

        const results = await pool.query(query, params)
        
        if (results.rows.length === 0) {
            return res.json({ contracts_submitted: 0, bids_won: 0, win_rate: 0 });
        }

        // console.log("Win/Loss results:",results.rows);
        res.json(results.rows[0])

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

// ==================
//  Vendors Routes
// ==================

app.get('/api/contracts/vendor/performance', async(req, res) => {
    

    try {
        const { contractId } = req.query;
        const params = [];

        let query = `
                    SELECT 
                        v.description,
                        v.order_qty,
                        v.unit_price,
                        v.extended_price
                    FROM vendors v
                    INNER JOIN contracts c ON v.contract_id = c.id
                    WHERE 1=1
        `;

        
        
        if (contractId && contractId !== 'all') {
            query += ` AND c.id = $` + (params.length + 1)
            params.push(contractId);
        }

        query += `ORDER BY extended_price DESC`;

        const results = await pool.query(query, params);

        // console.log("Performance results:",results.rows);

        return res.json(results.rows);

    } catch (error) {
        console.log("Error occured when fetching...", error)
    }
})

app.get('/api/contracts/vendor/quote', async(req, res) => {
    

    try {
        const { contractId, month, year } = req.query;
        const params = [];

        let query = `
                SELECT 
                    v.company_name,
                    SUM(v.extended_price) as total_value,
                    COUNT(v.contract_id) as quote_count
                FROM vendors v
                INNER JOIN contracts c ON v.contract_id = c.id
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

        query += `
            GROUP BY v.company_name
            ORDER BY total_value DESC 
            LIMIT 5
        `;

        const results = await pool.query(query, params);

        // console.log("Results from vendors: ", results.rows.length);

        res.json(results.rows);

    } catch (error) {
        console.log("Error occured when fetching...", error)
    }
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
