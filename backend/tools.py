import json
from db import q, run, audit
import paypal

def get_unpaid_orders():
    """Retrieve all current unpaid customer orders with totals and customer names."""
    return q('''
        SELECT o.id, c.name, o.total, o.created_at, o.source 
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE o.payment_status = 'unpaid'
        ORDER BY o.created_at DESC
    ''')

def get_low_stock():
    """Fetch items that are currently at or below their minimum reorder stock threshold."""
    return q('''
        SELECT id, name, sku, stock, min_stock, sell_price 
        FROM products 
        WHERE stock <= min_stock
    ''')

def get_sales_today():
    """Calculate the total number of paid/all orders and gross revenue recorded today."""
    rows = q('''
        SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
        FROM orders 
        WHERE date(created_at) = date('now')
    ''')
    return rows[0] if rows else {"orders": 0, "revenue": 0.0}

def find_customer(name: str):
    """Search for existing customers by partial or full name."""
    return q("SELECT id, name, phone, email, type FROM customers WHERE name LIKE ?", (f"%{name}%",))

def get_product_stock(name: str):
    """Search product inventory by name to check live availability and pricing."""
    return q("SELECT id, name, stock, min_stock, sell_price FROM products WHERE name LIKE ?", (f"%{name}%",))

def create_order(customer_id: int, items: list) -> dict:
    """
    Validates stock availability, deducts inventory, and records a new customer order.
    `items` format: [{"product_id": 1, "qty": 2}]
    """
    if not items:
        return {"error": "Cannot create an empty order."}

    total = 0.0
    # Step 1: Verify all products and sufficient stock
    for it in items:
        p_rows = q("SELECT * FROM products WHERE id=?", (it["product_id"],))
        if not p_rows:
            return {"error": f"Product with ID {it['product_id']} not found."}
        p = p_rows[0]
        if p["stock"] < it["qty"]:
            return {"error": f"Insufficient stock for '{p['name']}'. Requested: {it['qty']}, In Stock: {p['stock']}"}
        total += p["sell_price"] * it["qty"]

    # Step 2: Insert order
    oid = run(
        "INSERT INTO orders(customer_id, source, total, payment_status, fulfillment_status) VALUES(?, ?, ?, ?, ?)",
        (customer_id, "whatsapp", total, "unpaid", "new")
    )

    # Step 3: Insert items and decrement stock
    for it in items:
        p = q("SELECT * FROM products WHERE id=?", (it["product_id"],))[0]
        run(
            "INSERT INTO order_items(order_id, product_id, qty, unit_price) VALUES(?, ?, ?, ?)",
            (oid, p["id"], it["qty"], p["sell_price"])
        )
        run("UPDATE products SET stock = stock - ? WHERE id = ?", (it["qty"], p["id"]))

    audit("system", "create_order", f"Order #{oid} total: ${total:.2f}")
    return {"order_id": oid, "total": total, "status": "unpaid"}

def request_payment_link(order_id: int) -> dict:
    """
    CRITICAL SAFETY LAYER:
    Does NOT move money or call PayPal directly.
    Instead, generates a pending action that requires the store owner's human approval.
    """
    order = q("SELECT * FROM orders WHERE id=?", (order_id,))
    if not order:
        return {"error": f"Order #{order_id} does not exist."}

    # Check if a pending action for this order already exists
    existing = q(
        "SELECT id FROM pending_actions WHERE action='create_paypal_checkout' AND status='pending' AND args LIKE ?",
        (f'%\"order_id\": {order_id}%',)
    )
    if existing:
        return {"status": "already_pending_approval", "action_id": existing[0]["id"]}

    aid = run(
        "INSERT INTO pending_actions (action, args, status) VALUES (?, ?, ?)",
        ("create_paypal_checkout", json.dumps({"order_id": order_id}), "pending")
    )
    audit("ai_agent", "queued_payment_approval", f"Action #{aid} for Order #{order_id}")
    return {"status": "waiting_for_owner_approval", "action_id": aid, "order_id": order_id}

# Whitelist registry of functions the AI agent is allowed to invoke
TOOLS = {
    "get_unpaid_orders": get_unpaid_orders,
    "get_low_stock": get_low_stock,
    "get_sales_today": get_sales_today,
    "find_customer": find_customer,
    "get_product_stock": get_product_stock,
    "create_order": create_order,
    "request_payment_link": request_payment_link
}

def execute_approved(action_id: int) -> dict:
    """
    Executed ONLY by the shop owner from the UI dashboard.
    Fulfills the approved action (e.g. generating the PayPal checkout link).
    """
    a = q("SELECT * FROM pending_actions WHERE id=? AND status='pending'", (action_id,))
    if not a:
        return {"error": "Pending action not found or already processed."}
    
    action_data = a[0]
    args = json.loads(action_data["args"])
    
    if action_data["action"] == "create_paypal_checkout":
        result = paypal.create_checkout(args["order_id"])
    else:
        return {"error": f"Unsupported action '{action_data['action']}'"}

    run("UPDATE pending_actions SET status='approved' WHERE id=?", (action_id,))
    audit("owner", "approved_action", f"Action #{action_id}: {action_data['action']}")
    return result
