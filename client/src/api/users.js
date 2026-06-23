import api from './axios';
const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  toggleStatus: (id) => api.patch(`/users/${id}/activate`),
  bulkDelete: (ids) => api.post('/users/bulk-delete', { ids }),
  bulkUpdate: (ids, field, value) => api.post('/users/bulk-update', { ids, field, value }),
};
export default userAPI;