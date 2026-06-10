const ApiError = require('../utils/ApiError');

/**
 * Middleware للتحقق من صحة البيانات باستخدام Joi Schema
 * @param  {Object} schema - Joi Schema
 * @param  {String} property - body, params, query (الافتراضي: body)
 * @returns {Function} middleware
 * 
 * الاستخدام:
 * router.post('/', protect, validate(clientSchema), controller);
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,        // جمع كل الأخطاء
      stripUnknown: true,       // حذف الحقول غير المعروفة
      allowUnknown: false       // رفض الحقول غير المعروفة
    });

    if (error) {
      // استخراج رسائل الخطأ
      const messages = error.details.map(detail => {
        return {
          field: detail.path.join('.'),
          message: detail.message.replace(/"/g, '')
        };
      });

      // أول رسالة خطأ كرسالة رئيسية
      const mainMessage = messages[0]?.message || 'بيانات غير صالحة';

      const apiError = new ApiError(mainMessage, 400);
      apiError.errors = messages; // إضافة تفاصيل الأخطاء
      
      return next(apiError);
    }

    // استبدال البيانات بالبيانات المنظفة
    req[property] = value;
    next();
  };
};

module.exports = validate;