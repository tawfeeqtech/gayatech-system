import api from './axios';
const currencyAPI = {
  getAll: (params) => api.get('/currency', { params }),
  create: (data) => api.post('/currency', data),
  update: (id, data) => api.put(`/currency/${id}`, data),
  delete: (id) => api.delete(`/currency/${id}`),
  bulkDelete: (ids) => api.post('/currency/bulk-delete', { ids }),
  bulkUpdate: (ids, field, value) => api.post('/currency/bulk-update', { ids, field, value }),
};
export default currencyAPI;