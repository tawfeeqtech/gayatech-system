import api from './axios';

const partnerAPI = {
  getAll: (params) => api.get('/partners', { params }),
  getById: (id) => api.get(`/partners/${id}`),
  create: (data) => api.post('/partners', data),
  update: (id, data) => api.put(`/partners/${id}`, data),
  delete: (id) => api.delete(`/partners/${id}`),
  getFundings: (id) => api.get(`/partners/${id}/fundings`),
  createFunding: (id, data) => api.post(`/partners/${id}/fundings`, data),
};

export default partnerAPI;