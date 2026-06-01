import axios from "axios";

const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Fallback to the production backend URL if on the Railway frontend domain
  if (typeof window !== "undefined" && window.location.hostname.includes("railway.app")) {
    return "https://inventory-management-system-production-b5d6.up.railway.app";
  }
  return "http://localhost:8000";
};

const API_BASE = getApiBase();

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// API methods grouped by Resource
export const api = {
  // Products
  getProducts: async (search) => {
    const response = await apiClient.get("/products/", {
      params: search ? { search } : undefined,
    });
    return response.data;
  },
  getProduct: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },
  createProduct: async (data) => {
    const response = await apiClient.post("/products/", data);
    return response.data;
  },
  updateProduct: async (id, data) => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  // Customers
  getCustomers: async (search) => {
    const response = await apiClient.get("/customers/", {
      params: search ? { search } : undefined,
    });
    return response.data;
  },
  createCustomer: async (data) => {
    const response = await apiClient.post("/customers/", data);
    return response.data;
  },

  // Orders
  getOrders: async () => {
    const response = await apiClient.get("/orders/");
    return response.data;
  },
  getOrder: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },
  createOrder: async (data) => {
    const response = await apiClient.post("/orders/", data);
    return response.data;
  },
};
