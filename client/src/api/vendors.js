import api from './axios';

const vendorAPI = {
  getAll: () => api.get('/vendors'),
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
  bulkDelete: (ids) => api.post('/vendors/bulk-delete', { ids }),
  bulkUpdate: (ids, field, value) => api.post('/vendors/bulk-update', { ids, field, value }),
};

export default vendorAPI;
