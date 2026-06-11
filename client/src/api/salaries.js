import api from './axios';

const salaryAPI = {
  getAll: (params) => api.get('/salaries', { params }),
  create: (data) => api.post('/salaries', data),
  update: (id, data) => api.put(`/salaries/${id}`, data),
  delete: (id) => api.delete(`/salaries/${id}`),
  pay: (id, amount) => api.patch(`/salaries/${id}/pay`, { amount }),
  getPending: () => api.get('/salaries/pending'),
};

export default salaryAPI;