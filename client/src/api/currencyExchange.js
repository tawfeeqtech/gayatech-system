import api from './axios';
const currencyAPI = {
  getAll: (params) => api.get('/currency', { params }),
  create: (data) => api.post('/currency', data),
  update: (id, data) => api.put(`/currency/${id}`, data),
  delete: (id) => api.delete(`/currency/${id}`),
};
export default currencyAPI;