const Salary = require('../models/Salary');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const salaryService = require('../services/salaryService');
const invoiceFactoryService = require('../services/invoiceFactoryService');
const deductionService = require('../services/deductionService');

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
    .populate('invoice', 'invoiceNumber status')
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

  const salary = new Salary(req.body);

  // تطبيق الخصومات تلقائياً إذا لم تكن مدخلة يدوياً بالكامل
  if (!salary.deductionItems || salary.deductionItems.length === 0) {
    await deductionService.applyDeductions(salary);
  }

  await salary.save();

  // إنشاء فاتورة للراتب
  const invoice = await invoiceFactoryService.createInvoice({
    type: 'راتب',
    amount: salary.totalAmount,
    currency: salary.currency,
    issueDate: new Date(),
    dueDate: new Date(),
    refId: salary._id,
    refModel: 'salary',
    recipientId: salary.employee,
    recipientType: 'employee',
    description: `راتب شهر ${salary.month}`,
    userId: req.user._id
  });

  salary.invoice = invoice._id;
  await salary.save();

  res.status(201).json({ status: 'success', data: { salary } });
});

exports.updateSalary = asyncHandler(async (req, res, next) => {
  const salary = await Salary.findById(req.params.id);
  if (!salary) return next(new ApiError('الراتب غير موجود', 404));

  const updated = Object.assign(salary, req.body);
  if (!updated.deductionItems || updated.deductionItems.length === 0) {
    await deductionService.applyDeductions(updated);
  }
  await updated.save();

  if (updated.invoice) {
    const Invoice = require('../models/Invoice');
    await Invoice.findByIdAndUpdate(updated.invoice, {
      totalAmount: updated.totalAmount,
      status: updated.status
    });
  }

  res.status(200).json({ status: 'success', data: { salary: updated } });
});

exports.generateMonthlySalaries = asyncHandler(async (req, res) => {
  const count = await salaryService.generateAllSalaries(req.user._id);
  res.status(200).json({ status: 'success', message: `تم توليد ${count} راتب بنجاح` });
});

exports.getPendingSalaries = asyncHandler(async (req, res, next) => {
  const salaries = await Salary.find({ status: { $in: ['مستحق', 'مدفوع جزئياً'] } })
    .populate('employee', 'name jobTitle')
    .sort('-month');
  res.status(200).json({ status: 'success', results: salaries.length, data: { salaries } });
});

exports.deleteSalary = asyncHandler(async (req, res, next) => {
  const salary = await Salary.findById(req.params.id);
  if (!salary) return next(new ApiError('الراتب غير موجود', 404));
  if (salary.transaction) return next(new ApiError('لا يمكن حذف الراتب لوجود معاملة مالية مرتبطة به', 400));

  // حذف الفاتورة المرتبطة إن وجدت
  if (salary.invoice) {
    const Invoice = require('../models/Invoice');
    await Invoice.findByIdAndDelete(salary.invoice);
  }

  await Salary.findByIdAndDelete(req.params.id);
  res.status(200).json({ status: 'success', message: 'تم حذف الراتب بنجاح' });
});
