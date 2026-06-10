// التحقق من صحة البريد الإلكتروني
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// التحقق من صحة رقم الهاتف الفلسطيني
export const isValidPhone = (phone) => {
  const re = /^(059|056)\d{7}$/;
  return re.test(phone);
};

// التحقق من صحة كلمة المرور
export const isStrongPassword = (password) => {
  // 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(password);
};

// التحقق من أن القيمة رقم موجب
export const isPositiveNumber = (value) => {
  return !isNaN(value) && Number(value) > 0;
};

// التحقق من صحة التاريخ
export const isValidDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

// قواعد التحقق للنماذج (Ant Design)
export const formRules = {
  required: (fieldName) => ({
    required: true,
    message: `${fieldName} مطلوب`,
  }),
  email: () => ({
    type: 'email',
    message: 'يرجى إدخال بريد إلكتروني صحيح',
  }),
  phone: () => ({
    pattern: /^(059|056)\d{7}$/,
    message: 'يرجى إدخال رقم هاتف صحيح (059xxxxxxx)',
  }),
  min: (min, fieldName) => ({
    min,
    message: `${fieldName} يجب أن يكون ${min} على الأقل`,
  }),
  positive: (fieldName) => ({
    validator: (_, value) => {
      if (value > 0) return Promise.resolve();
      return Promise.reject(new Error(`${fieldName} يجب أن يكون أكبر من صفر`));
    },
  }),
};