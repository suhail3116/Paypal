import { getDb, logAudit, saveDb } from './db.js';

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const SECRET = process.env.PAYPAL_SECRET || '';

function isDemoMode() {
  return !CLIENT_ID || CLIENT_ID.includes('placeholder') || CLIENT_ID === 'your_sandbox_client_id';
}

async function getAccessToken() {
  if (isDemoMode()) return 'demo_token';

  const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Failed to authenticate with PayPal: ${response.statusText}`);
  }
  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder({ orderId, orderNumber, amount, returnUrl, cancelUrl }) {
  const db = getDb();
  const order = db.orders.find(o => o.id === orderId || o.order_number === orderNumber);
  if (!order) throw new Error('Order not found');

  if (isDemoMode()) {
    const demoId = `PAYPAL-DEMO-${Date.now()}`;
    const checkoutUrl = `${returnUrl || 'http://localhost:5173/payment-success'}?token=${demoId}&orderId=${order.id}`;

    const paymentRecord = {
      id: `pay-${Date.now()}`,
      order_id: order.id,
      order_number: order.order_number,
      amount: order.total_amount,
      payment_method: 'paypal',
      paypal_order_id: demoId,
      status: 'created',
      created_at: new Date().toISOString()
    };
    db.payments.push(paymentRecord);
    saveDb();
    logAudit('paypal_service', 'created_checkout_demo', `Order ${order.order_number}: $${order.total_amount}`);

    return {
      success: true,
      mode: 'sandbox_demo',
      paypal_order_id: demoId,
      checkout_url: checkoutUrl,
      note: 'Operating in Sandbox Demo Mode. Set PAYPAL_CLIENT_ID & PAYPAL_SECRET in backend/.env for live PayPal gateway.'
    };
  }

  const token = await getAccessToken();
  const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: order.id,
        description: `Order ${order.order_number}`,
        amount: {
          currency_code: 'USD',
          value: Number(order.total_amount).toFixed(2)
        }
      }],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: returnUrl,
            cancel_url: cancelUrl
          }
        }
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'PayPal order creation failed');
  }

  const approveLink = data.links?.find(l => l.rel === 'approve' || l.rel === 'payer-action')?.href;

  const paymentRecord = {
    id: `pay-${Date.now()}`,
    order_id: order.id,
    order_number: order.order_number,
    amount: order.total_amount,
    payment_method: 'paypal',
    paypal_order_id: data.id,
    status: 'created',
    created_at: new Date().toISOString()
  };
  db.payments.push(paymentRecord);
  saveDb();
  logAudit('paypal_service', 'created_checkout', `PayPal ID: ${data.id}`);

  return {
    success: true,
    mode: 'sandbox_live',
    paypal_order_id: data.id,
    checkout_url: approveLink
  };
}

export async function capturePayPalOrder(paypalOrderId) {
  const db = getDb();
  const payment = db.payments.find(p => p.paypal_order_id === paypalOrderId);
  
  if (isDemoMode() || (paypalOrderId && paypalOrderId.startsWith('PAYPAL-DEMO-'))) {
    if (payment) {
      payment.status = 'completed';
      const order = db.orders.find(o => o.id === payment.order_id);
      if (order) {
        order.payment_status = 'paid';
        order.payment_method = 'paypal';
      }
      const inv = db.invoices.find(i => i.order_id === payment.order_id);
      if (inv) inv.payment_status = 'paid';
      saveDb();
      logAudit('paypal_service', 'captured_payment_demo', `PayPal ID: ${paypalOrderId}`);
    }
    return { success: true, status: 'COMPLETED', simulated: true };
  }

  const token = await getAccessToken();
  const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  if (!response.ok) {
    if (payment) payment.status = 'failed';
    saveDb();
    throw new Error(data.message || 'Capture failed');
  }

  if (data.status === 'COMPLETED') {
    if (payment) {
      payment.status = 'completed';
      payment.paypal_capture_id = data.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      const order = db.orders.find(o => o.id === payment.order_id);
      if (order) {
        order.payment_status = 'paid';
        order.payment_method = 'paypal';
      }
      const inv = db.invoices.find(i => i.order_id === payment.order_id);
      if (inv) inv.payment_status = 'paid';
      saveDb();
      logAudit('paypal_service', 'payment_verified', `Captured ID: ${payment.paypal_capture_id}`);
    }
    return { success: true, status: 'COMPLETED', details: data };
  }

  return { success: false, status: data.status };
}
