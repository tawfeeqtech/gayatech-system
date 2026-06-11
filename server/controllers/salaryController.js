const Salary = require('../models/Salary');
const Employee = require('../models/Employee');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.getSalaries = asyncHandler(async (req, res, next) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.employee) filter.employee = req.query.employee;
  if (req.query.month) filter.month = req.query.month;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const salaries = await Salary.find(filter)
    .populate('employee', 'name jobTitle')
    .sort('-month')
    .skip(skip)
    .limit(limit);

  const total = await Salary.countDocuments(filter);

  res.status(200).json({
    status: 'success', results: salaries.length, total, page,
    totalPages: Math.ceil(total / limit), data: { salaries }
  });
});

exports.createSalary = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  const salary = await Salary.create(req.body);
  res.status(201).json({ status: 'success', data: { salary } });
});

exports.updateSalary = asyncHandler(async (req, res, next) => {
  const salary = await Salary.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!salary) return next(new ApiError('الراتب غير موجود', 404));
  res.status(200).json({ status: 'success', data: { salary } });
});

exports.paySalary = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;
  const salary = await Salary.findById(req.params.id);
  if (!salary) return next(new ApiError('الراتب غير موجود', 404));

  salary.paidAmount += amount || salary.totalAmount;
  salary.paymentDate = Date.now();
  await salary.save();

  res.status(200).json({ status: 'success', data: { salary } });
});

exports.getPendingSalaries = asyncHandler(async (req, res, next) => {
  const salaries = await Salary.find({ status: { $in: ['مستحق', 'مدفوع جزئياً'] } })
    .populate('employee', 'name jobTitle')
    .sort('-month');
  res.status(200).json({ status: 'success', results: salaries.length, data: { salaries } });
});

// @desc    حذف راتب
// @route   DELETE /api/salaries/:id
// @access  Private (admin)
exports.deleteSalary = asyncHandler(async (req, res, next) => {
  const salary = await Salary.findById(req.params.id);

  if (!salary) {
    return next(new ApiError('الراتب غير موجود', 404));
  }

  // تحقق من وجود معاملة مرتبطة
  if (salary.transaction) {
    return next(new ApiError('لا يمكن حذف الراتب لوجود معاملة مالية مرتبطة به', 400));
  }

  await Salary.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف الراتب بنجاح'
  });
});