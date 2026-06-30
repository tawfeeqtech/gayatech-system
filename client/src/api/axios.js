import axios from 'axios';
import { getToken } from '../utils/auth';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// متغير لتتبع الأخطاء في نفس الطلب لمنع التكرار
let lastErrorUrl = '';
let lastErrorTime = 0;

// إضافة التوكن تلقائياً
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// معالجة الأخطاء
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const now = Date.now();

    // عرض toast للخطأ إذا لم يكن 401
    if (error.response) {
      if (error.response.status === 401) {
        // 401: تسجيل الخروج - لا نظهر toast
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      // ملاحظة: لا نظهر toast هنا لأن الصفحات تدير أخطاءها بنفسها برسائل مخصصة
    } else {
      // خطأ في الشبكة أو بدون استجابة
      if (requestUrl !== lastErrorUrl || (now - lastErrorTime) > 3000) {
        toast.error('حدث خطأ في الشبكة');
        lastErrorUrl = requestUrl;
        lastErrorTime = now;
      }
    }
    return Promise.reject(error);
  }
);

export default api;