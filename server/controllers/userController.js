const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('-password')
    .populate('employee', 'name jobTitle')
    .sort('fullName');

  res.status(200).json({ status: 'success', results: users.length, data: { users } });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('employee', 'name jobTitle');

  if (!user) return next(new ApiError('المستخدم غير موجود', 404));

  res.status(200).json({ status: 'success', data: { user } });
});

exports.createUser = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  const user = await User.create(req.body);
  user.password = undefined;

  res.status(201).json({ status: 'success', data: { user } });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  delete req.body.password; // منع تغيير كلمة المرور من هنا

  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .select('-password');

  if (!user) return next(new ApiError('المستخدم غير موجود', 404));

  res.status(200).json({ status: 'success', data: { user } });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ApiError('المستخدم غير موجود', 404));

  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return next(new ApiError('لا يمكن حذف آخر مدير في النظام', 400));
    }
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({ status: 'success', message: 'تم حذف المستخدم' });
});

exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
    .select('-password');

  if (!user) return next(new ApiError('المستخدم غير موجود', 404));

  res.status(200).json({ status: 'success', data: { user } });
});

exports.updateUserPermissions = asyncHandler(async (req, res, next) => {
  const { permissions } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { permissions }, { new: true })
    .select('-password');

  if (!user) return next(new ApiError('المستخدم غير موجود', 404));

  res.status(200).json({ status: 'success', data: { user } });
});

exports.toggleUserStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ApiError('المستخدم غير موجود', 404));

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    status: 'success',
    data: { user: { _id: user._id, isActive: user.isActive } }
  });
});