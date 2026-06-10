import api from './axios';
const uploadAPI = {
  single: (formData) => api.post('/upload/single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  multiple: (formData) => api.post('/upload/multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (filename) => api.delete(`/upload/${filename}`),
};
export default uploadAPI;