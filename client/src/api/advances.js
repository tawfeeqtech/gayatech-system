import api from './axios';

const advanceAPI = {
  getAll: (params) => api.get('/advances', { params }),
  create: (data) => api.post('/advances', data),
  update: (id, data) => api.put(`/advances/${id}`, data),
  delete: (id) => api.delete(`/advances/${id}`),
  approve: (id, data) => api.patch(`/advances/${id}/approve`, data),
  reject: (id) => api.patch(`/advances/${id}/reject`),
  repay: (id, amount) => api.patch(`/advances/${id}/repay`, { amount }),
  getPending: () => api.get('/advances/pending'),
};

export default advanceAPI;
