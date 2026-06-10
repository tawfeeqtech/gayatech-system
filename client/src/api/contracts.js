import api from './axios';

const contractAPI = {
  getAll: (params) => api.get('/contracts', { params }),
  getById: (id) => api.get(`/contracts/${id}`),
  create: (data) => api.post('/contracts', data),
  update: (id, data) => api.put(`/contracts/${id}`, data),
  delete: (id) => api.delete(`/contracts/${id}`),
  updateStatus: (id, status) => api.patch(`/contracts/${id}/status`, { status }),
  getMonths: (id) => api.get(`/contracts/${id}/months`),
  getChanges: (id) => api.get(`/contracts/${id}/changes`),
};

export default contractAPI;