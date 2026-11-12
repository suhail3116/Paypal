import json
import ollama
from tools import get_unpaid_orders, get_low_stock, get_sales_today, request_payment_link
from extract import get_preferred_model

def daily_plan() -> dict:
    """
    Gathers store metrics deterministically via SQL, then prompts the LLM
    to generate an actionable, prioritized morning briefing for the shop owner.
    """
    facts = {
        "unpaid_orders": get_unpaid_orders(),
        "low_stock": get_low_stock(),
        "sales_today": get_sales_today()
    }

    prompt = f"""You are ShopPilot, an experienced retail business manager.
Analyze the following store data and write a concise morning action plan with at most 5 numbered, prioritized tasks.
Be specific with customer names, product names, item quantities, and dollar amounts.
Data:
{json.dumps(facts, indent=2, default=str)}

Format with clean Markdown bullet points. Focus on:
1. Collecting pending revenue (unpaid orders)
2. Restocking critical inventory shortages
3. Today's fulfillment priorities
"""

    model = get_preferred_model()
    try:
        res = ollama.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}]
        )
        plan_text = res.message.content
    except Exception as e:
        plan_text = (
            f"**Morning Action Plan (System Generated Summary)**\n\n"
            f"- **Unpaid Orders Pending Collection**: {len(facts['unpaid_orders'])} orders requiring follow-up.\n"
            f"- **Low Stock Alerts**: {len(facts['low_stock'])} items near or below reorder levels.\n"
            f"- **Today's Revenue Recorded**: ${facts['sales_today'].get('revenue', 0):.2f}\n"
            f"*(Notice: AI model briefing generation error: {str(e)})*"
        )

    return {
        "facts": facts,
        "plan": plan_text
    }

def propose_collections() -> list:
    """
    One-click action: Proposes PayPal checkout approval links for every unpaid order.
    Pushes each into the pending_actions queue for merchant review.
    """
    unpaid = get_unpaid_orders()
    results = [request_payment_link(o["id"]) for o in unpaid]
    return results
