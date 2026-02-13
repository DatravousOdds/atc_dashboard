
-- CREATE INVOICES TABLE 
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,

  invoice_date DATE,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  due_date DATE,

  transaction_type VARCHAR(50) CHECK (transaction_type IN ('invoice', 'bill', 'credit', 'payment')),
  description VARCHAR(255),
 
  amount DECIMAL(12,2) NOT NULL,
  open_balance DECIMAL(12, 2) DEFAULT 0,

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_date DATE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);