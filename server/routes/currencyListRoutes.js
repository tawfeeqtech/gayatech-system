const express = require('express');
const Currency = require('../models/Currency');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

// الحصول على العملات المفعّلة فقط (للاستخدام في كل النماذج)
// متاح لكل الأدوار لأن كل النماذج تحتاجه
router.get('/', roleCheck('admin', 'finance', 'accountant', 'pm', 'employee'), asyncHandler(async (req, res) => {
  const currencies = await Currency.find({ isActive: true }).sort('sortOrder code');
  res.status(200).json({ status: 'success', results: currencies.length, data: { currencies } });
}));

// الحصول على كل العملات (المفعّلة وغير المفعّلة) - لصفحة الإدارة
router.get('/all', roleCheck('admin'), asyncHandler(async (req, res) => {
  const currencies = await Currency.find().sort('sortOrder code');
  res.status(200).json({ status: 'success', results: currencies.length, data: { currencies } });
}));

// إضافة عملة جديدة
router.post('/', roleCheck('admin'), asyncHandler(async (req, res, next) => {
  // توحيد رمز العملة أحرف كبيرة
  if (req.body.code) req.body.code = req.body.code.toUpperCase().trim();

  const existing = await Currency.findOne({ code: req.body.code });
  if (existing) {
    return next(new ApiError('رمز العملة موجود مسبقاً', 400));
  }

  const currency = await Currency.create(req.body);
  res.status(201).json({ status: 'success', data: { currency } });
}));

// تحديث عملة
router.put('/:id', roleCheck('admin'), asyncHandler(async (req, res, next) => {
  if (req.body.code) req.body.code = req.body.code.toUpperCase().trim();

  // منع تكرار الكود
  if (req.body.code) {
    const dup = await Currency.findOne({ code: req.body.code, _id: { $ne: req.params.id } });
    if (dup) return next(new ApiError('رمز العملة موجود مسبقاً', 400));
  }

  const currency = await Currency.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!currency) return next(new ApiError('العملة غير موجودة', 404));

  res.status(200).json({ status: 'success', data: { currency } });
}));

// حذف عملة (مع منع الحذف إن كانت مستخدمة)
router.delete('/:id', roleCheck('admin'), asyncHandler(async (req, res, next) => {
  const currency = await Currency.findById(req.params.id);
  if (!currency) return next(new ApiError('العملة غير موجودة', 404));

  // فحص استخدام العملة في المحافظ / المعاملات / الفواتير
  const code = currency.code;
  const [wallets, transactions, invoices] = await Promise.all([
    Wallet.countDocuments({ currency: code }),
    Transaction.countDocuments({ currency: code }),
    Invoice.countDocuments({ currency: code }),
  ]);

  if (wallets > 0 || transactions > 0 || invoices > 0) {
    return next(new ApiError(
      `لا يمكن حذف العملة "${code}" لأنها مستخدمة في (${wallets} محفظة، ${transactions} معاملة، ${invoices} فاتورة). يُفضّل تعطيلها بدلاً من الحذف.`,
      400
    ));
  }

  await Currency.findByIdAndDelete(req.params.id);
  res.status(200).json({ status: 'success', message: 'تم حذف العملة' });
}));

module.exports = router;
