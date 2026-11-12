import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

from db import q, run, audit
from agent import chat
from extract import extract_order
from manager import daily_plan, propose_collections
from tools import get_unpaid_orders, get_low_stock, get_sales_today, execute_approved, create_order
import paypal

app = FastAPI(
    title="ShopPilot AI Backend",
    description="Agentic Commerce & AI Shop Manager with PayPal Sandbox Integration",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session history for demo agent
HISTORY = []

class ChatRequest(BaseModel):
    message: str

class ExtractRequest(BaseModel):
    message: str

class OrderItem(BaseModel):
    product_id: int
    qty: int

class ConfirmOrderRequest(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    items: List[OrderItem]

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "ShopPilot AI",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.post("/api/chat")
def api_chat(req: ChatRequest):
    reply = chat(HISTORY, req.message)
    return {"reply": reply}

@app.post("/api/chat/reset")
def api_chat_reset():
    global HISTORY
    HISTORY = []
    return {"status": "chat_history_cleared"}

@app.post("/api/extract")
def api_extract(req: ExtractRequest):
    """Turns unstructured WhatsApp/chat text into a verified product order proposal."""
    return extract_order(req.message)

@app.post("/api/orders/confirm")
def api_confirm_order(req: ConfirmOrderRequest):
    """Creates a formal order once the merchant confirms the extracted WhatsApp data."""
    cust_id = req.customer_id
    if not cust_id:
        # Create new customer if not found
        name = req.customer_name or "WhatsApp Shopper"
        phone = req.phone or ""
        existing = q("SELECT id FROM customers WHERE phone = ? AND phone != ''", (phone,))
        if existing:
            cust_id = existing[0]["id"]
        else:
            cust_id = run("INSERT INTO customers (name, phone) VALUES (?, ?)", (name, phone))

    items_data = [{"product_id": it.product_id, "qty": it.qty} for it in req.items]
    res = create_order(cust_id, items_data)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@app.get("/api/dashboard")
def api_dashboard():
    """Aggregates all core KPIs and lists for the merchant dashboard."""
    all_orders = q('''
        SELECT o.id, c.name as customer_name, o.source, o.total, o.payment_status, 
               o.fulfillment_status, o.created_at
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        ORDER BY o.id DESC
    ''')
    
    return {
        "sales": get_sales_today(),
        "unpaid": get_unpaid_orders(),
        "low_stock": get_low_stock(),
        "recent_orders": all_orders[:15],
        "products_count": q("SELECT COUNT(*) as count FROM products")[0]["count"],
        "customers_count": q("SELECT COUNT(*) as count FROM customers")[0]["count"]
    }

@app.get("/api/products")
def api_products():
    return q("SELECT * FROM products ORDER BY name ASC")

@app.get("/api/customers")
def api_customers():
    return q("SELECT * FROM customers ORDER BY name ASC")

@app.get("/api/approvals")
def api_approvals():
    """Returns all queued pending actions awaiting owner authorization."""
    return q('''
        SELECT id, action, args, status, created_at 
        FROM pending_actions 
        ORDER BY id DESC
    ''')

@app.post("/api/approvals/{aid}/approve")
def api_approve(aid: int):
    """Executes the approved financial action (generates PayPal Sandbox checkout)."""
    return execute_approved(aid)

@app.post("/api/approvals/{aid}/reject")
def api_reject(aid: int):
    """Rejects the action without altering state."""
    run("UPDATE pending_actions SET status='rejected' WHERE id=?", (aid,))
    audit("owner", "rejected_action", f"Action #{aid}")
    return {"ok": True, "status": "rejected"}

@app.get("/api/daily-plan")
def api_daily_plan():
    """Daily Shop Manager AI plan."""
    return daily_plan()

@app.post("/api/propose-collections")
def api_propose_collections():
    """One-click queueing of PayPal checkout links for all unpaid orders."""
    return {"results": propose_collections()}

@app.get("/api/audit-logs")
def api_audit_logs():
    """Returns the immutable system audit trail."""
    return q("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 30")

# PayPal Redirect Endpoints
@app.get("/paypal/return")
def paypal_return(token: str):
    """
    Called when buyer approves the PayPal checkout.
    Verifies payment capture and marks order Paid.
    """
    ok = paypal.capture(token)
    return {
        "status": "success" if ok else "failed",
        "message": "Payment confirmed and verified with PayPal Sandbox!" if ok else "Payment capture failed.",
        "paypal_order_id": token
    }

@app.get("/paypal/cancel")
def paypal_cancel():
    return {"status": "cancelled", "message": "Payment was cancelled by the buyer."}
