import api from './axios';

const systemAPI = {
  reset: () => api.post('/system/reset'),
};

export default systemAPI;
