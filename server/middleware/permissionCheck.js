const ApiError = require('../utils/ApiError');

/**
 * Middleware للتحقق من صلاحية محددة
 * @param  {...string} permissions - الصلاحيات المطلوبة
 * @returns {Function} middleware
 * 
 * الاستخدام:
 * router.delete('/:id', protect, permissionCheck('canDeleteInvoices'), controller);
 */
const permissionCheck = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('يجب تسجيل الدخول أولاً', 401));
    }

    // المدير لديه كل الصلاحيات
    if (req.user.role === 'admin') {
      return next();
    }

    // تحقق من وجود حقل permissions في المستخدم
    if (!req.user.permissions) {
      return next(
        new ApiError('ليس لديك صلاحية للقيام بهذا الإجراء', 403)
      );
    }

    // تحقق من كل صلاحية مطلوبة
    const hasAllPermissions = permissions.every(
      permission => req.user.permissions[permission] === true
    );

    if (!hasAllPermissions) {
      return next(
        new ApiError('ليس لديك صلاحية للقيام بهذا الإجراء', 403)
      );
    }

    next();
  };
};

module.exports = permissionCheck;