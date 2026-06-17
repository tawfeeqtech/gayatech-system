import api from './axios';

// عميل API للعملات الموحدة
const currencyAPI = {
  // العملات المفعّلة فقط (للاستخدام في النماذج)
  getActive: () => api.get('/currencies'),
  // كل العملات (لصفحة الإدارة)
  getAll: () => api.get('/currencies/all'),
  // إنشاء عملة
  create: (data) => api.post('/currencies', data),
  // تحديث عملة
  update: (id, data) => api.put(`/currencies/${id}`, data),
  // حذف عملة
  remove: (id) => api.delete(`/currencies/${id}`),
};

export default currencyAPI;
