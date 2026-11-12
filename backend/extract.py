import json
import os
import ollama
from db import q

from dotenv import load_dotenv

load_dotenv()

def get_preferred_model() -> str:
    """Returns the configured Ollama model or auto-detects an installed model."""
    configured = os.getenv("OLLAMA_MODEL")
    if configured:
        return configured
    try:
        models_info = ollama.list()
        models = getattr(models_info, "models", [])
        available_names = []
        for m in models:
            m_name = getattr(m, "model", "")
            if m_name:
                available_names.append(m_name)

        # Priority search
        for candidate in ["llama3.1", "qwen2.5", "llama3.2", "llama3"]:
            for name in available_names:
                if candidate in name:
                    return name
    except Exception:
        pass
    return "llama3.2:1b"

def extract_order(message: str) -> dict:
    """
    Parses a raw WhatsApp/chat message into a structured order.
    Validates item matches against real database product records.
    """
    products = q("SELECT id, name, sell_price, stock FROM products")
    catalog_names = [p["name"] for p in products]

    prompt = f"""Extract an order from this message.
Return ONLY a valid JSON object matching this schema:
{{
  "customer_name": "string or null",
  "phone": "string or null",
  "items": [{{"product": "product name from catalog", "qty": 1}}],
  "missing": ["list of missing details like address, unclear quantity, etc."]
}}

Available store product catalog:
{json.dumps(catalog_names, indent=2)}

Match product names to this catalog where possible.
If something needed is unclear, list it in "missing".

Message:
"{message}"
"""

    model = get_preferred_model()
    try:
        res = ollama.chat(
            model=model,
            format="json",
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.1}
        )
        content = res.message.content
        data = json.loads(content)
    except Exception as e:
        # Fallback heuristic if Ollama call encounters an issue
        data = {
            "customer_name": None,
            "phone": None,
            "items": [],
            "missing": [f"Extraction notice: {str(e)}"],
            "raw_response": str(e)
        }

    # Validate extracted items against real database products
    valid_items = []
    unknown_products = []

    for it in data.get("items", []):
        prod_name = (it.get("product") or "").strip()
        qty = int(it.get("qty") or 1)
        
        # 1. Exact case-insensitive match
        matched_row = q("SELECT * FROM products WHERE lower(name) = lower(?)", (prod_name,))
        
        # 2. Substring fallback match
        if not matched_row:
            matched_row = q("SELECT * FROM products WHERE lower(name) LIKE lower(?)", (f"%{prod_name}%",))
            
        if matched_row:
            p = matched_row[0]
            valid_items.append({
                "product_id": p["id"],
                "product_name": p["name"],
                "qty": qty,
                "unit_price": p["sell_price"],
                "in_stock": p["stock"],
                "sufficient_stock": p["stock"] >= qty,
                "line_total": p["sell_price"] * qty
            })
        else:
            unknown_products.append(prod_name)

    # Customer match check
    customer_id = None
    if data.get("customer_name"):
        c_match = q("SELECT id FROM customers WHERE lower(name) LIKE lower(?)", (f"%{data['customer_name']}%",))
        if c_match:
            customer_id = c_match[0]["id"]

    return {
        "customer_name": data.get("customer_name"),
        "customer_id": customer_id,
        "phone": data.get("phone"),
        "items": valid_items,
        "unknown_products": unknown_products,
        "missing": data.get("missing", []),
        "estimated_total": sum(it["line_total"] for it in valid_items)
    }
