"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");

  // UX states
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts(search.trim() || undefined);
      setProducts(data);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Failed to load products.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce typing input

    return () => clearTimeout(handler);
  }, [search]);

  const openAddModal = () => {
    setEditingProduct(null);
    setSku("");
    setName("");
    setDescription("");
    setPrice("");
    setStockQuantity("");
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setSku(prod.sku);
    setName(prod.name);
    setDescription(prod.description || "");
    setPrice(prod.price.toString());
    setStockQuantity(prod.stock_quantity.toString());
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Frontend validations
    if (!sku.trim() || !name.trim() || !price || !stockQuantity) {
      showToast("Please fill in all required fields.", "error");
      setSubmitting(false);
      return;
    }

    const priceNum = Number(price);
    const stockInt = parseInt(stockQuantity);

    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("Price must be a valid positive number.", "error");
      setSubmitting(false);
      return;
    }

    if (isNaN(stockInt) || stockInt < 0) {
      showToast("Stock quantity must be a valid non-negative number.", "error");
      setSubmitting(false);
      return;
    }

    const payload = {
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || null,
      price: priceNum,
      stock_quantity: stockInt,
    };

    try {
      if (editingProduct) {
        // Edit mode
        await api.updateProduct(editingProduct.id, payload);
        showToast(`Product updated successfully!`, "success");
      } else {
        // Create mode
        await api.createProduct(payload);
        showToast(`Product created successfully!`, "success");
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Failed to save product.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (prod) => {
    if (!confirm(`Are you sure you want to permanently delete '${prod.name}'?`)) return;

    try {
      await api.deleteProduct(prod.id);
      showToast("Product deleted successfully.", "success");
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Cannot delete product because it has been ordered by customers.", "error");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Products</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your product catalog, prices, and stock levels</p>
        </div>
        <div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <span className="text-xs font-bold leading-none select-none">➕</span>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search actions */}
      <div className="relative w-full max-w-md">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base select-none leading-none">🔍</span>
        <input
          type="text"
          placeholder="Search by name or SKU..."
          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-10.5 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-slate-400 shadow-sm transition-all placeholder:text-slate-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Data Card Wrapper */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {loading ? (
          <div className="py-12 flex items-center justify-center gap-3 text-slate-400 text-sm font-semibold">
            <span className="animate-spin text-base select-none leading-none">⏳</span>
            <span>Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <p className="font-semibold text-slate-500">No products found.</p>
            <p className="text-xs text-slate-400 mt-1">
              {search ? "No products match your search filter." : "Get started by adding your first product."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">
                  <th className="pb-3 pr-4">SKU</th>
                  <th className="pb-3 pr-4">Product Name</th>
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3 pr-4">Price</th>
                  <th className="pb-3 pr-4">Stock</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4 font-mono font-bold text-slate-900 text-xs tracking-tight uppercase">
                      {prod.sku}
                    </td>
                    <td className="py-4 pr-4 text-slate-900 font-bold text-sm">
                      {prod.name}
                    </td>
                    <td className="py-4 pr-4 text-slate-500 max-w-[200px] truncate text-xs font-medium">
                      {prod.description || <span className="text-slate-300">No description</span>}
                    </td>
                    <td className="py-4 pr-4 font-extrabold text-slate-900">
                      ${Number(prod.price).toFixed(2)}
                    </td>
                    <td className="py-4 pr-4 font-bold text-slate-900 text-xs">
                      {prod.stock_quantity} units
                    </td>
                    <td className="py-4 pr-4">
                      {prod.stock_quantity === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          Out of Stock
                        </span>
                      ) : prod.stock_quantity < 5 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse-subtle">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition shadow-sm cursor-pointer flex items-center justify-center w-7 h-7"
                          title="Edit Product"
                        >
                          <span className="text-xs select-none leading-none">✏️</span>
                        </button>
                        <button
                          onClick={() => handleDelete(prod)}
                          className="p-1.5 bg-white border border-red-100 hover:bg-red-50 rounded-lg transition shadow-sm cursor-pointer flex items-center justify-center w-7 h-7"
                          title="Delete Product"
                        >
                          <span className="text-xs select-none leading-none">🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Entry Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                {editingProduct ? "Edit Product" : "Add Product"}
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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">SKU *</label>
                <input
                  type="text"
                  placeholder="e.g. CORE-I7-16GB"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-slate-400 transition"
                  style={{ textTransform: "uppercase" }}
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  disabled={!!editingProduct} // SKU cannot be modified once set to preserve db integrity
                  required
                />
                {!editingProduct && (
                  <p className="text-[10px] text-slate-400">Must be unique.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dell XPS 13 Laptop"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-slate-400 transition"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Description</label>
                <textarea
                  placeholder="Provide details about the product..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-slate-400 transition min-h-[70px] resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="999.99"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-slate-400 transition"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Stock Quantity *</label>
                  <input
                    type="number"
                    placeholder="50"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-slate-400 transition"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingProduct ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Custom Toast Alerts */}
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
