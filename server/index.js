import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDb, saveDb, logAudit, normalizePhone } from './db.js';
import * as aiService from './aiService.js';
import * as paypalService from './paypalService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// 1. HEALTH & ROOT
// -------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'ShopPilot AI Omnichannel Server',
    version: '2.0.0',
    endpoints: ['/api/dashboard', '/api/products', '/api/orders', '/api/pos', '/api/ai', '/api/whatsapp']
  });
});

// -------------------------------------------------------------
// 2. AUTH & SHOP SETTINGS (Section 3 & Section 20)
// -------------------------------------------------------------
app.get('/api/auth/profile', (req, res) => {
  const db = getDb();
  res.json({
    authenticated: true,
    user: { email: db.shop.owner_email, role: 'owner', name: 'Store Owner' },
    shop: db.shop
  });
});

app.post('/api/auth/settings', (req, res) => {
  const db = getDb();
  const { name, business_phone, address, currency, tax_percentage, tax_registration_number, invoice_prefix, paypal_mode, paypal_client_id, paypal_secret } = req.body;
  if (name) db.shop.name = name;
  if (business_phone) db.shop.business_phone = business_phone;
  if (address) db.shop.address = address;
  if (currency) db.shop.currency = currency;
  if (tax_percentage !== undefined) db.shop.tax_percentage = Number(tax_percentage);
  if (tax_registration_number) db.shop.tax_registration_number = tax_registration_number;
  if (invoice_prefix) db.shop.invoice_prefix = invoice_prefix;
  if (paypal_mode) db.shop.paypal_mode = paypal_mode;
  if (paypal_client_id) db.shop.paypal_client_id = paypal_client_id;
  if (paypal_secret) db.shop.paypal_secret = paypal_secret;

  saveDb();
  logAudit('owner', 'updated_shop_settings', 'Shop profile and tax configuration modified');
  res.json({ success: true, shop: db.shop });
});

// -------------------------------------------------------------
// 3. DASHBOARD METRICS & ANALYTICS (Section 4 & Section 18)
// -------------------------------------------------------------
app.get('/api/dashboard', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const todayOrders = db.orders.filter(o => o.created_at.startsWith(today));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.payment_status === 'paid' ? o.total_amount : 0), 0);
  const totalRevenue = db.orders.reduce((sum, o) => sum + (o.payment_status === 'paid' ? o.total_amount : 0), 0);

  const unpaidOrders = db.orders.filter(o => o.payment_status === 'unpaid');
  const outstandingTotal = unpaidOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const lowStock = db.products.filter(p => p.stock_quantity <= p.low_stock_threshold);

  const onlineOrders = db.orders.filter(o => o.source === 'website' || o.source === 'whatsapp');
  const offlineOrders = db.orders.filter(o => o.source === 'pos' || o.source === 'phone' || o.source === 'manual');

  res.json({
    kpis: {
      today_sales: todayRevenue,
      today_orders: todayOrders.length,
      total_revenue: totalRevenue,
      total_orders: db.orders.length,
      pending_orders: db.orders.filter(o => o.order_status === 'pending_confirmation' || o.order_status === 'confirmed').length,
      completed_orders: db.orders.filter(o => o.order_status === 'delivered').length,
      total_customers: db.customers.length,
      low_stock_count: lowStock.length,
      outstanding_payments: outstandingTotal,
      online_sales_count: onlineOrders.length,
      offline_sales_count: offlineOrders.length
    },
    low_stock_items: lowStock,
    unpaid_orders: unpaidOrders,
    recent_transactions: db.payments.slice(-6).reverse(),
    recent_orders: db.orders.slice(-8).reverse()
  });
});

// -------------------------------------------------------------
// 4. PRODUCTS & CATEGORIES (Section 5)
// -------------------------------------------------------------
app.get('/api/products', (req, res) => {
  const db = getDb();
  res.json({ products: db.products, categories: db.categories });
});

