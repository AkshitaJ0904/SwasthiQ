import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getInventoryOverview = () => api.get('/dashboard/inventory-overview');
export const getRecentSales = (limit = 10) => api.get(`/dashboard/recent-sales?limit=${limit}`);
export const getLowStockItems = () => api.get('/dashboard/low-stock');

// Medicines
export const getMedicines = (params = {}) => api.get('/medicines', { params });
export const getAllMedicines = () => api.get('/medicines/all');
export const getMedicine = (id) => api.get(`/medicines/${id}`);
export const createMedicine = (data) => api.post('/medicines', data);
export const updateMedicine = (id, data) => api.put(`/medicines/${id}`, data);
export const patchMedicineStatus = (id, status) => api.patch(`/medicines/${id}/status`, { status });
export const deleteMedicine = (id) => api.delete(`/medicines/${id}`);

// Sales
export const getSales = (limit = 50) => api.get(`/sales?limit=${limit}`);
export const createSale = (data) => api.post('/sales', data);
export const getSale = (id) => api.get(`/sales/${id}`);

// Purchase Orders
export const getPurchaseOrders = (status) => api.get('/purchase-orders', { params: status ? { status } : {} });
export const createPurchaseOrder = (data) => api.post('/purchase-orders', data);

// FIX: backend expects status as a query param: PATCH /purchase-orders/{id}/status?status=ACTIVE
// We uppercase it here to guarantee it matches backend's status.upper() call
export const updatePOStatus = (id, status) => api.patch(`/purchase-orders/${id}/status`, null, {
  params: { status: status.toUpperCase() }
});

export default api;