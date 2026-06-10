import api from './axios';
const importAPI = {
  importData: (type, formData) => api.post(`/import/${type}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  downloadTemplate: (type) => api.get(`/import/template/${type}`, {
    responseType: 'blob',
  }),
};
export default importAPI;