app.post('/api/products', (req, res) => {
  const db = getDb();
  const { name, category_id, sku, barcode, description, purchase_cost, selling_price, stock_quantity, low_stock_threshold, tax_percentage, image_url } = req.body;

  if (!name || !sku) {
    return res.status(400).json({ error: 'Product name and SKU are required' });
  }

  const newProd = {
    id: `prod-${Date.now()}`,
    name,
    category_id: category_id || db.categories[0]?.id || 'cat-1',
    sku: sku.toUpperCase(),
    barcode: barcode || `${Date.now()}`.slice(-13),
    description: description || '',
    purchase_cost: Number(purchase_cost) || 0,
    selling_price: Number(selling_price) || 0,
    stock_quantity: Number(stock_quantity) || 0,
    low_stock_threshold: Number(low_stock_threshold) || 5,
    tax_percentage: tax_percentage !== undefined ? Number(tax_percentage) : db.shop.tax_percentage,
    is_active: true,
    image_url: image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'
  };

  db.products.push(newProd);

  // Record initial stock addition movement
  if (newProd.stock_quantity > 0) {
    db.inventory_movements.unshift({
      id: `mov-${Date.now()}`,
      product_id: newProd.id,
      product_name: newProd.name,
      movement_type: 'purchase',
      quantity_change: newProd.stock_quantity,
      previous_stock: 0,
      new_stock: newProd.stock_quantity,
      reference_id: 'INITIAL_STOCK',
      notes: 'Initial inventory creation',
      created_at: new Date().toISOString()
    });
  }

  saveDb();
  logAudit('owner', 'created_product', `Added ${newProd.name} (${newProd.sku})`);
  res.status(201).json(newProd);
});

app.put('/api/products/:id', (req, res) => {
  const db = getDb();
  const prod = db.products.find(p => p.id === req.params.id);
  if (!prod) return res.status(400).json({ error: 'Product not found' });

  const { name, category_id, sku, barcode, description, purchase_cost, selling_price, stock_quantity, low_stock_threshold, tax_percentage } = req.body;

  if (name) prod.name = name;
  if (category_id) prod.category_id = category_id;
  if (sku) prod.sku = sku.toUpperCase();
  if (barcode) prod.barcode = barcode;
  if (description !== undefined) prod.description = description;
  if (purchase_cost !== undefined) prod.purchase_cost = Number(purchase_cost);
  if (selling_price !== undefined) prod.selling_price = Number(selling_price);
  if (low_stock_threshold !== undefined) prod.low_stock_threshold = Number(low_stock_threshold);
  if (tax_percentage !== undefined) prod.tax_percentage = Number(tax_percentage);

  // If stock was adjusted directly
  if (stock_quantity !== undefined && Number(stock_quantity) !== prod.stock_quantity) {
    const diff = Number(stock_quantity) - prod.stock_quantity;
    db.inventory_movements.unshift({
      id: `mov-${Date.now()}`,
      product_id: prod.id,
      product_name: prod.name,
      movement_type: 'adjustment',
      quantity_change: diff,
      previous_stock: prod.stock_quantity,
      new_stock: Number(stock_quantity),
      reference_id: 'MANUAL_EDIT',
      notes: 'Manual stock edit from product manager',
      created_at: new Date().toISOString()
    });
    prod.stock_quantity = Number(stock_quantity);
  }

  saveDb();
  logAudit('owner', 'updated_product', `Modified ${prod.name}`);
  res.json(prod);
});

app.delete('/api/products/:id', (req, res) => {
  const db = getDb();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });

  const [removed] = db.products.splice(index, 1);
  saveDb();
  logAudit('owner', 'deleted_product', `Removed ${removed.name} (${removed.sku})`);
  res.json({ success: true, removed });
});

