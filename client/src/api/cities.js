import api from './axios';

const cityAPI = {
  getAll: (params) => api.get('/cities', { params }),
  create: (data) => api.post('/cities', data),
  delete: (id) => api.delete(`/cities/${id}`),
};

export default cityAPI;
