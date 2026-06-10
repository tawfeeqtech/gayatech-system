import api from './axios';

const accountAPI = {
  getAll: () => api.get('/accounts'),
  getById: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  getMovements: (id, params) => api.get(`/accounts/${id}/movements`, { params }),
};

export default accountAPI;