// -------------------------------------------------------------
// 5. INVENTORY MOVEMENTS & VALUATION (Section 6)
// -------------------------------------------------------------
app.get('/api/inventory', (req, res) => {
  const db = getDb();
  const valuation = db.products.reduce((acc, p) => {
    acc.cost_value += p.purchase_cost * p.stock_quantity;
    acc.retail_value += p.selling_price * p.stock_quantity;
    acc.total_units += p.stock_quantity;
    return acc;
  }, { cost_value: 0, retail_value: 0, total_units: 0 });

  res.json({
    valuation,
    movements: db.inventory_movements.slice(0, 50),
    low_stock: db.products.filter(p => p.stock_quantity <= p.low_stock_threshold)
  });
});

app.post('/api/inventory/adjust', (req, res) => {
  const db = getDb();
  const { product_id, adjustment_type, quantity, notes } = req.body;
  const prod = db.products.find(p => p.id === product_id);
  if (!prod) return res.status(404).json({ error: 'Product not found' });

  const qty = Number(quantity);
  const change = adjustment_type === 'remove' || adjustment_type === 'damage' ? -qty : qty;
  const previous = prod.stock_quantity;
  const nextStock = Math.max(0, previous + change);

  prod.stock_quantity = nextStock;
  db.inventory_movements.unshift({
    id: `mov-${Date.now()}`,
    product_id: prod.id,
    product_name: prod.name,
    movement_type: adjustment_type || 'adjustment',
    quantity_change: change,
    previous_stock: previous,
    new_stock: nextStock,
    reference_id: `ADJ-${Date.now().toString().slice(-4)}`,
    notes: notes || 'Manual inventory adjustment',
    created_at: new Date().toISOString()
  });

  saveDb();
  logAudit('inventory_manager', 'adjusted_stock', `${prod.name}: ${previous} -> ${nextStock} (${notes || adjustment_type})`);
  res.json({ success: true, product: prod });
});

// -------------------------------------------------------------
// 6. CENTRALIZED CUSTOMER CRM (Section 7)
// -------------------------------------------------------------
app.get('/api/customers', (req, res) => {
  const db = getDb();
  res.json({ customers: db.customers });
});

app.get('/api/customers/:id', (req, res) => {
  const db = getDb();
  const customer = db.customers.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const orders = db.orders.filter(o => o.customer_id === customer.id || o.customer_phone === customer.phone);
  res.json({ customer, orders });
});

app.post('/api/customers', (req, res) => {
  const db = getDb();
  const { name, phone, email, address, notes, customer_source } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and Phone are required' });

  const normalized = normalizePhone(phone);
  const existing = db.customers.find(c => c.phone === normalized);
  if (existing) {
    return res.status(409).json({ error: 'Customer with this phone already exists', customer: existing });
  }

  const newCust = {
    id: `cust-${Date.now()}`,
    name,
    phone: normalized,
    email: email || '',
    address: address || '',
    notes: notes || '',
    customer_source: customer_source || 'manual',
    total_orders: 0,
    total_purchases: 0.00,
    outstanding_balance: 0.00,
    last_order_date: null,
    created_at: new Date().toISOString()
  };

  db.customers.push(newCust);
  saveDb();
  logAudit('crm', 'created_customer', `Added ${name} (${normalized})`);
  res.status(201).json(newCust);
});

// -------------------------------------------------------------
// 7. OMNICHANNEL ORDERS (Section 8, 10, 12)
// -------------------------------------------------------------
app.get('/api/orders', (req, res) => {
  const db = getDb();
  res.json({ orders: db.orders.slice().reverse() });
});

