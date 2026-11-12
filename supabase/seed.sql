-- ==============================================================================
-- ShopPilot AI - Seed Demo Data for Supabase PostgreSQL
-- ==============================================================================

-- 1. Demo Shop
INSERT INTO shops (
    id,
    name,
    owner_email,
    business_phone,
    address,
    currency,
    tax_percentage,
    tax_registration_number,
    invoice_prefix,
    paypal_mode
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Apex Mart & Grocers',
    'demo@shoppilot.ai',
    '+1 (555) 234-5678',
    '742 Evergreen Terrace, Springfield, OR',
    'USD',
    5.00,
    'TAX-US-98765432',
    'INV-2026',
    'sandbox'
) ON CONFLICT (owner_email) DO NOTHING;

-- 2. Product Categories
INSERT INTO product_categories (id, shop_id, name, slug, description) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Grains & Flours', 'grains-flours', 'Premium basmati rice, organic wheat atta, and pulses'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Oils & Ghee', 'oils-ghee', 'Cold-pressed sunflower oil, pure desi cow ghee'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Beverages & Tea', 'beverages-tea', 'Single origin black tea, roasted artisan coffee beans'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Dry Fruits & Nuts', 'dry-fruits-nuts', 'California almonds, jumbo whole cashews')
ON CONFLICT (shop_id, slug) DO NOTHING;

-- 3. Products (All rows have exactly 12 columns)
INSERT INTO products (
    id,
    shop_id,
    category_id,
    name,
    sku,
    barcode,
    description,
    purchase_cost,
    selling_price,
    stock_quantity,
    low_stock_threshold,
    tax_percentage
) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Basmati Rice Royal 5kg', 'RICE-5KG', '8901234567890', 'Aged Himalayan long-grain aromatic basmati rice', 8.50, 14.50, 24, 6, 5.00),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Organic Sunflower Oil 1L', 'OIL-1L', '8901234567891', 'Pure cold-pressed expeller sunflower cooking oil', 3.20, 6.00, 18, 5, 5.00),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Whole Wheat Atta 10kg', 'ATTA-10KG', '8901234567892', '100% stone-ground whole wheat chakki flour', 5.50, 11.00, 3, 6, 0.00),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Assam Orthodox Black Tea 500g', 'TEA-500G', '8901234567893', 'Single estate strong aromatic CTC morning tea', 2.80, 5.50, 4, 6, 5.00),
('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Pure Desi Cow Ghee 1L', 'GHEE-1L', '8901234567894', 'Traditional bilona churned golden cow ghee', 9.00, 16.50, 12, 4, 5.00),
('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'California Raw Almonds 500g', 'ALM-500G', '8901234567895', 'Grade A natural crunch almonds packed fresh', 4.50, 8.50, 2, 5, 5.00)
ON CONFLICT (shop_id, sku) DO NOTHING;

-- 4. Centralized CRM Customers
INSERT INTO customers (
    id,
    shop_id,
    name,
    phone,
    email,
    address,
    customer_source,
    total_orders,
    total_purchases,
    outstanding_balance
) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ravi Kumar', '+19876543210', 'ravi.kumar@example.com', '124 Maple St, Springfield', 'whatsapp', 4, 85.50, 0.00),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Priya Sharma', '+19123456780', 'priya.sharma@example.com', '458 Oak Ave, Apt 3B', 'website', 2, 42.00, 23.50),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'David Miller', '+15551239874', 'david.m@example.com', 'Walk-in shopper', 'pos', 6, 120.00, 0.00)
ON CONFLICT (shop_id, phone) DO NOTHING;
