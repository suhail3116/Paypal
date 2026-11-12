import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'shoppilot_data.json');

// Supabase Cloud Client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

export const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Helper to normalize phone numbers to clean standard format
export function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`; // default country code prefix
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  return `+${digits}`;
}

const INITIAL_DATA = {
  shop: {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Apex Mart & Grocers',
    owner_email: 'demo@shoppilot.ai',
    business_phone: '+1 (555) 234-5678',
    address: '742 Evergreen Terrace, Springfield, OR',
    currency: 'USD',
    tax_percentage: 5.00,
    tax_registration_number: 'GSTIN-98765432-A1',
    invoice_prefix: 'INV-2026',
    paypal_client_id: process.env.PAYPAL_CLIENT_ID || 'sandbox_client_placeholder',
    paypal_secret: process.env.PAYPAL_SECRET || 'sandbox_secret_placeholder',
    paypal_mode: 'sandbox',
    whatsapp_phone_number_id: '',
    whatsapp_access_token: '',
  },
  categories: [
    { id: 'cat-1', name: 'Grains & Flours', slug: 'grains-flours', description: 'Basmati rice, wheat atta & pulses' },
    { id: 'cat-2', name: 'Oils & Ghee', slug: 'oils-ghee', description: 'Cooking oils and pure cow ghee' },
    { id: 'cat-3', name: 'Beverages & Tea', slug: 'beverages-tea', description: 'Assam black tea & artisan coffee' },
    { id: 'cat-4', name: 'Dry Fruits & Nuts', slug: 'dry-fruits-nuts', description: 'Almonds, cashews & dry fruits' },
  ],
  products: [
    {
      id: 'prod-1',
      category_id: 'cat-1',
      name: 'Basmati Rice Royal 5kg',
      sku: 'RICE-5KG',
      barcode: '8901234567890',
      description: 'Aged Himalayan long-grain aromatic basmati rice',
      purchase_cost: 8.50,
      selling_price: 14.50,
      stock_quantity: 24,
      low_stock_threshold: 6,
      tax_percentage: 5.00,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80'
    },
    {
      id: 'prod-2',
      category_id: 'cat-2',
      name: 'Organic Sunflower Oil 1L',
      sku: 'OIL-1L',
      barcode: '8901234567891',
      description: 'Cold-pressed expeller pressed organic sunflower cooking oil',
      purchase_cost: 3.20,
      selling_price: 6.00,
      stock_quantity: 18,
      low_stock_threshold: 5,
      tax_percentage: 5.00,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80'
    },
    {
      id: 'prod-3',
      category_id: 'cat-1',
      name: 'Whole Wheat Atta 10kg',
      sku: 'ATTA-10KG',
      barcode: '8901234567892',
      description: '100% stone-ground chakki whole wheat flour',
      purchase_cost: 5.50,
      selling_price: 11.00,
      stock_quantity: 3, // LOW STOCK
      low_stock_threshold: 6,
      tax_percentage: 0.00,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80'
    },
    {
      id: 'prod-4',
      category_id: 'cat-3',
      name: 'Assam Orthodox Black Tea 500g',
      sku: 'TEA-500G',
      barcode: '8901234567893',
      description: 'Single estate strong aromatic orthodox morning tea',
      purchase_cost: 2.80,
      selling_price: 5.50,
      stock_quantity: 4, // LOW STOCK
      low_stock_threshold: 6,
      tax_percentage: 5.00,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80'
    },
    {
      id: 'prod-5',
      category_id: 'cat-2',
      name: 'Pure Desi Cow Ghee 1L',
      sku: 'GHEE-1L',
      barcode: '8901234567894',
      description: 'Traditional bilona churned golden cow ghee',
      purchase_cost: 9.00,
      selling_price: 16.50,
      stock_quantity: 12,
      low_stock_threshold: 4,
      tax_percentage: 5.00,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&auto=format&fit=crop&q=80'
    },
    {
      id: 'prod-6',
      category_id: 'cat-4',
      name: 'California Raw Almonds 500g',
      sku: 'ALM-500G',
      barcode: '8901234567895',
      description: 'Premium natural crunch almonds packed fresh',
      purchase_cost: 4.50,
      selling_price: 8.50,
      stock_quantity: 2, // LOW STOCK
      low_stock_threshold: 5,
      tax_percentage: 5.00,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&auto=format&fit=crop&q=80'
    }
  ],
  customers: [
    {
      id: 'cust-1',
      name: 'Ravi Kumar',
      phone: '+19876543210',
      email: 'ravi.kumar@example.com',
      address: '124 Maple St, Springfield',
      customer_source: 'whatsapp',
      total_orders: 4,
      total_purchases: 85.50,
      outstanding_balance: 0.00,
      last_order_date: new Date(Date.now() - 3600000 * 24).toISOString(),
      notes: 'Prefers WhatsApp updates & delivery before noon'
    },
    {
      id: 'cust-2',
      name: 'Priya Sharma',
      phone: '+19123456780',
      email: 'priya.sharma@example.com',
      address: '458 Oak Ave, Apt 3B',
      customer_source: 'website',
      total_orders: 2,
      total_purchases: 42.00,
      outstanding_balance: 23.50,
      last_order_date: new Date(Date.now() - 3600000 * 6).toISOString(),
      notes: 'Wholesale client. Payment due within 7 days.'
    },
    {
      id: 'cust-3',
      name: 'David Miller',
      phone: '+15551239874',
      email: 'david.m@example.com',
      address: 'Walk-in regular',
      customer_source: 'pos',
      total_orders: 6,
      total_purchases: 120.00,
      outstanding_balance: 0.00,
      last_order_date: new Date(Date.now() - 3600000 * 2).toISOString(),
      notes: 'Local neighborhood shopper'
    }
  ],
  orders: [
    {
      id: 'ord-1001',
      order_number: 'ORD-1001',
      customer_id: 'cust-2',
      customer_name: 'Priya Sharma',
      customer_phone: '+19123456780',
      source: 'website',
      subtotal: 22.00,
      discount_amount: 0.00,
      tax_amount: 1.50,
      total_amount: 23.50,
      order_status: 'confirmed',
      payment_status: 'unpaid',
      payment_method: 'paypal',
      delivery_address: '458 Oak Ave, Apt 3B',
      items: [
        { product_id: 'prod-1', product_name: 'Basmati Rice Royal 5kg', quantity: 1, unit_price: 14.50, line_total: 14.50 },
        { product_id: 'prod-4', product_name: 'Assam Orthodox Black Tea 500g', quantity: 1, unit_price: 5.50, line_total: 5.50 }
      ],
      created_at: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'ord-1002',
      order_number: 'ORD-1002',
      customer_id: 'cust-3',
      customer_name: 'David Miller',
      customer_phone: '+15551239874',
      source: 'pos',
      subtotal: 16.50,
      discount_amount: 0.00,
      tax_amount: 0.83,
      total_amount: 17.33,
      order_status: 'delivered',
      payment_status: 'paid',
      payment_method: 'cash',
      delivery_address: 'In-store POS checkout',
      items: [
        { product_id: 'prod-5', product_name: 'Pure Desi Cow Ghee 1L', quantity: 1, unit_price: 16.50, line_total: 16.50 }
      ],
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ],
  inventory_movements: [
    {
      id: 'mov-1',
      product_id: 'prod-1',
      product_name: 'Basmati Rice Royal 5kg',
      movement_type: 'sale',
      quantity_change: -1,
      previous_stock: 25,
      new_stock: 24,
      reference_id: 'ORD-1001',
      notes: 'Website checkout order deduction',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'mov-2',
      product_id: 'prod-5',
      product_name: 'Pure Desi Cow Ghee 1L',
      movement_type: 'sale',
      quantity_change: -1,
      previous_stock: 13,
      new_stock: 12,
      reference_id: 'ORD-1002',
      notes: 'In-store POS counter sale',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ],
  payments: [
    {
      id: 'pay-1',
      order_id: 'ord-1002',
      order_number: 'ORD-1002',
      amount: 17.33,
      payment_method: 'cash',
      status: 'completed',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ],
  invoices: [
    {
      id: 'inv-1001',
      invoice_number: 'INV-2026-001',
      order_id: 'ord-1001',
      order_number: 'ORD-1001',
      customer_name: 'Priya Sharma',
      customer_phone: '+19123456780',
      subtotal: 22.00,
      tax_amount: 1.50,
      total_amount: 23.50,
      payment_status: 'unpaid',
      issued_date: new Date(Date.now() - 3600000 * 5).toISOString(),
      due_date: new Date(Date.now() + 3600000 * 24 * 7).toISOString()
    },
    {
      id: 'inv-1002',
      invoice_number: 'INV-2026-002',
      order_id: 'ord-1002',
      order_number: 'ORD-1002',
      customer_name: 'David Miller',
      customer_phone: '+15551239874',
      subtotal: 16.50,
      tax_amount: 0.83,
      total_amount: 17.33,
      payment_status: 'paid',
      issued_date: new Date(Date.now() - 3600000 * 2).toISOString(),
      due_date: new Date().toISOString()
    }
  ],
  whatsapp_messages: [
    {
      id: 'wa-1',
      customer_phone: '+19876543210',
      customer_name: 'Ravi Kumar',
      direction: 'inbound',
      message_text: 'Hi, please send 2 Basmati Rice 5kg and 1 Organic Sunflower Oil tomorrow morning.',
      message_status: 'parsed',
      parsed_intent: 'place_order',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ],
  payment_reminders: [
    {
      id: 'rem-1',
      order_id: 'ord-1001',
      order_number: 'ORD-1001',
      customer_id: 'cust-2',
      customer_name: 'Priya Sharma',
      customer_phone: '+19123456780',
      amount: 23.50,
      channel: 'whatsapp',
      reminder_message: 'Hi Priya, this is a gentle reminder from Apex Mart regarding Order #ORD-1001 of $23.50. You can pay securely via PayPal here: https://paypal.com/checkout/demo-link',
      status: 'pending_approval',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString()
    }
  ],
  audit_logs: [
    {
      id: 1,
      actor: 'system',
      action: 'database_initialized',
      detail: 'ShopPilot AI Omnichannel Database initialized with 6 products and 3 customers',
      created_at: new Date().toISOString()
    }
  ]
};

// Load or initialize database
let db = null;

export function getDb() {
  if (!db) {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        db = JSON.parse(raw);
      } catch (e) {
        db = JSON.parse(JSON.stringify(INITIAL_DATA));
        saveDb();
      }
    } else {
      db = JSON.parse(JSON.stringify(INITIAL_DATA));
      saveDb();
    }
  }
  return db;
}

export function saveDb() {
  if (db) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database to disk:', e);
    }
  }
}

export async function syncFromSupabase() {
  if (!supabase) return;
  try {
    const [shopRes, prodRes, custRes, catRes] = await Promise.all([
      supabase.from('shops').select('*').limit(1),
      supabase.from('products').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('product_categories').select('*')
    ]);

    const currentDb = getDb();
    if (shopRes.data && shopRes.data.length > 0) {
      currentDb.shop = { ...currentDb.shop, ...shopRes.data[0] };
    }
    if (catRes.data && catRes.data.length > 0) {
      currentDb.categories = catRes.data;
    }
    if (prodRes.data && prodRes.data.length > 0) {
      currentDb.products = prodRes.data;
    }
    if (custRes.data && custRes.data.length > 0) {
      currentDb.customers = custRes.data;
    }
    saveDb();
    console.log(`[Supabase Cloud] Synchronized: ${prodRes.data?.length || 0} products, ${custRes.data?.length || 0} customers.`);
  } catch (err) {
    console.warn('[Supabase Cloud] Live sync deferred:', err.message);
  }
}

export function logAudit(actor, action, detail) {
  const currentDb = getDb();
  const newLog = {
    id: currentDb.audit_logs.length + 1,
    actor,
    action,
    detail: String(detail),
    created_at: new Date().toISOString()
  };
  currentDb.audit_logs.unshift(newLog);
  if (currentDb.audit_logs.length > 100) currentDb.audit_logs.pop();
  saveDb();
  return newLog;
}