app.post('/api/orders', (req, res) => {
  const db = getDb();
  const { customer_name, customer_phone, customer_email, delivery_address, source, items, payment_method, notes } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  // Stock check & deduction
  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const prod = db.products.find(p => p.id === item.product_id);
    if (!prod) return res.status(400).json({ error: `Product not found: ${item.product_id}` });
    const qty = Number(item.quantity || 1);
    if (prod.stock_quantity < qty) {
      return res.status(400).json({ error: `Insufficient stock for ${prod.name}. Available: ${prod.stock_quantity}, requested: ${qty}` });
    }
    const lineTotal = prod.selling_price * qty;
    subtotal += lineTotal;
    processedItems.push({
      product_id: prod.id,
      product_name: prod.name,
      quantity: qty,
      unit_price: prod.selling_price,
      line_total: lineTotal
    });
  }

  // Deduct stock and log movements
  for (const item of processedItems) {
    const prod = db.products.find(p => p.id === item.product_id);
    const prev = prod.stock_quantity;
    prod.stock_quantity -= item.quantity;
    db.inventory_movements.unshift({
      id: `mov-${Date.now()}-${item.product_id}`,
      product_id: prod.id,
      product_name: prod.name,
      movement_type: 'sale',
      quantity_change: -item.quantity,
      previous_stock: prev,
      new_stock: prod.stock_quantity,
      reference_id: `ORD-${db.orders.length + 1001}`,
      notes: `${source || 'Order'} purchase deduction`,
      created_at: new Date().toISOString()
    });
  }

  // Centralized CRM Matching
  const normalizedPhone = normalizePhone(customer_phone || '9999999999');
  let customer = db.customers.find(c => c.phone === normalizedPhone);
  if (!customer && customer_name) {
    customer = {
      id: `cust-${Date.now()}`,
      name: customer_name,
      phone: normalizedPhone,
      email: customer_email || '',
      address: delivery_address || '',
      customer_source: source || 'website',
      total_orders: 1,
      total_purchases: subtotal,
      outstanding_balance: 0.00,
      last_order_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    db.customers.push(customer);
  } else if (customer) {
    customer.total_orders += 1;
    customer.total_purchases += subtotal;
    customer.last_order_date = new Date().toISOString();
  }

  const taxAmount = (subtotal * db.shop.tax_percentage) / 100;
  const totalAmount = subtotal + taxAmount;
  const orderNumber = `ORD-${db.orders.length + 1001}`;

  const newOrder = {
    id: `ord-${Date.now()}`,
    order_number: orderNumber,
    customer_id: customer?.id || null,
    customer_name: customer_name || customer?.name || 'Walk-in Shopper',
    customer_phone: normalizedPhone,
    source: source || 'website',
    subtotal,
    discount_amount: 0.00,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    order_status: 'confirmed',
    payment_status: payment_method === 'cash' ? 'paid' : 'unpaid',
    payment_method: payment_method || 'paypal',
    delivery_address: delivery_address || '',
    notes: notes || '',
    items: processedItems,
    created_at: new Date().toISOString()
  };

  db.orders.push(newOrder);

  // Generate automated invoice
  const newInvoice = {
    id: `inv-${Date.now()}`,
    invoice_number: `${db.shop.invoice_prefix}-${Date.now().toString().slice(-4)}`,
    order_id: newOrder.id,
    order_number: newOrder.order_number,
    customer_name: newOrder.customer_name,
    customer_phone: newOrder.customer_phone,
    subtotal: newOrder.subtotal,
    tax_amount: newOrder.tax_amount,
    total_amount: newOrder.total_amount,
    payment_status: newOrder.payment_status,
    issued_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 3600000 * 24 * 7).toISOString()
  };
  db.invoices.push(newInvoice);

  saveDb();
  logAudit('order_system', 'created_order', `${orderNumber} via ${source}: $${totalAmount.toFixed(2)}`);
  res.status(201).json({ order: newOrder, invoice: newInvoice });
});

