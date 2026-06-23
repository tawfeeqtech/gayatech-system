import api from './axios';

const subscriptionAPI = {
  getAll: (params) => api.get('/subscriptions', { params }),
  create: (data) => api.post('/subscriptions', data),
  update: (id, data) => api.put(`/subscriptions/${id}`, data),
  delete: (id) => api.delete(`/subscriptions/${id}`),
  getExpiringSoon: () => api.get('/subscriptions/expiring-soon'),
  getExpired: () => api.get('/subscriptions/expired'),
  renew: (id, newEndDate) => api.patch(`/subscriptions/${id}/renew`, { newEndDate }),
  bulkDelete: (ids) => api.post('/subscriptions/bulk-delete', { ids }),
  bulkUpdate: (ids, field, value) => api.post('/subscriptions/bulk-update', { ids, field, value }),
};

export default subscriptionAPI;