import api from './axios';

const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  getOverdue: () => api.get('/invoices/overdue'),
  bulkDelete: (ids) => api.post('/invoices/bulk-delete', { ids }),
  bulkUpdate: (ids, field, value) => api.post('/invoices/bulk-update', { ids, field, value }),
};

export default invoiceAPI;