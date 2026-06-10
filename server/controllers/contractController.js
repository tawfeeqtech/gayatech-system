const Contract = require('../models/Contract');
const ContractMonth = require('../models/ContractMonth');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    الحصول على جميع العقود
// @route   GET /api/contracts
// @access  Private (admin, finance, pm)
exports.getContracts = asyncHandler(async (req, res, next) => {
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.client) filter.client = req.query.client;
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { serviceType: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const contracts = await Contract.find(filter)
    .populate('client', 'name company')
    .sort(req.query.sortBy || '-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Contract.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: contracts.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { contracts }
  });
});

// @desc    الحصول على عقد واحد
// @route   GET /api/contracts/:id
// @access  Private
exports.getContract = asyncHandler(async (req, res, next) => {
  const contract = await Contract.findById(req.params.id)
    .populate('client', 'name company email phone');

  if (!contract) {
    return next(new ApiError('العقد غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { contract }
  });
});

// @desc    إضافة عقد جديد
// @route   POST /api/contracts
// @access  Private (admin, pm)
exports.createContract = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  const contract = await Contract.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { contract }
  });
});

// @desc    تحديث عقد
// @route   PUT /api/contracts/:id
// @access  Private (admin, pm)
exports.updateContract = asyncHandler(async (req, res, next) => {
  const contract = await Contract.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!contract) {
    return next(new ApiError('العقد غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { contract }
  });
});

// @desc    تغيير حالة العقد
// @route   PATCH /api/contracts/:id/status
// @access  Private (admin, pm)
exports.updateContractStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const contract = await Contract.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!contract) {
    return next(new ApiError('العقد غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { contract }
  });
});

// @desc    حذف عقد
// @route   DELETE /api/contracts/:id
// @access  Private (admin)
exports.deleteContract = asyncHandler(async (req, res, next) => {
  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    return next(new ApiError('العقد غير موجود', 404));
  }

  // حذف أشهر العقد المرتبطة
  await ContractMonth.deleteMany({ contract: req.params.id });

  await Contract.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف العقد وجميع الأشهر المرتبطة به'
  });
});

// @desc    الحصول على أشهر العقد
// @route   GET /api/contracts/:id/months
// @access  Private
exports.getContractMonths = asyncHandler(async (req, res, next) => {
  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    return next(new ApiError('العقد غير موجود', 404));
  }

  const months = await ContractMonth.find({ contract: req.params.id })
    .sort('-month');

  res.status(200).json({
    status: 'success',
    results: months.length,
    data: { months }
  });
});