import api from './axios';

const projectTaskAPI = {
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  update: (id, data) => api.put(`/projects/tasks/${id}`, data),
  updateStatus: (id, status) => api.patch(`/projects/tasks/${id}/status`, { status }),
  delete: (id) => api.delete(`/projects/tasks/${id}`),
};

export default projectTaskAPI;