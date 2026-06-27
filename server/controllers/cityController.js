const City = require('../models/City');
const Country = require('../models/Country');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.getCities = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 200;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.country) filter.country = req.query.country;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

  const cities = await City.find(filter)
    .populate('country', 'name')
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  const total = await City.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: cities.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { cities }
  });
});

exports.createCity = asyncHandler(async (req, res, next) => {
  const { name, country } = req.body;
  if (!name) return next(new ApiError('اسم المدينة مطلوب', 400));
  if (!country) return next(new ApiError('الدولة مطلوبة', 400));

  const countryExists = await Country.findById(country);
  if (!countryExists) return next(new ApiError('الدولة غير موجودة', 404));

  const existing = await City.findOne({ name: { $regex: `^${name}$`, $options: 'i' }, country });
  if (existing) return next(new ApiError('هذه المدينة موجودة مسبقاً في هذه الدولة', 400));

  const city = await City.create({
    name,
    country,
    createdBy: req.user ? req.user._id : null,
  });

  const populated = await City.findById(city._id).populate('country', 'name');

  res.status(201).json({ status: 'success', data: { city: populated } });
});

exports.deleteCity = asyncHandler(async (req, res, next) => {
  const city = await City.findByIdAndDelete(req.params.id);
  if (!city) return next(new ApiError('المدينة غير موجودة', 404));
  res.status(200).json({ status: 'success', message: 'تم حذف المدينة' });
});
