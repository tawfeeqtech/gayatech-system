import api from './axios';

const jobTitleAPI = {
  getAll: () => api.get('/job-titles'),
  create: (data) => api.post('/job-titles', data),
  delete: (id) => api.delete(`/job-titles/${id}`),
};

export default jobTitleAPI;
