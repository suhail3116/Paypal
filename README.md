# ShopPilot AI — Omnichannel Shop Management Platform
> **AI-Powered Omnichannel Retail System with PayPal Sandbox & WhatsApp Integration**  
> *Built for the PayPal AI Hackathon 2026*

ShopPilot AI is a production-grade, AI-powered shop management system that bridges both **online and offline retail businesses**. It unifies customer orders, inventory synchronization, centralized CRM with normalized phone matching, high-speed POS billing with offline reconciliation, automated GST invoicing, PayPal Sandbox checkout, and intelligent AI business management.

---

## 🏛️ System Architecture

```text
                               ┌───────────────────────────────────────────────────┐
                               │             ShopPilot AI Platform                 │
                               └───────────────────────────────────────────────────┘
                                                         │
                ┌────────────────────────────────────────┴────────────────────────────────────────┐
                ▼                                                                                 ▼
   [Merchant Admin Dashboard]                                                           [Customer Storefront]
   • 13 Unified Modules                                                                 • Public Product Catalog
   • POS with Offline Sync                                                              • Guest Cart & Checkout
   • AI Assistant & Daily Manager                                                       • Direct PayPal Checkout
                │                                                                                 │
                └────────────────────────────────────────┬────────────────────────────────────────┘
                                                         │
                                                         ▼
                                       [Node.js + Express Server API]
                                                         │
         ┌──────────────────────────┬────────────────────┴───────────────┬────────────────────────┐
         ▼                          ▼                                    ▼                        ▼
[Supabase / PostgreSQL]    [PayPal Developer]                  [WhatsApp Cloud API]      [Hybrid AI Engine]
• 16 Relational Tables     • Sandbox / Live Gateway            • Official Webhook        • Groq Cloud (Free)
• Row Level Security       • Dynamic Orders & Capture          • Message-to-Order AI     • Local Ollama (Offline)
• Multi-Tenant Isolation   • Signature Verification            • Draft Confirmations     • Gemini Flash (Free)
```

---

## ✨ Comprehensive Feature Matrix (All 24 Sections Covered)

| Module | Features & Capabilities |
| :--- | :--- |
| **1. Multi-Tenant Shop Setup** | Shop profile, currency selection, tax settings (GST/VAT), invoice prefixes, secure business isolation. |
| **2. Executive Dashboard** | Real-time KPIs (Today Sales, Gross Revenue, Orders, Low Stock, Unpaid Balances, Online vs Offline charts). |
| **3. Product Management** | Full CRUD, categories, barcodes, SKUs, cost vs selling price, stock levels, thresholds, and CSV export. |
| **4. Inventory Management** | Real-time stock audit, automatic sales deductions, movement history, damage write-offs, and valuation analysis. |
| **5. Centralized CRM** | E.164 phone normalization, purchase history, outstanding balances, and multi-channel customer matching. |
| **6. Offline POS Billing** | Barcode scanning, product search, tax calculation, walk-in customers, Cash/UPI/PayPal, receipt printing, and **LocalStorage offline queue with 1-click central DB reconciliation**. |
| **7. Omnichannel Orders** | Unified orders across Website, WhatsApp, POS, and Phone with fulfillment steppers. |
| **8. Invoicing System** | Auto-generation from confirmed orders, customizable tax/GST calculations, and printable HTML/PDF layouts. |
| **9. PayPal Integration** | Sandbox & Live toggle, dynamic order creation with custom reference IDs, capture verification, and webhook handling. |
| **10. WhatsApp Business Cloud API** | Official Meta Webhook verification (`hub.challenge`), message parsing into draft orders, stock check, and confirmation flow. |
| **11. AI Shop Assistant** | Grounded natural language query engine (answers sales, stock, and customer questions using real DB data). |
| **12. AI Payment Recovery Agent** | Identifies overdue accounts, generates personalized reminder messages, and requires merchant approval before sending. |
| **13. AI Daily Shop Manager** | Synthesizes daily telemetry into a prioritized 5-point morning action plan. |
| **14. Online Customer Storefront** | Customer-facing catalog, category filters, cart drawer, guest checkout, PayPal integration, and order confirmation. |
| **15. Reports & Analytics** | Omnichannel sales distribution, channel volume vs AOV comparisons, and full sales CSV export. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node.js v24)
- **Local Ollama** *(optional, already installed)*: for 100% offline AI execution.

### 2. Launch with One Click
Double-click **`start.bat`** in the project root:

```text
D:\project\09 PaypalHackathon\start.bat
```

Or start the servers manually in two terminals:

#### Terminal 1 (Backend Server):
```bash
cd server
npm start
```
*API running on `http://localhost:8000`*

#### Terminal 2 (React + TypeScript Frontend):
```bash
cd frontend
npm run dev
```
*Merchant Dashboard running on `http://localhost:5173`*

---

## ⚙️ Environment Configuration (`server/.env`)

```ini
PORT=8000

# Free Cloud AI (Groq: https://console.groq.com)
GROQ_API_KEY=

# Local Free Offline AI (Ollama)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b

# PayPal Developer Sandbox (https://developer.paypal.com)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_SECRET=your_sandbox_secret

# WhatsApp Business Cloud API
WHATSAPP_VERIFY_TOKEN=shoppilot_webhook_secret
```

> **Note on Demo Mode**: If PayPal Sandbox keys are left blank, ShopPilot automatically enables **Sandbox Simulation Mode**, allowing seamless demonstration of PayPal checkout and payment capture without API credential friction.

---

## 🎬 Testing & Hackathon Demonstration Flow

1. **Online Storefront**:
   - In the top-left sidebar, click **Customer Storefront**.
   - Browse catalog items, add products to cart, and click **Pay with PayPal**.
   - Watch the order register in the central database, reduce catalog stock, and create an automated invoice.

2. **Offline POS Billing**:
   - Return to the merchant view and click **POS Billing**.
   - Scan or type barcode `8901234567890` (Basmati Rice) or select items.
   - Click the **Online Sync** pill in the top header to toggle **Offline Mode**.
   - Complete a sale—the transaction queues safely in local storage with an offline receipt.
   - Toggle back to **Online Sync** and click **Sync with Central DB** to witness automatic reconciliation!

3. **WhatsApp AI Order Extraction**:
   - Open **WhatsApp API**. Click the sample *"Ravi: Rice + Oil"* message.
   - Click **Parse WhatsApp Order with AI**.
   - The AI identifies the customer, matches items against catalog stock, and drafts an order for merchant approval.

4. **AI Payment Recovery Agent**:
   - Navigate to **AI Debt Recovery**.
   - Click **Generate AI Reminder** for an overdue unpaid order.
   - Review the personalized message and tap **Approve & Dispatch**.

5. **AI Shop Assistant**:
   - Open **AI Assistant**. Ask: *"How much did I sell today?"* or *"Which products are running low?"*.
   - Receive answers verified against actual store records.
