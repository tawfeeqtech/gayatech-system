import api from './axios';

const salaryAPI = {
  getAll: (params) => api.get('/salaries', { params }),
  create: (data) => api.post('/salaries', data),
  update: (id, data) => api.put(`/salaries/${id}`, data),
  delete: (id) => api.delete(`/salaries/${id}`),
  generate: () => api.post('/salaries/generate'),
  getPending: () => api.get('/salaries/pending'),
  bulkDelete: (ids) => api.post('/salaries/bulk-delete', { ids }),
  bulkUpdate: (ids, field, value) => api.post('/salaries/bulk-update', { ids, field, value }),
};

export default salaryAPI;
