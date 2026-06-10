const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { jwtSecret, jwtExpire } = require('../config/env');

const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpire
  });
};

// @desc    تسجيل الدخول
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  // 1) التحقق من إدخال اسم المستخدم وكلمة المرور
  if (!username || !password) {
    return next(new ApiError('يرجى إدخال اسم المستخدم وكلمة المرور', 400));
  }

  // 2) البحث عن المستخدم والتحقق من كلمة المرور
  const user = await User.findOne({ username }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return next(new ApiError('اسم المستخدم أو كلمة المرور غير صحيحة', 401));
  }

  // 3) التحقق من أن الحساب نشط
  if (!user.isActive) {
    return next(new ApiError('هذا الحساب معطل، يرجى التواصل مع الإدارة', 403));
  }

  // 4) إرسال الاستجابة مع الرمز المميز (Token)
  const token = generateToken(user._id);

  // تحديث تاريخ آخر تسجيل دخول
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  // إخفاء كلمة المرور من المخرجات
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
});

// @desc    الحصول على بيانات المستخدم الحالي
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

// @desc    تسجيل الخروج
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'تم تسجيل الخروج بنجاح'
  });
});