// Update order status
app.patch('/api/orders/:id/status', (req, res) => {
  const db = getDb();
  const order = db.orders.find(o => o.id === req.params.id || o.order_number === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const { order_status, payment_status } = req.body;
  if (order_status) order.order_status = order_status;
  if (payment_status) {
    order.payment_status = payment_status;
    const inv = db.invoices.find(i => i.order_id === order.id);
    if (inv) inv.payment_status = payment_status;
  }

  saveDb();
  logAudit('order_manager', 'status_update', `${order.order_number}: Status -> ${order_status || order.order_status}, Payment -> ${payment_status || order.payment_status}`);
  res.json(order);
});

// -------------------------------------------------------------
// 8. OFFLINE POS BILLING & SYNC QUEUE (Section 11)
// -------------------------------------------------------------
app.post('/api/pos/checkout', (req, res) => {
  const db = getDb();
  const { items, payment_method, customer_name, customer_phone, discount_amount } = req.body;

  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const prod = db.products.find(p => p.id === item.product_id);
    if (!prod) return res.status(400).json({ error: `Product ID not found: ${item.product_id}` });
    const qty = Number(item.quantity || 1);
    if (prod.stock_quantity < qty) {
      return res.status(400).json({ error: `Not enough stock for ${prod.name}. Stock: ${prod.stock_quantity}` });
    }
    const lineTotal = prod.selling_price * qty;
    subtotal += lineTotal;
    processedItems.push({
      product_id: prod.id,
      product_name: prod.name,
      quantity: qty,
      unit_price: prod.selling_price,
      line_total: lineTotal
    });
  }

  // Deduct stock
  for (const item of processedItems) {
    const prod = db.products.find(p => p.id === item.product_id);
    const prev = prod.stock_quantity;
    prod.stock_quantity -= item.quantity;
    db.inventory_movements.unshift({
      id: `mov-${Date.now()}-${item.product_id}`,
      product_id: prod.id,
      product_name: prod.name,
      movement_type: 'sale',
      quantity_change: -item.quantity,
      previous_stock: prev,
      new_stock: prod.stock_quantity,
      reference_id: `POS-SALE`,
      notes: 'Counter POS sale',
      created_at: new Date().toISOString()
    });
  }

  const discount = Number(discount_amount || 0);
  const tax = ((subtotal - discount) * db.shop.tax_percentage) / 100;
  const total = subtotal - discount + tax;
  const orderNumber = `POS-${Date.now().toString().slice(-5)}`;

  const posOrder = {
    id: `ord-${Date.now()}`,
    order_number: orderNumber,
    customer_name: customer_name || 'Walk-in Shopper',
    customer_phone: normalizePhone(customer_phone || '0000000000'),
    source: 'pos',
    subtotal,
    discount_amount: discount,
    tax_amount: tax,
    total_amount: total,
    order_status: 'delivered',
    payment_status: payment_method === 'credit' ? 'unpaid' : 'paid',
    payment_method: payment_method || 'cash',
    items: processedItems,
    created_at: new Date().toISOString()
  };

  db.orders.push(posOrder);

  if (posOrder.payment_status === 'paid') {
    db.payments.push({
      id: `pay-${Date.now()}`,
      order_id: posOrder.id,
      order_number: orderNumber,
      amount: total,
      payment_method: payment_method || 'cash',
      status: 'completed',
      created_at: new Date().toISOString()
    });
  }

  saveDb();
  logAudit('pos_terminal', 'completed_sale', `${orderNumber}: $${total.toFixed(2)} via ${payment_method}`);
  res.status(201).json({ success: true, order: posOrder });
});

