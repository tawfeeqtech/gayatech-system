const Employee = require('../models/Employee');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    الحصول على جميع الموظفين
// @route   GET /api/employees
// @access  Private (admin, finance, pm)
exports.getEmployees = asyncHandler(async (req, res, next) => {
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { jobTitle: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const employees = await Employee.find(filter)
    .populate('user', 'username role')
    .sort(req.query.sortBy || '-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Employee.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: employees.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { employees }
  });
});

// @desc    الحصول على موظف واحد
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id)
    .populate('user', 'username role');

  if (!employee) {
    return next(new ApiError('الموظف غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { employee }
  });
});

// @desc    إضافة موظف جديد
// @route   POST /api/employees
// @access  Private (admin)
exports.createEmployee = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  const employee = await Employee.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { employee }
  });
});

// @desc    تحديث موظف
// @route   PUT /api/employees/:id
// @access  Private (admin)
exports.updateEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!employee) {
    return next(new ApiError('الموظف غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { employee }
  });
});

// @desc    تغيير حالة الموظف
// @route   PATCH /api/employees/:id/status
// @access  Private (admin)
exports.updateEmployeeStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new ApiError('يرجى توفير الحالة الجديدة', 400));
  }

  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!employee) {
    return next(new ApiError('الموظف غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { employee }
  });
});

// @desc    حذف موظف
// @route   DELETE /api/employees/:id
// @access  Private (admin)
exports.deleteEmployee = asyncHandler(async (req, res, next) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return next(new ApiError('الموظف غير موجود', 404));
  }

  await Employee.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف الموظف بنجاح'
  });
});