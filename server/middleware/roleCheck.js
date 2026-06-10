const ApiError = require('../utils/ApiError');

/**
 * Middleware للتحقق من صلاحية الدور
 * @param  {...string} roles - الأدوار المسموح لها
 * @returns {Function} middleware
 * 
 * الاستخدام:
 * router.get('/', protect, roleCheck('admin', 'finance'), controller);
 */
const roleCheck = (...roles) => {
  return (req, res, next) => {
    // تأكد من وجود req.user (يجب استخدام protect قبل هذا)
    if (!req.user) {
      return next(new ApiError('يجب تسجيل الدخول أولاً', 401));
    }

    // تحقق من أن دور المستخدم موجود في الأدوار المسموح بها
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('ليس لديك صلاحية للوصول إلى هذا المسار', 403)
      );
    }

    next();
  };
};

module.exports = roleCheck;