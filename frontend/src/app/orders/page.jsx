"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Accordion state to expand/collapse order details
  const [expandedOrders, setExpandedOrders] = useState({});

  // Wizard form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [orderLines, setOrderLines] = useState([{ product_id: "", quantity: 1 }]);

  // UX states
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordData, prodData, custData] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getCustomers(),
      ]);

      setOrders(ordData);
      setProducts(prodData);
      setCustomers(custData);
    } catch (err) {
      console.error(err);
      showToast("Failed to load orders.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const toggleExpandOrder = (id) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddLine = () => {
    setOrderLines([...orderLines, { product_id: "", quantity: 1 }]);
  };

  const handleRemoveLine = (index) => {
    if (orderLines.length === 1) return;
    setOrderLines(orderLines.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (index, field, value) => {
    const updatedLines = [...orderLines];
    if (field === "product_id") {
      updatedLines[index].product_id = value;
      updatedLines[index].quantity = 1; // Reset to 1 on product swap
    } else if (field === "quantity") {
      updatedLines[index].quantity = value;
    }
    setOrderLines(updatedLines);
  };

  const getSelectedProduct = (prodId) => {
    return products.find((p) => p.id === Number(prodId));
  };

  // Live order calculations
  const totalCost = orderLines.reduce((sum, line) => {
    const prod = getSelectedProduct(line.product_id);
    if (!prod) return sum;
    return sum + Number(prod.price) * line.quantity;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!customerId) {
      showToast("Please select a customer.", "error");
      setSubmitting(false);
      return;
    }

    const validLines = orderLines.filter((line) => line.product_id !== "");
    if (validLines.length === 0) {
      showToast("Please add at least one item.", "error");
      setSubmitting(false);
      return;
    }

    // Local client-side stock validation
    for (const line of validLines) {
      const prod = getSelectedProduct(line.product_id);
      if (prod && prod.stock_quantity < line.quantity) {
        showToast(
          `Insufficient stock: '${prod.name}' has only ${prod.stock_quantity} available, but you requested ${line.quantity}.`,
          "error"
        );
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      customer_id: Number(customerId),
      items: validLines.map((line) => ({
        product_id: Number(line.product_id),
        quantity: line.quantity,
      })),
    };

    try {
      await api.createOrder(payload);
      showToast("Order placed successfully!", "success");
      setIsModalOpen(false);
      setCustomerId("");
      setOrderLines([{ product_id: "", quantity: 1 }]);
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Failed to create order.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Orders</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Place new orders and view order history</p>
        </div>
        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <span className="text-xs font-bold leading-none select-none">➕</span>
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Orders list directory */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4">Order History</h2>

        {loading ? (
          <div className="py-12 flex items-center justify-center gap-3 text-slate-400 text-sm font-semibold">
            <span className="animate-spin text-base select-none leading-none">⏳</span>
            <span>Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <p className="font-semibold text-slate-500">No orders logged.</p>
            <p className="text-xs text-slate-400 mt-1">Create an order to get started.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {orders.map((order) => {
              const isExpanded = !!expandedOrders[order.id];
              return (
                <div
                  key={order.id}
                  className="border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition"
                >
                  {/* Order collapsed header */}
                  <div
                    onClick={() => toggleExpandOrder(order.id)}
                    className="p-4 bg-slate-50/50 hover:bg-slate-50 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                  >
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="font-bold text-slate-900">#ORD-{order.id}</span>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                          {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      <div className="border-l border-slate-200 pl-6">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer</span>
                        <span className="font-bold text-slate-700">{order.customer?.name || "Deleted Profile"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Total</span>
                        <span className="font-extrabold text-base text-slate-900">${Number(order.total_amount).toFixed(2)}</span>
                      </div>

                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {order.status}
                      </span>

                      <span className="text-xs select-none font-bold text-slate-400">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {/* Order items details sub-table */}
                  {isExpanded && (
                    <div className="p-5 bg-white border-t border-slate-100 animate-slide-up text-sm">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Items in Order ({order.items.length})
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs font-semibold">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-100">
                              <th className="pb-2">Product</th>
                              <th className="pb-2">Quantity</th>
                              <th className="pb-2">Price</th>
                              <th className="pb-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {order.items.map((item) => {
                              const prod = products.find((p) => p.id === item.product_id);
                              return (
                                <tr key={item.id} className="text-slate-700">
                                  <td className="py-2.5">
                                    <p className="font-bold text-slate-900">{prod?.name || `Product ID: ${item.product_id}`}</p>
                                    <span className="text-[9px] font-mono text-slate-400 uppercase">SKU: {prod?.sku || "-"}</span>
                                  </td>
                                  <td className="py-2.5 text-slate-500 font-bold">{item.quantity} units</td>
                                  <td className="py-2.5 text-slate-600">${Number(item.price).toFixed(2)}</td>
                                  <td className="py-2.5 text-right font-extrabold text-slate-900">
                                    ${(item.quantity * Number(item.price)).toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative animate-scale-in max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="text-lg select-none leading-none">🛒</span>
                <span>Create Order</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer flex items-center justify-center w-6 h-6"
              >
                <span className="text-sm font-bold select-none leading-none">✕</span>
              </button>
            </div>

            {/* Form Scroll Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 text-sm pr-2">
              {/* Select Customer */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Customer *</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-slate-400 transition"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Items */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Items</h4>
                  <span className="text-[10px] text-slate-400 font-bold">{orderLines.length} items listed</span>
                </div>

                <div className="space-y-4">
                  {orderLines.map((line, index) => {
                    const selectedProd = getSelectedProduct(line.product_id);
                    const isOutOfStock = selectedProd ? selectedProd.stock_quantity < line.quantity : false;

                    return (
                      <div key={index} className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl space-y-3 shadow-xs">
                        <div className="flex items-end gap-4">
                          {/* Product Select */}
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product</label>
                            <select
                              className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-semibold text-xs focus:outline-none focus:border-slate-400 transition"
                              value={line.product_id}
                              onChange={(e) => handleLineChange(index, "product_id", e.target.value)}
                              required
                            >
                              <option value="">-- Select Product --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                                  {p.name} (${Number(p.price).toFixed(2)}) - [{p.stock_quantity} in stock]
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity */}
                          <div className="w-24 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg px-3 py-2 font-semibold text-xs focus:outline-none focus:border-slate-400 transition"
                              value={line.quantity}
                              onChange={(e) => handleLineChange(index, "quantity", parseInt(e.target.value) || 1)}
                              disabled={!line.product_id}
                              required
                            />
                          </div>

                          {/* Row subtotal */}
                          <div className="w-24 text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subtotal</span>
                            <span className="font-extrabold text-sm text-slate-900 block py-1.5 pr-1">
                              {selectedProd
                                ? `$${(Number(selectedProd.price) * line.quantity).toFixed(2)}`
                                : "$0.00"}
                            </span>
                          </div>

                          {/* Delete row */}
                          <button
                            type="button"
                            className="p-2 border border-red-100 bg-white hover:bg-red-50 text-red-500 rounded-lg shadow-sm cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center w-7 h-7"
                            onClick={() => handleRemoveLine(index)}
                            disabled={orderLines.length === 1}
                          >
                            <span className="text-xs font-bold select-none leading-none">✕</span>
                          </button>
                        </div>

                        {/* Inventory validation notices */}
                        {selectedProd && (
                          <div className="text-[10px] font-semibold">
                            {isOutOfStock ? (
                              <span className="text-red-600 block">
                                ⚠ Insufficient stock! Only {selectedProd.stock_quantity} left.
                              </span>
                            ) : selectedProd.stock_quantity < 5 ? (
                              <span className="text-amber-600 block">
                                ⚠ Warning: Running low on stock ({selectedProd.stock_quantity} left).
                              </span>
                            ) : (
                              <span className="text-emerald-600 block">
                                ✓ Stock validation passed ({selectedProd.stock_quantity} available).
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add new line row */}
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                >
                  <span className="text-[10px] font-bold select-none leading-none">➕</span>
                  <span>Add Line Item</span>
                </button>
              </div>

              {/* Order total calculations summary card */}
              <div className="bg-slate-900 text-white rounded-xl p-4 flex justify-between items-center flex-shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Grand Total</span>
                <span className="text-xl font-black">${totalCost.toFixed(2)}</span>
              </div>

              {/* Action buttons footer */}
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4 mt-6 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-955 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || totalCost === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <span className="text-xs font-bold select-none leading-none">🛒</span>
                  <span>{submitting ? "Creating..." : "Submit Order"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating custom toast notifications */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] transition-all duration-300 animate-slide-in">
          <div
            className={`flex items-center gap-3 px-5 py-4 border rounded-2xl shadow-xl bg-white max-w-sm ${
              toast.type === "success"
                ? "border-emerald-200 text-emerald-900"
                : "border-red-200 text-red-900"
            }`}
          >
            <span className="text-base select-none leading-none">
              {toast.type === "success" ? "✅" : "❌"}
            </span>
            <span className="text-xs font-bold leading-normal">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
