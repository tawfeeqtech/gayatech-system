import api from './axios';

const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  dismiss: (id) => api.patch(`/notifications/${id}/dismiss`),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default notificationAPI;