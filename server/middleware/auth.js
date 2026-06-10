const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { jwtSecret } = require('../config/env');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError('يرجى تسجيل الدخول للوصول إلى هذا المسار.', 401));
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(new ApiError('المستخدم صاحب هذا الرمز لم يعد موجوداً.', 401));
    }

    if (!currentUser.isActive) {
      return next(new ApiError('تم إلغاء تنشيط هذا الحساب.', 401));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return next(new ApiError('رمز غير صالح أو منتهي الصلاحية.', 401));
  }
});

module.exports = { protect };
