const express = require('express');
const ExpenseCategory = require('../models/ExpenseCategory');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

// الحصول على جميع التصنيفات
router.get('/', roleCheck('admin', 'finance', 'accountant'), asyncHandler(async (req, res) => {
  const categories = await ExpenseCategory.find().sort('name');
  res.status(200).json({ status: 'success', results: categories.length, data: { categories } });
}));

// إضافة تصنيف
router.post('/', roleCheck('admin'), asyncHandler(async (req, res) => {
  const category = await ExpenseCategory.create(req.body);
  res.status(201).json({ status: 'success', data: { category } });
}));

// تحديث تصنيف
router.put('/:id', roleCheck('admin'), asyncHandler(async (req, res, next) => {
  const category = await ExpenseCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) return next(new ApiError('التصنيف غير موجود', 404));
  res.status(200).json({ status: 'success', data: { category } });
}));

// حذف تصنيف
router.delete('/:id', roleCheck('admin'), asyncHandler(async (req, res, next) => {
  const category = await ExpenseCategory.findByIdAndDelete(req.params.id);
  if (!category) return next(new ApiError('التصنيف غير موجود', 404));
  res.status(200).json({ status: 'success', message: 'تم حذف التصنيف' });
}));

module.exports = router;