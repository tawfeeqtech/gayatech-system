import api from './axios';

const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getByCategory: (params) => api.get('/expenses/by-category', { params }),
  getRecurring: () => api.get('/expenses/recurring'),
  bulkDelete: (ids) => api.post('/expenses/bulk-delete', { ids }),
  bulkUpdate: (ids, field, value) => api.post('/expenses/bulk-update', { ids, field, value }),
};

export default expenseAPI;