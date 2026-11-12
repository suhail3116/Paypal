import os
import requests
from dotenv import load_dotenv
from db import q, run, audit

load_dotenv()

BASE = os.getenv("PAYPAL_BASE", "https://api-m.sandbox.paypal.com")
CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "mock_client_id")
SECRET = os.getenv("PAYPAL_SECRET", "mock_secret")
APP_URL = os.getenv("APP_URL", "http://localhost:8000")

def is_mock_mode() -> bool:
    """Returns True if user has not yet supplied valid PayPal credentials."""
    return not CLIENT_ID or CLIENT_ID.startswith("mock_") or CLIENT_ID == "your_sandbox_client_id"

def get_token() -> str:
    """Retrieves PayPal OAuth2 access token for Sandbox API calls."""
    if is_mock_mode():
        return "mock_access_token"
    
    r = requests.post(
        f"{BASE}/v1/oauth2/token",
        auth=(CLIENT_ID, SECRET),
        data={"grant_type": "client_credentials"},
        timeout=10
    )
    r.raise_for_status()
    return r.json()["access_token"]

def create_checkout(order_id: int) -> dict:
    """
    Creates a PayPal order in Sandbox and returns the approval link.
    Records pending payment in the database.
    """
    order_rows = q("SELECT * FROM orders WHERE id=?", (order_id,))
    if not order_rows:
        return {"error": f"Order #{order_id} not found"}
    order = order_rows[0]

    amount_val = f"{order['total']:.2f}"

    if is_mock_mode():
        # Demo simulation mode when actual API keys aren't added yet
        simulated_paypal_id = f"PAYPAL-SANDBOX-{order_id}-DEMO"
        checkout_url = f"{APP_URL}/paypal/return?token={simulated_paypal_id}"
        run(
            "INSERT INTO payments(order_id, amount, method, paypal_order_id, status) VALUES (?, ?, ?, ?, ?)",
            (order_id, order["total"], "paypal", simulated_paypal_id, "created")
        )
        audit("paypal_sandbox", "checkout_created_demo", simulated_paypal_id)
        return {
            "checkout_url": checkout_url,
            "paypal_order_id": simulated_paypal_id,
            "note": "Running in Demo Mode. To use live sandbox, set PAYPAL_CLIENT_ID & PAYPAL_SECRET in backend/.env"
        }

    token = get_token()
    body = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "reference_id": str(order_id),
            "amount": {
                "currency_code": "USD",
                "value": amount_val
            }
        }],
        "payment_source": {
            "paypal": {
                "experience_context": {
                    "return_url": f"{APP_URL}/paypal/return",
                    "cancel_url": f"{APP_URL}/paypal/cancel"
                }
            }
        }
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    r = requests.post(f"{BASE}/v2/checkout/orders", json=body, headers=headers, timeout=12)
    r.raise_for_status()
    data = r.json()

    approve_link = next(
        (l["href"] for l in data.get("links", []) if l.get("rel") in ("payer-action", "approve")),
        None
    )

    paypal_order_id = data["id"]

    run(
        "INSERT INTO payments(order_id, amount, method, paypal_order_id, status) VALUES (?, ?, ?, ?, ?)",
        (order_id, order["total"], "paypal", paypal_order_id, "created")
    )
    audit("paypal", "checkout_created", paypal_order_id)

    return {
        "checkout_url": approve_link or f"{APP_URL}/paypal/return?token={paypal_order_id}",
        "paypal_order_id": paypal_order_id
    }

def capture(paypal_order_id: str) -> bool:
    """
    Captures the PayPal transaction after payer approval.
    Verifies state and updates order and payment status in database.
    """
    pay_rows = q("SELECT * FROM payments WHERE paypal_order_id=?", (paypal_order_id,))
    if not pay_rows:
        return False
    pay = pay_rows[0]

    if is_mock_mode():
        # Demo simulation capture
        run("UPDATE payments SET status='completed' WHERE id=?", (pay["id"],))
        run("UPDATE orders SET payment_status='paid' WHERE id=?", (pay["order_id"],))
        audit("paypal_sandbox", "payment_verified_demo", paypal_order_id)
        return True

    token = get_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    r = requests.post(f"{BASE}/v2/checkout/orders/{paypal_order_id}/capture", headers=headers, timeout=12)
    data = r.json()

    if r.status_code in (200, 201) and data.get("status") == "COMPLETED":
        run("UPDATE payments SET status='completed' WHERE id=?", (pay["id"],))
        run("UPDATE orders SET payment_status='paid' WHERE id=?", (pay["order_id"],))
        audit("paypal", "payment_verified", paypal_order_id)
        return True

    run("UPDATE payments SET status='failed' WHERE id=?", (pay["id"],))
    audit("paypal", "payment_failed", paypal_order_id)
    return False
