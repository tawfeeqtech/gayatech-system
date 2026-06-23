import api from './axios';

const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  updateStatus: (id, status) => api.patch(`/employees/${id}/status`, { status }),
  bulkDelete: (ids) => api.post('/employees/bulk-delete', { ids }),
  bulkUpdate: (ids, field, value) => api.post('/employees/bulk-update', { ids, field, value }),
};

export default employeeAPI;