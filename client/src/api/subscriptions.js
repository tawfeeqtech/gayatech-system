import api from './axios';

const subscriptionAPI = {
  getAll: (params) => api.get('/subscriptions', { params }),
  create: (data) => api.post('/subscriptions', data),
  update: (id, data) => api.put(`/subscriptions/${id}`, data),
  delete: (id) => api.delete(`/subscriptions/${id}`),
  getExpiringSoon: () => api.get('/subscriptions/expiring-soon'),
  getExpired: () => api.get('/subscriptions/expired'),
  renew: (id, newEndDate) => api.patch(`/subscriptions/${id}/renew`, { newEndDate }),
};

export default subscriptionAPI;