const Subscription = require('../models/Subscription');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const invoiceFactoryService = require('../services/invoiceFactoryService');

exports.getSubscriptions = asyncHandler(async (req, res, next) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const subscriptions = await Subscription.find(filter)
    .populate('vendorRef', 'name')
    .sort('endDate')
    .skip(skip)
    .limit(limit);

  const total = await Subscription.countDocuments(filter);

  res.status(200).json({
    status: 'success', results: subscriptions.length, total, page,
    totalPages: Math.ceil(total / limit), data: { subscriptions }
  });
});

exports.createSubscription = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  const subscription = await Subscription.create(req.body);

  // إنشاء فاتورة للاشتراك
  // المستخدم طلب التحديد المسبق: بداية الفترة أو تاريخ الاستحقاق.
  // سنفترض حالياً تاريخ الاستحقاق هو البداية.
  const invoice = await invoiceFactoryService.createInvoice({
    type: 'اشتراك',
    amount: subscription.amount,
    currency: subscription.currency,
    issueDate: new Date(),
    dueDate: subscription.startDate,
    refId: subscription._id,
    refModel: 'subscription',
    recipientId: subscription.vendorRef || undefined,
    recipientType: 'vendor',
    description: `اشتراك: ${subscription.serviceName} - ${subscription.provider}`,
    userId: req.user._id
  });

  subscription.invoices.push(invoice._id);
  await subscription.save();

  res.status(201).json({ status: 'success', data: { subscription } });
});

exports.updateSubscription = asyncHandler(async (req, res, next) => {
  const subscription = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!subscription) return next(new ApiError('الاشتراك غير موجود', 404));
  res.status(200).json({ status: 'success', data: { subscription } });
});

exports.deleteSubscription = asyncHandler(async (req, res, next) => {
  const subscription = await Subscription.findByIdAndDelete(req.params.id);
  if (!subscription) return next(new ApiError('الاشتراك غير موجود', 404));
  res.status(200).json({ status: 'success', message: 'تم حذف الاشتراك' });
});

exports.getExpiringSoon = asyncHandler(async (req, res, next) => {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const subscriptions = await Subscription.find({
    endDate: { $lte: sevenDaysFromNow, $gte: new Date() },
    status: 'نشط'
  }).sort('endDate');

  res.status(200).json({ status: 'success', results: subscriptions.length, data: { subscriptions } });
});

exports.getExpired = asyncHandler(async (req, res, next) => {
  const subscriptions = await Subscription.find({
    endDate: { $lt: new Date() },
    status: { $in: ['نشط', 'بانتظار التجديد'] }
  }).sort('endDate');

  res.status(200).json({ status: 'success', results: subscriptions.length, data: { subscriptions } });
});

exports.renewSubscription = asyncHandler(async (req, res, next) => {
  const { newEndDate, amount, startDate } = req.body;
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) return next(new ApiError('الاشتراك غير موجود', 404));

  subscription.endDate = new Date(newEndDate);
  subscription.status = 'نشط';
  if (amount) subscription.amount = amount;
  if (startDate) subscription.startDate = new Date(startDate);

  // إنشاء فاتورة جديدة للتجديد
  const invoice = await invoiceFactoryService.createInvoice({
    type: 'اشتراك',
    amount: subscription.amount,
    currency: subscription.currency,
    issueDate: new Date(),
    dueDate: subscription.startDate,
    refId: subscription._id,
    refModel: 'subscription',
    recipientId: subscription.vendorRef || undefined,
    recipientType: 'vendor',
    description: `تجديد اشتراك: ${subscription.serviceName}`,
    userId: req.user._id
  });

  subscription.invoices.push(invoice._id);
  subscription.isPaid = false;
  await subscription.save();

  res.status(200).json({ status: 'success', data: { subscription } });
});
