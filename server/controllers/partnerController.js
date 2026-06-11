const Partner = require('../models/Partner');
const PartnerFunding = require('../models/PartnerFunding');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.getPartners = asyncHandler(async (req, res, next) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const partners = await Partner.find(filter)
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Partner.countDocuments(filter);

  res.status(200).json({
    status: 'success', results: partners.length, total, page,
    totalPages: Math.ceil(total / limit), data: { partners }
  });
});

exports.getPartner = asyncHandler(async (req, res, next) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner) return next(new ApiError('الشريك غير موجود', 404));

  const fundings = await PartnerFunding.find({ partner: req.params.id })
    .populate('toAccount', 'name')
    .populate('fromAccount', 'name')
    .sort('-fundingDate');

  res.status(200).json({ status: 'success', data: { partner, fundings } });
});

exports.createPartner = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  const partner = await Partner.create(req.body);
  res.status(201).json({ status: 'success', data: { partner } });
});

exports.updatePartner = asyncHandler(async (req, res, next) => {
  const partner = await Partner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!partner) return next(new ApiError('الشريك غير موجود', 404));
  res.status(200).json({ status: 'success', data: { partner } });
});

exports.deletePartner = asyncHandler(async (req, res, next) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner) return next(new ApiError('الشريك غير موجود', 404));
  await PartnerFunding.deleteMany({ partner: req.params.id });
  await Partner.findByIdAndDelete(req.params.id);
  res.status(200).json({ status: 'success', message: 'تم حذف الشريك وتمويلاته' });
});

exports.getPartnerFundings = asyncHandler(async (req, res, next) => {
  const fundings = await PartnerFunding.find({ partner: req.params.id })
    .populate('toAccount', 'name')
    .populate('fromAccount', 'name')
    .sort('-fundingDate');
  res.status(200).json({ status: 'success', results: fundings.length, data: { fundings } });
});

exports.createFunding = asyncHandler(async (req, res, next) => {
  req.body.partner = req.params.id;
  req.body.createdBy = req.user._id;
  const funding = await PartnerFunding.create(req.body);

  // تحديث إحصائيات الشريك
  const allFundings = await PartnerFunding.find({ partner: funding.partner });
  const totalFunded = allFundings.filter(f => f.direction === 'تمويل وارد').reduce((s, f) => s + f.amount, 0);
  const totalRepaid = allFundings.filter(f => f.direction === 'سداد للشريك').reduce((s, f) => s + f.amount, 0);
  await Partner.findByIdAndUpdate(funding.partner, {
    computedStats: { totalFunded, totalRepaid, balance: totalRepaid - totalFunded, totalTransactions: allFundings.length }
  });

  res.status(201).json({ status: 'success', data: { funding } });
});