// Offline Sync Reconciliation Endpoint
app.post('/api/pos/sync', (req, res) => {
  const db = getDb();
  const { offline_orders } = req.body;
  if (!offline_orders || !Array.isArray(offline_orders)) {
    return res.status(400).json({ error: 'Expected offline_orders array' });
  }

  const synced = [];
  const errors = [];

  for (const off of offline_orders) {
    // Prevent duplicate sync using client UUID
    const alreadyExists = db.orders.some(o => o.offline_sync_id === off.offline_sync_id);
    if (alreadyExists) {
      synced.push({ sync_id: off.offline_sync_id, status: 'already_synced' });
      continue;
    }

    try {
      const orderNumber = `POS-OFF-${Date.now().toString().slice(-4)}`;
      const newOrder = {
        id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        offline_sync_id: off.offline_sync_id,
        order_number: orderNumber,
        customer_name: off.customer_name || 'Walk-in Shopper',
        customer_phone: normalizePhone(off.customer_phone || '0000000000'),
        source: 'pos',
        subtotal: off.subtotal,
        discount_amount: off.discount_amount || 0,
        tax_amount: off.tax_amount || 0,
        total_amount: off.total_amount,
        order_status: 'delivered',
        payment_status: off.payment_method === 'credit' ? 'unpaid' : 'paid',
        payment_method: off.payment_method || 'cash',
        items: off.items,
        created_at: off.timestamp || new Date().toISOString()
      };

      // Deduct inventory
      for (const it of off.items) {
        const prod = db.products.find(p => p.id === it.product_id);
        if (prod) {
          const prev = prod.stock_quantity;
          prod.stock_quantity = Math.max(0, prod.stock_quantity - it.quantity);
          db.inventory_movements.unshift({
            id: `mov-${Date.now()}-${it.product_id}`,
            product_id: prod.id,
            product_name: prod.name,
            movement_type: 'sale',
            quantity_change: -it.quantity,
            previous_stock: prev,
            new_stock: prod.stock_quantity,
            reference_id: orderNumber,
            notes: 'Reconciled from offline POS sync',
            created_at: new Date().toISOString()
          });
        }
      }

      db.orders.push(newOrder);
      synced.push({ sync_id: off.offline_sync_id, order_number: orderNumber, status: 'synced' });
    } catch (e) {
      errors.push({ sync_id: off.offline_sync_id, error: e.message });
    }
  }

  saveDb();
  logAudit('pos_sync', 'reconciled_offline_batch', `Synced ${synced.length} offline orders`);
  res.json({ success: true, synced, errors });
});

// -------------------------------------------------------------
// 9. INVOICES (Section 14)
// -------------------------------------------------------------
app.get('/api/invoices', (req, res) => {
  const db = getDb();
  res.json({ invoices: db.invoices.slice().reverse() });
});

// -------------------------------------------------------------
// 10. PAYPAL PAYMENTS (Section 13)
// -------------------------------------------------------------
app.get('/api/payments', (req, res) => {
  const db = getDb();
  res.json({
    payments: db.payments.slice().reverse(),
    mode: db.shop.paypal_mode,
    has_credentials: Boolean(db.shop.paypal_client_id && !db.shop.paypal_client_id.includes('placeholder'))
  });
});

