import {
  Shop,
  Product,
  Category,
  Customer,
  Order,
  Invoice,
  Payment,
  PaymentReminder,
  WhatsAppMessage,
  AuditLog
} from './types';

const API_BASE = '';

// Dashboard
export async function getDashboard() {
  const res = await fetch(`${API_BASE}/api/dashboard`);
  if (!res.ok) throw new Error('Failed to load dashboard telemetry');
  return res.json();
}

// Shop Settings & Auth
export async function getShopProfile(): Promise<{ authenticated: boolean; shop: Shop }> {
  const res = await fetch(`${API_BASE}/api/auth/profile`);
  if (!res.ok) throw new Error('Failed to load shop profile');
  return res.json();
}

export async function updateShopSettings(data: Partial<Shop>): Promise<{ success: boolean; shop: Shop }> {
  const res = await fetch(`${API_BASE}/api/auth/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update shop settings');
  return res.json();
}

// Products
export async function getProducts(): Promise<{ products: Product[]; categories: Category[] }> {
  const res = await fetch(`${API_BASE}/api/products`);
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}

// Inventory
export async function getInventory() {
  const res = await fetch(`${API_BASE}/api/inventory`);
  if (!res.ok) throw new Error('Failed to load inventory valuation');
  return res.json();
}

export async function adjustInventory(payload: { product_id: string; adjustment_type: string; quantity: number; notes?: string }) {
  const res = await fetch(`${API_BASE}/api/inventory/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to adjust inventory');
  return res.json();
}

// Customers
export async function getCustomers(): Promise<{ customers: Customer[] }> {
  const res = await fetch(`${API_BASE}/api/customers`);
  if (!res.ok) throw new Error('Failed to load customers');
  return res.json();
}

export async function createCustomer(data: Partial<Customer>): Promise<Customer> {
  const res = await fetch(`${API_BASE}/api/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create customer');
  }
  return res.json();
}

// Orders
export async function getOrders(): Promise<{ orders: Order[] }> {
  const res = await fetch(`${API_BASE}/api/orders`);
  if (!res.ok) throw new Error('Failed to load orders');
  return res.json();
}

export async function createOrder(payload: any): Promise<{ order: Order; invoice: Invoice }> {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create order');
  }
  return res.json();
}

export async function updateOrderStatus(id: string, statusPayload: { order_status?: string; payment_status?: string }): Promise<Order> {
  const res = await fetch(`${API_BASE}/api/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(statusPayload)
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}

// POS Billing & Offline Sync
export async function posCheckout(payload: any): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/api/pos/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'POS checkout failed');
  }
  return res.json();
}

export async function syncOfflinePOS(offlineOrders: any[]): Promise<{ success: boolean; synced: any[]; errors: any[] }> {
  const res = await fetch(`${API_BASE}/api/pos/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offline_orders: offlineOrders })
  });
  if (!res.ok) throw new Error('Failed to synchronize offline POS batch');
  return res.json();
}

// Invoices
export async function getInvoices(): Promise<{ invoices: Invoice[] }> {
  const res = await fetch(`${API_BASE}/api/invoices`);
  if (!res.ok) throw new Error('Failed to load invoices');
  return res.json();
}

// PayPal Payments
export async function getPayments(): Promise<{ payments: Payment[]; mode: string; has_credentials: boolean }> {
  const res = await fetch(`${API_BASE}/api/payments`);
  if (!res.ok) throw new Error('Failed to load payment transactions');
  return res.json();
}

export async function createPayPalOrder(payload: { order_id?: string; order_number?: string; amount: number; return_url?: string; cancel_url?: string }) {
  const res = await fetch(`${API_BASE}/api/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to initialize PayPal order');
  return res.json();
}

export async function capturePayPalOrder(paypalOrderId: string) {
  const res = await fetch(`${API_BASE}/api/payments/capture-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paypal_order_id: paypalOrderId })
  });
  if (!res.ok) throw new Error('Failed to capture PayPal transaction');
  return res.json();
}

// WhatsApp Cloud API & AI Parsing
export async function parseWhatsAppOrder(message: string) {
  const res = await fetch(`${API_BASE}/api/whatsapp/parse-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error('Failed to parse WhatsApp message');
  return res.json();
}

// AI Services
export async function getDailyPlan(): Promise<{ facts: any; plan: string }> {
  const res = await fetch(`${API_BASE}/api/ai/daily-plan`);
  if (!res.ok) throw new Error('Failed to generate daily morning briefing');
  return res.json();
}

export async function askAIAssistant(query: string): Promise<{ reply: string }> {
  const res = await fetch(`${API_BASE}/api/ai/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Failed to query AI assistant');
  return res.json();
}

export async function getRecoveryReminders(): Promise<{ reminders: PaymentReminder[] }> {
  const res = await fetch(`${API_BASE}/api/ai/recovery-reminders`);
  if (!res.ok) throw new Error('Failed to load payment reminders');
  return res.json();
}

export async function generatePaymentReminder(orderId: string): Promise<PaymentReminder> {
  const res = await fetch(`${API_BASE}/api/ai/generate-reminder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId })
  });
  if (!res.ok) throw new Error('Failed to generate recovery reminder');
  return res.json();
}

export async function approvePaymentReminder(id: string): Promise<{ success: boolean; reminder: PaymentReminder }> {
  const res = await fetch(`${API_BASE}/api/ai/approve-reminder/${id}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve payment reminder');
  return res.json();
}

// Audit Logs
export async function getAuditLogs(): Promise<{ audit_logs: AuditLog[] }> {
  const res = await fetch(`${API_BASE}/api/audit-logs`);
  if (!res.ok) throw new Error('Failed to load audit trail');
  return res.json();
}
