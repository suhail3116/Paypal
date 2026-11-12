import React, { useState, useEffect } from 'react';
import {
  Shop,
  Product,
  Category,
  Customer,
  Order,
  Invoice,
  Payment,
  PaymentReminder
} from './types';
import * as api from './api';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { InventoryView } from './views/InventoryView';
import { CustomersView } from './views/CustomersView';
import { OrdersView } from './views/OrdersView';
import { POSBillingView } from './views/POSBillingView';
import { InvoicesView } from './views/InvoicesView';
import { PaymentsView } from './views/PaymentsView';
import { WhatsAppView } from './views/WhatsAppView';
import { AIAssistantView } from './views/AIAssistantView';
import { AIRecoveryView } from './views/AIRecoveryView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { OnlineStorefrontView } from './views/OnlineStorefrontView';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isStorefrontOpen, setIsStorefrontOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Core Data
  const [shop, setShop] = useState<Shop | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [dailyPlan, setDailyPlan] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // Load all store data
  const loadData = async () => {
    try {
      setRefreshing(true);
      const [
        shopRes,
        dashRes,
        prodRes,
        custRes,
        ordersRes,
        invRes,
        payRes,
        remRes
      ] = await Promise.all([
        api.getShopProfile(),
        api.getDashboard(),
        api.getProducts(),
        api.getCustomers(),
        api.getOrders(),
        api.getInvoices(),
        api.getPayments(),
        api.getRecoveryReminders()
      ]);

      setShop(shopRes.shop);
      setDashboardData(dashRes);
      setProducts(prodRes.products);
      setCategories(prodRes.categories);
      setCustomers(custRes.customers);
      setOrders(ordersRes.orders);
      setInvoices(invRes.invoices);
      setPayments(payRes.payments);
      setReminders(remRes.reminders);
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await api.getDailyPlan();
      setDailyPlan(res.plan);
      setCurrentTab('dashboard');
      if (isStorefrontOpen) setIsStorefrontOpen(false);
    } catch (e: any) {
      alert(e.message || 'Error generating daily briefing');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const pendingRemindersCount = reminders.filter((r) => r.status === 'pending_approval').length;
  const unpaidOrders = orders.filter((o) => o.payment_status === 'unpaid');

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-100 overflow-hidden font-sans">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsStorefrontOpen(false);
        }}
        isStorefrontOpen={isStorefrontOpen}
        onToggleStorefront={() => setIsStorefrontOpen(!isStorefrontOpen)}
        pendingRemindersCount={pendingRemindersCount}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER BAR */}
        <Header
          shop={shop}
          onRefresh={loadData}
          isRefreshing={refreshing}
          onGeneratePlan={handleGeneratePlan}
          isGeneratingPlan={generatingPlan}
          isOffline={isOffline}
          onToggleOffline={() => setIsOffline(!isOffline)}
        />

        {/* ACTIVE VIEW ROUTER */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
          {isStorefrontOpen ? (
            <OnlineStorefrontView
              products={products}
              categories={categories}
              shopName={shop?.name || 'Apex Mart & Grocers'}
              onRefreshData={loadData}
              currency={shop?.currency || 'USD'}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  data={dashboardData}
                  dailyPlan={dailyPlan}
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                  currency={shop?.currency || 'USD'}
                />
              )}

              {currentTab === 'products' && (
                <ProductsView
                  products={products}
                  categories={categories}
                  onRefreshData={loadData}
                  currency={shop?.currency || 'USD'}
                />
              )}

              {currentTab === 'inventory' && (
                <InventoryView
                  products={products}
                  onRefreshData={loadData}
                  currency={shop?.currency || 'USD'}
                />
              )}

              {currentTab === 'customers' && (
                <CustomersView
                  customers={customers}
                  onRefreshData={loadData}
                  currency={shop?.currency || 'USD'}
                />
              )}

              {currentTab === 'orders' && (
                <OrdersView
                  orders={orders}
                  onRefreshData={loadData}
                  currency={shop?.currency || 'USD'}
                />
              )}

              {currentTab === 'pos' && (
                <POSBillingView
                  products={products}
                  customers={customers}
                  isOffline={isOffline}
                  onRefreshData={loadData}
                  currency={shop?.currency || 'USD'}
                />
              )}

              {currentTab === 'invoices' && (
                <InvoicesView
                  invoices={invoices}
                  shopName={shop?.name || 'Apex Mart & Grocers'}
                  taxRegNumber={shop?.tax_registration_number || 'TAX-98765432'}
                  currency={shop?.currency || 'USD'}
                />
              )}

              {currentTab === 'payments' && (
                <PaymentsView
                  payments={payments}
                  mode={shop?.paypal_mode || 'sandbox'}
                  hasCredentials={Boolean(shop?.paypal_client_id)}
                  onRefreshData={loadData}
                  currency={shop?.currency || 'USD'}
                />
              )}

              {currentTab === 'whatsapp' && (
                <WhatsAppView
                  onRefreshData={loadData}
                  currency={shop?.currency || 'USD'}
                />
              )}

              {currentTab === 'assistant' && (
                <AIAssistantView
                  onRefreshData={loadData}
                  currency={shop?.currency || 'USD'}
                />
              )}

              {currentTab === 'recovery' && (
                <AIRecoveryView
                  unpaidOrders={unpaidOrders}
                  onRefreshData={loadData}
                  currency={shop?.currency || 'USD'}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsView
                  orders={orders}
                  products={products}
                  customers={customers}
                  currency={shop?.currency || 'USD'}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  shop={shop}
                  onRefreshData={loadData}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
