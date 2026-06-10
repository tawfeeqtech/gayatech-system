import api from './axios';
const incomeSourceAPI = {
  getAll: () => api.get('/income-sources'),
  create: (data) => api.post('/income-sources', data),
  update: (id, data) => api.put(`/income-sources/${id}`, data),
  delete: (id) => api.delete(`/income-sources/${id}`),
};
export default incomeSourceAPI;