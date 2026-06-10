import api from './axios';

const contractMonthAPI = {
  create: (data) => api.post('/contract-months', data),
  update: (id, data) => api.put(`/contract-months/${id}`, data),
  confirm: (id) => api.patch(`/contract-months/${id}/confirm`),
  delete: (id) => api.delete(`/contract-months/${id}`),
  generate: () => api.post('/contract-months/generate'),
};

export default contractMonthAPI;