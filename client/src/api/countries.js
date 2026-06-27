import api from './axios';

const countryAPI = {
  getAll: () => api.get('/countries'),
  create: (data) => api.post('/countries', data),
  delete: (id) => api.delete(`/countries/${id}`),
};

export default countryAPI;
