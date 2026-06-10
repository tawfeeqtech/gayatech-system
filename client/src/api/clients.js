import api from './axios';

const clientAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  getStats: (id) => api.get(`/clients/${id}/stats`),
  getContracts: (id) => api.get(`/clients/${id}/contracts`),
  getProjects: (id) => api.get(`/clients/${id}/projects`),
  getTransactions: (id, params) => api.get(`/clients/${id}/transactions`, { params }),
};

export default clientAPI;