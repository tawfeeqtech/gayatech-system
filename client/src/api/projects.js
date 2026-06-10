import api from './axios';

const projectAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  updateStatus: (id, status) => api.patch(`/projects/${id}/status`, { status }),
  getTasks: (id) => api.get(`/projects/${id}/tasks`),
};

export default projectAPI;