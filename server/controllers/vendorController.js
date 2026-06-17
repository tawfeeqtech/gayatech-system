const Vendor = require('../models/Vendor');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.getVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find().sort('name');
  res.status(200).json({ status: 'success', results: vendors.length, data: { vendors } });
});

exports.createVendor = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user._id;
  const vendor = await Vendor.create(req.body);
  res.status(201).json({ status: 'success', data: { vendor } });
});

exports.getVendor = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return next(new ApiError('المزود غير موجود', 404));
  res.status(200).json({ status: 'success', data: { vendor } });
});

exports.updateVendor = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!vendor) return next(new ApiError('المزود غير موجود', 404));
  res.status(200).json({ status: 'success', data: { vendor } });
});

exports.deleteVendor = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return next(new ApiError('المزود غير موجود', 404));
  // يمكن إضافة تحقق هنا لمنع الحذف إذا كان للمزود مصاريف مرتبطة
  await Vendor.findByIdAndDelete(req.params.id);
  res.status(204).json({ status: 'success', data: null });
});
