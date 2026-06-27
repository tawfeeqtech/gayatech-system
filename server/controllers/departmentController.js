const Department = require('../models/Department');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    الحصول على جميع الأقسام
// @route   GET /api/departments
// @access  Private
exports.getDepartments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  const departments = await Department.find(filter)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Department.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: departments.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { departments }
  });
});

// @desc    إنشاء قسم جديد
// @route   POST /api/departments
// @access  Private
exports.createDepartment = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return next(new ApiError('اسم القسم مطلوب', 400));
  }

  const existing = await Department.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (existing) {
    return next(new ApiError('هذا القسم موجود مسبقاً', 400));
  }

  const department = await Department.create({
    name,
    createdBy: req.user ? req.user._id : null,
  });

  res.status(201).json({
    status: 'success',
    data: { department }
  });
});

// @desc    حذف قسم
// @route   DELETE /api/departments/:id
// @access  Private (admin)
exports.deleteDepartment = asyncHandler(async (req, res, next) => {
  const department = await Department.findByIdAndDelete(req.params.id);

  if (!department) {
    return next(new ApiError('القسم غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'تم حذف القسم بنجاح'
  });
});
