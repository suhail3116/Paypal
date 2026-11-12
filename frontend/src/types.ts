export interface Shop {
  id: string;
  name: string;
  owner_email: string;
  business_phone: string;
  address: string;
  currency: string;
  tax_percentage: number;
  tax_registration_number: string;
  invoice_prefix: string;
  paypal_client_id: string;
  paypal_secret: string;
  paypal_mode: 'sandbox' | 'live';
  whatsapp_phone_number_id?: string;
  whatsapp_access_token?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  purchase_cost: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  tax_percentage: number;
  is_active: boolean;
  image_url?: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'damage';
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reference_id: string;
  notes: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  customer_source: 'website' | 'whatsapp' | 'phone' | 'pos' | 'walk-in' | 'manual';
  total_orders: number;
  total_purchases: number;
  outstanding_balance: number;
  last_order_date?: string;
  notes?: string;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  source: 'website' | 'whatsapp' | 'phone' | 'pos' | 'manual';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  order_status: 'draft' | 'pending_confirmation' | 'confirmed' | 'processing' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'unpaid' | 'pending' | 'paid' | 'partially_paid' | 'refunded';
  payment_method: 'paypal' | 'cash' | 'upi' | 'credit';
  delivery_address?: string;
  notes?: string;
  items: OrderItem[];
  offline_sync_id?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'unpaid' | 'paid';
  issued_date: string;
  due_date: string;
}

export interface Payment {
  id: string;
  order_id: string;
  order_number: string;
  amount: number;
  payment_method: string;
  paypal_order_id?: string;
  paypal_capture_id?: string;
  status: 'created' | 'completed' | 'failed' | 'refunded';
  created_at: string;
}

export interface PaymentReminder {
  id: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  channel: 'whatsapp' | 'sms' | 'email';
  reminder_message: string;
  status: 'pending_approval' | 'approved' | 'sent' | 'recovered' | 'rejected';
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  customer_phone: string;
  customer_name?: string;
  direction: 'inbound' | 'outbound';
  message_text: string;
  message_status: string;
  parsed_intent?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  detail: string;
  created_at: string;
}
