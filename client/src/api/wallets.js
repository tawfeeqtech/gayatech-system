import api from './axios';

const walletAPI = {
  // الحصول على جميع المحافظ
  getAll: () => api.get('/wallets'),

  // الحصول على محافظ حساب معين
  getByAccount: (accountId) => api.get(`/accounts/${accountId}/wallets`),

  // إضافة محفظة جديدة لحساب
  create: (accountId, data) => api.post(`/accounts/${accountId}/wallets`, data),

  // تحديث محفظة
  update: (accountId, id, data) => api.put(`/accounts/${accountId}/wallets/${id}`, data),

  // حذف محفظة
  remove: (accountId, id) => api.delete(`/accounts/${accountId}/wallets/${id}`),
};

export default walletAPI;
