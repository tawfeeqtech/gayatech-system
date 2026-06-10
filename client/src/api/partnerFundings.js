import api from './axios';
const fundingAPI = {
  getAll: (params) => api.get('/partner-fundings', { params }),
  create: (data) => api.post('/partner-fundings', data),
  update: (id, data) => api.put(`/partner-fundings/${id}`, data),
  delete: (id) => api.delete(`/partner-fundings/${id}`),
};
export default fundingAPI;