app.post('/api/payments/create-order', async (req, res) => {
  try {
    const { order_id, order_number, amount, return_url, cancel_url } = req.body;
    const result = await paypalService.createPayPalOrder({
      orderId: order_id,
      orderNumber: order_number,
      amount,
      returnUrl: return_url,
      cancelUrl: cancel_url
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments/capture-order', async (req, res) => {
  try {
    const { paypal_order_id } = req.body;
    const result = await paypalService.capturePayPalOrder(paypal_order_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 11. WHATSAPP CLOUD API & AI ORDER EXTRACTION (Section 9)
// -------------------------------------------------------------
// Webhook Verification (WhatsApp Cloud API compliance)
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === (process.env.WHATSAPP_VERIFY_TOKEN || 'shoppilot_webhook_secret')) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post('/api/whatsapp/webhook', (req, res) => {
  const db = getDb();
  const entry = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (entry) {
    db.whatsapp_messages.unshift({
      id: `wa-${Date.now()}`,
      customer_phone: entry.from,
      customer_name: 'WhatsApp Customer',
      direction: 'inbound',
      message_text: entry.text?.body || '',
      message_status: 'received',
      created_at: new Date().toISOString()
    });
    saveDb();
  }
  res.sendStatus(200);
});

// AI Parse WhatsApp Message into Draft Order
app.post('/api/whatsapp/parse-order', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message text required' });

    const extraction = await aiService.extractWhatsAppOrder(message);

    // Save message to log
    const db = getDb();
    db.whatsapp_messages.unshift({
      id: `wa-${Date.now()}`,
      customer_phone: extraction.phone,
      customer_name: extraction.customer_name,
      direction: 'inbound',
      message_text: message,
      message_status: 'parsed',
      parsed_intent: 'place_order',
      created_at: new Date().toISOString()
    });
    saveDb();

    res.json(extraction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 12. AI SERVICES (Section 15, 16, 17)
// -------------------------------------------------------------
// AI Daily Shop Manager Briefing
app.get('/api/ai/daily-plan', async (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const facts = {
      unpaid_orders: db.orders.filter(o => o.payment_status === 'unpaid'),
      low_stock: db.products.filter(p => p.stock_quantity <= p.low_stock_threshold),
      sales_today: {
        revenue: db.orders.filter(o => o.created_at.startsWith(today) && o.payment_status === 'paid').reduce((a, b) => a + b.total_amount, 0),
        orders: db.orders.filter(o => o.created_at.startsWith(today)).length
      }
    };
    const plan = await aiService.generateDailyPlan(facts);
    res.json({ facts, plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Natural Language Assistant (Grounded in Store DB)
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { query } = req.body;
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const context = {
      products: db.products,
      low_stock: db.products.filter(p => p.stock_quantity <= p.low_stock_threshold),
      unpaid_orders: db.orders.filter(o => o.payment_status === 'unpaid'),
      sales_today: {
        revenue: db.orders.filter(o => o.created_at.startsWith(today) && o.payment_status === 'paid').reduce((a, b) => a + b.total_amount, 0),
        orders: db.orders.filter(o => o.created_at.startsWith(today)).length
      },
      top_customers: db.customers.slice().sort((a, b) => b.total_purchases - a.total_purchases).slice(0, 5)
    };

    const reply = await aiService.answerShopAssistant(query, context);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Payment Recovery Agent (Section 16)
app.get('/api/ai/recovery-reminders', (req, res) => {
  const db = getDb();
  res.json({ reminders: db.payment_reminders.slice().reverse() });
});

app.post('/api/ai/generate-reminder', async (req, res) => {
  try {
    const { order_id } = req.body;
    const db = getDb();
    const order = db.orders.find(o => o.id === order_id || o.order_number === order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const reminderText = await aiService.generatePaymentReminder(order.customer_name, order.order_number, order.total_amount);
    const newReminder = {
      id: `rem-${Date.now()}`,
      order_id: order.id,
      order_number: order.order_number,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      amount: order.total_amount,
      channel: 'whatsapp',
      reminder_message: reminderText.replace('[PAYPAL_LINK]', `http://localhost:5173/checkout/${order.id}`),
      status: 'pending_approval',
      created_at: new Date().toISOString()
    };

    db.payment_reminders.unshift(newReminder);
    saveDb();
    logAudit('recovery_agent', 'queued_reminder', `Reminder created for ${order.order_number} ($${order.total_amount})`);
    res.status(201).json(newReminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/approve-reminder/:id', (req, res) => {
  const db = getDb();
  const reminder = db.payment_reminders.find(r => r.id === req.params.id);
  if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

  reminder.status = 'sent';
  reminder.sent_at = new Date().toISOString();
  saveDb();
  logAudit('owner', 'approved_reminder_dispatch', `Sent payment reminder to ${reminder.customer_phone}`);
  res.json({ success: true, reminder });
});

// -------------------------------------------------------------
// 13. AUDIT LOGS (Section 20)
// -------------------------------------------------------------
app.get('/api/audit-logs', (req, res) => {
  const db = getDb();
  res.json({ audit_logs: db.audit_logs });
});

// START SERVER
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` ShopPilot AI Omnichannel Server running on port ${PORT}`);
  console.log(` Mode: Multi-Tenant / PostgreSQL-Supabase Ready`);
  console.log(` Free Cloud AI & Local Ollama Engines Active`);
  console.log(`====================================================`);
});
