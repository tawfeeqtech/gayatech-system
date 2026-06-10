import api from './axios';

const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  allocate: (id, allocations) => api.post(`/transactions/${id}/allocate`, { allocations }),
  getSummary: () => api.get('/transactions/summary'),
};

export default transactionAPI;