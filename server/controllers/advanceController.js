const Advance = require('../models/Advance');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.getAdvances = asyncHandler(async (req, res, next) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.employee) filter.employee = req.query.employee;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const advances = await Advance.find(filter)
    .populate('employee', 'name jobTitle')
    .populate('approvedBy', 'fullName')
    .sort('-requestDate')
    .skip(skip)
    .limit(limit);

  const total = await Advance.countDocuments(filter);

  res.status(200).json({
    status: 'success', results: advances.length, total, page,
    totalPages: Math.ceil(total / limit), data: { advances }
  });
});

exports.createAdvance = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  const advance = await Advance.create(req.body);
  res.status(201).json({ status: 'success', data: { advance } });
});

exports.updateAdvance = asyncHandler(async (req, res, next) => {
  const advance = await Advance.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!advance) return next(new ApiError('السلفة غير موجودة', 404));
  res.status(200).json({ status: 'success', data: { advance } });
});

exports.approveAdvance = asyncHandler(async (req, res, next) => {
  const advance = await Advance.findByIdAndUpdate(req.params.id, {
    status: 'موافق عليها',
    approvedBy: req.user._id,
    approvedAt: Date.now()
  }, { new: true });
  if (!advance) return next(new ApiError('السلفة غير موجودة', 404));
  res.status(200).json({ status: 'success', data: { advance } });
});

exports.rejectAdvance = asyncHandler(async (req, res, next) => {
  const advance = await Advance.findByIdAndUpdate(req.params.id, {
    status: 'مرفوضة'
  }, { new: true });
  if (!advance) return next(new ApiError('السلفة غير موجودة', 404));
  res.status(200).json({ status: 'success', data: { advance } });
});

exports.repayAdvance = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;
  const advance = await Advance.findById(req.params.id);
  if (!advance) return next(new ApiError('السلفة غير موجودة', 404));

  advance.repaidAmount += amount;
  await advance.save();

  res.status(200).json({ status: 'success', data: { advance } });
});

exports.getPendingAdvances = asyncHandler(async (req, res, next) => {
  const advances = await Advance.find({ status: 'معلقة' })
    .populate('employee', 'name jobTitle')
    .sort('-requestDate');
  res.status(200).json({ status: 'success', results: advances.length, data: { advances } });
});