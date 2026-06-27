import api from './axios';

const departmentAPI = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export default departmentAPI;
