"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // UX states
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomers(search.trim() || undefined);
      setCustomers(data);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Failed to load customers.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCustomers();
    }, 300); // Debounce search inputs

    return () => clearTimeout(handler);
  }, [search]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName("");
    setEmail("");
    setPhone("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!name.trim() || !email.trim()) {
      showToast("Please fill in Name and Email address.", "error");
      setSubmitting(false);
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
    };

    try {
      if (editingCustomer) {
        showToast("Note: Customer editing is disabled in this recruiter assignment submission.", "error");
      } else {
        const data = await api.createCustomer(payload);
        showToast(`Customer registered successfully!`, "success");
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Failed to register customer.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Customers</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your customer profiles and contact details</p>
        </div>
        <div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <span className="text-xs font-bold leading-none select-none">➕</span>
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter and Search actions */}
      <div className="relative w-full max-w-md">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base select-none leading-none">🔍</span>
        <input
          type="text"
          placeholder="Search by name or email..."
          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-10.5 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-slate-400 shadow-sm transition-all placeholder:text-slate-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Data Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {loading ? (
          <div className="py-12 flex items-center justify-center gap-3 text-slate-400 text-sm font-semibold">
            <span className="animate-spin text-base select-none leading-none">⏳</span>
            <span>Loading customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <p className="font-semibold text-slate-500">No customers found.</p>
            <p className="text-xs text-slate-400 mt-1">
              {search ? "No clients match your filter." : "Get started by adding a customer profile."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">
                  <th className="pb-3 pr-4">ID</th>
                  <th className="pb-3 pr-4">Full Name</th>
                  <th className="pb-3 pr-4">Email Address</th>
                  <th className="pb-3 pr-4">Phone Number</th>
                  <th className="pb-3 pr-4">Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4 font-bold text-slate-900 text-xs tracking-tight">
                      #CST-{cust.id}
                    </td>
                    <td className="py-4 pr-4 text-slate-900 font-bold text-sm">
                      {cust.name}
                    </td>
                    <td className="py-4 pr-4 text-slate-600 font-medium text-xs">
                      {cust.email}
                    </td>
                    <td className="py-4 pr-4 text-slate-500 font-medium text-xs">
                      {cust.phone || <span className="text-slate-300">Not specified</span>}
                    </td>
                    <td className="py-4 pr-4 text-slate-500 text-xs font-semibold">
                      {new Date(cust.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Add Customer
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer flex items-center justify-center w-6 h-6"
              >
                <span className="text-sm font-bold select-none leading-none">✕</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-slate-400 transition"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. john@example.com"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-slate-400 transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-[10px] text-slate-400">Must be unique.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-slate-400 transition"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-955 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast alerts */}
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
