const Country = require('../models/Country');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.getCountries = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  const countries = await Country.find(filter)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Country.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: countries.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { countries }
  });
});

exports.createCountry = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name) return next(new ApiError('اسم الدولة مطلوب', 400));

  const existing = await Country.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (existing) return next(new ApiError('هذه الدولة موجودة مسبقاً', 400));

  const country = await Country.create({
    name,
    createdBy: req.user ? req.user._id : null,
  });

  res.status(201).json({ status: 'success', data: { country } });
});

exports.deleteCountry = asyncHandler(async (req, res, next) => {
  const country = await Country.findByIdAndDelete(req.params.id);
  if (!country) return next(new ApiError('الدولة غير موجودة', 404));
  // حذف المدن المرتبطة
  await require('../models/City').deleteMany({ country: req.params.id });
  res.status(200).json({ status: 'success', message: 'تم حذف الدولة' });
});
