const IncomeSource = require('../models/IncomeSource');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.getSources = asyncHandler(async (req, res) => {
  const sources = await IncomeSource.find().sort('name');
  res.status(200).json({ status: 'success', results: sources.length, data: { sources } });
});

exports.createSource = asyncHandler(async (req, res) => {
  const source = await IncomeSource.create(req.body);
  res.status(201).json({ status: 'success', data: { source } });
});

exports.updateSource = asyncHandler(async (req, res, next) => {
  const source = await IncomeSource.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!source) return next(new ApiError('المصدر غير موجود', 404));
  res.status(200).json({ status: 'success', data: { source } });
});

exports.deleteSource = asyncHandler(async (req, res, next) => {
  const source = await IncomeSource.findByIdAndDelete(req.params.id);
  if (!source) return next(new ApiError('المصدر غير موجود', 404));
  res.status(200).json({ status: 'success', message: 'تم حذف المصدر' });
});