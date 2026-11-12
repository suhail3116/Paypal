CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT,
    type TEXT DEFAULT 'retail'
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT,
    cost_price REAL,
    sell_price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER REFERENCES customers(id),
    source TEXT DEFAULT 'whatsapp', -- whatsapp | phone | walk-in | website
    total REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'unpaid', -- unpaid | paid | failed
    fulfillment_status TEXT DEFAULT 'new', -- new | packed | delivered
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    qty INTEGER NOT NULL,
    unit_price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id),
    amount REAL,
    method TEXT DEFAULT 'paypal', -- paypal | cash | upi
    paypal_order_id TEXT,
    status TEXT DEFAULT 'created', -- created | completed | failed
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pending_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    args TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending | approved | rejected
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Seed Demo Customers
INSERT OR IGNORE INTO customers (id, name, phone, email, type) VALUES
(1, 'Ravi Kumar', '9876543210', 'ravi.kumar@example.com', 'retail'),
(2, 'Priya Sharma', '9123456780', 'priya.sharma@example.com', 'wholesale'),
(3, 'Ananya Patel', '9988776655', 'ananya.p@example.com', 'retail');

-- Seed Demo Products
INSERT OR IGNORE INTO products (id, name, sku, cost_price, sell_price, stock, min_stock) VALUES
(1, 'Basmati Rice 5kg', 'RICE-001', 8.50, 12.00, 18, 5),
(2, 'Organic Sunflower Oil 1L', 'OIL-002', 3.20, 5.50, 14, 5),
(3, 'Whole Wheat Atta 10kg', 'FLOUR-003', 6.00, 9.50, 4, 6),
(4, 'Assam Black Tea 500g', 'TEA-004', 2.80, 4.50, 3, 5),
(5, 'Pure Desi Ghee 1L', 'GHEE-005', 9.00, 14.00, 8, 4),
(6, 'Toor Dal 1kg', 'DAL-006', 1.80, 2.90, 25, 8),
(7, 'Almonds 500g', 'NUT-007', 5.50, 8.50, 2, 5),
(8, 'Cashew Nuts 500g', 'NUT-008', 6.00, 9.00, 10, 4);

-- Seed an existing demo order (unpaid) to showcase the Daily Shop Manager and unpaid collections
INSERT OR IGNORE INTO orders (id, customer_id, source, total, payment_status, fulfillment_status, created_at) VALUES
(1, 2, 'whatsapp', 23.50, 'unpaid', 'new', datetime('now', '-2 hours')),
(2, 3, 'whatsapp', 14.00, 'unpaid', 'new', datetime('now', '-4 hours'));

INSERT OR IGNORE INTO order_items (order_id, product_id, qty, unit_price) VALUES
(1, 1, 1, 12.00),
(1, 2, 1, 5.50),
(1, 3, 1, 6.00),
(2, 5, 1, 14.00);
