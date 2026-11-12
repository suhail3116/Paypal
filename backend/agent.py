import json
import os
import ollama
from tools import TOOLS
from extract import get_preferred_model

SYSTEM_PROMPT = """You are ShopPilot, an intelligent, trustworthy AI assistant for a retail store owner.
- You have direct access to tools for querying live store data (unpaid orders, inventory levels, sales metrics, customer records).
- ALWAYS use tools to check real data. Never invent or hallucinate numbers, prices, or orders.
- SECURITY & SAFETY RULE: You cannot directly move money or alter financial transactions. To collect payment, call `request_payment_link`. This queues a pending approval for the human owner to review.
- Keep responses concise, clear, and business-focused."""

def chat(history: list, user_msg: str, max_steps: int = 6) -> str:
    """
    Executes a multi-turn tool-calling loop using Ollama.
    Executes whitelisted tools dynamically and passes observations back to the LLM.
    """
    history.append({"role": "user", "content": user_msg})
    msgs = [{"role": "system", "content": SYSTEM_PROMPT}] + history

    model = get_preferred_model()
    
    # Prepare function list for Ollama
    tool_funcs = list(TOOLS.values())

    for _ in range(max_steps):
        try:
            res = ollama.chat(
                model=model,
                messages=msgs,
                tools=tool_funcs
            )
        except Exception as e:
            # If tool-calling isn't supported by the model or failed
            err_msg = f"AI Assistant encountered an issue with model '{model}': {str(e)}"
            return err_msg

        msg = res.message
        msgs.append(msg)

        # Check if the model decided to call tools
        if not getattr(msg, "tool_calls", None):
            final_content = msg.content or "Done."
            history.append({"role": "assistant", "content": final_content})
            return final_content

        for call in msg.tool_calls:
            fn_name = call.function.name
            raw_args = call.function.arguments
            
            # Ensure args is a dict
            if isinstance(raw_args, str):
                try:
                    args = json.loads(raw_args)
                except Exception:
                    args = {}
            else:
                args = raw_args or {}

            fn = TOOLS.get(fn_name)
            if fn:
                try:
                    tool_output = fn(**args)
                except Exception as ex:
                    tool_output = {"error": f"Execution error in {fn_name}: {str(ex)}"}
            else:
                tool_output = {"error": f"Unauthorized or unknown tool: {fn_name}"}

            msgs.append({
                "role": "tool",
                "tool_name": fn_name,
                "content": json.dumps(tool_output, default=str)
            })

    return "I was unable to complete the request within the allowed reasoning steps."
