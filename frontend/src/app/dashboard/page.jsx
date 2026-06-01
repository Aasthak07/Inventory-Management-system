"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Parallel Axios fetches
      const [productsData, customersData, ordersData] = await Promise.all([
        api.getProducts(),
        api.getCustomers(),
        api.getOrders(),
      ]);

      setProducts(productsData);
      setCustomers(customersData);
      setOrders(ordersData);
    } catch (err) {
      console.error(err);
      setError("Could not connect to the database API service. Please verify that the FastAPI server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute operational metrics
  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, ord) => sum + Number(ord.total_amount), 0);

  // Identify low-stock items (stock_quantity < 5)
  const lowStockProducts = products.filter((p) => p.stock_quantity < 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Overview of products, stock levels, and order history</p>
        </div>
        <div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <span className={`text-xs inline-block leading-none select-none ${loading ? "animate-spin" : ""}`}>🔄</span>
            <span>Sync Latest</span>
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-700 shadow-sm transition-all animate-pulse-subtle">
          <p className="font-bold text-sm">Failed to connect to server</p>
          <p className="text-xs text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* SKUs */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-5">
          <div className="bg-slate-100 p-3 flex items-center justify-center rounded-xl w-12 h-12">
            <span className="text-xl select-none leading-none">📦</span>
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products</span>
            <span className="block text-2xl font-extrabold text-slate-900 mt-0.5">
              {loading ? <span className="text-slate-300">...</span> : totalProducts}
            </span>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-5">
          <div className="bg-slate-100 p-3 flex items-center justify-center rounded-xl w-12 h-12">
            <span className="text-xl select-none leading-none">👥</span>
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Customers</span>
            <span className="block text-2xl font-extrabold text-slate-900 mt-0.5">
              {loading ? <span className="text-slate-300">...</span> : totalCustomers}
            </span>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-5">
          <div className="bg-slate-100 p-3 flex items-center justify-center rounded-xl w-12 h-12">
            <span className="text-xl select-none leading-none">🧾</span>
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <span className="block text-2xl font-extrabold text-slate-900 mt-0.5">
              {loading ? <span className="text-slate-300">...</span> : totalOrders}
            </span>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-5">
          <div className="bg-slate-100 p-3 flex items-center justify-center rounded-xl w-12 h-12">
            <span className="text-xl select-none leading-none">💰</span>
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <span className="block text-2xl font-extrabold text-slate-900 mt-0.5">
              {loading ? (
                <span className="text-slate-300">...</span>
              ) : (
                `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {!loading && lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm text-amber-900 animate-slide-up">
          <span className="text-lg flex-shrink-0 select-none leading-none">⚠️</span>
          <div className="text-sm font-medium leading-normal">
            <span>Warning:</span> You have <strong className="font-bold">{lowStockProducts.length}</strong> product(s) with low stock levels (below 5 units).
            <Link
              href="/products"
              className="ml-2 font-semibold text-slate-900 underline hover:text-blue-600 transition-colors"
            >
              Restock now
            </Link>
          </div>
        </div>
      )}

      {/* Main Panels Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            <Link href="/orders" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
              <span>Go to Orders</span>
              <span className="text-xs font-bold leading-none select-none">➜</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm font-semibold">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <p className="font-semibold text-slate-500">No orders recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1">Go to the Order Desk to create your first order.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="text-slate-400 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">
                    <th className="pb-3 pr-4">Order ID</th>
                    <th className="pb-3 pr-4">Customer Name</th>
                    <th className="pb-3 pr-4">Date Placed</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pr-4 font-bold text-slate-900">#ORD-{order.id}</td>
                      <td className="py-3.5 pr-4 text-slate-600 font-medium">{order.customer?.name || "Unknown Customer"}</td>
                      <td className="py-3.5 pr-4 text-slate-500">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-slate-900">
                        ${Number(order.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Watchlist */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Stock Watchlist</h2>
            <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {lowStockProducts.length} Items
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm font-semibold">Loading watchlist...</div>
          ) : lowStockProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <div className="text-emerald-500 text-2xl font-bold mb-1">✓</div>
              <p className="font-semibold text-slate-800">All stock levels healthy</p>
              <p className="text-xs text-slate-400 mt-1">No products are currently under 5 units.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map((prod) => (
                <div
                  key={prod.id}
                  className="flex justify-between items-center p-3 border border-slate-100 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <p className="font-bold text-sm text-slate-900 truncate">{prod.name}</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5 block truncate">SKU: {prod.sku}</span>
                  </div>
                  <span
                    className={`inline-flex items-center justify-center font-bold text-xs px-2.5 py-1 rounded-full ${
                      prod.stock_quantity === 0
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {prod.stock_quantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
