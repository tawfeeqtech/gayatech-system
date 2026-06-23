const JobTitle = require('../models/JobTitle');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    الحصول على جميع المسميات الوظيفية
// @route   GET /api/job-titles
// @access  Private (admin, finance)
exports.getJobTitles = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  const jobTitles = await JobTitle.find(filter)
    .populate('createdBy', 'username')
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  const total = await JobTitle.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: jobTitles.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { jobTitles }
  });
});

// @desc    إنشاء مسمى وظيفي جديد
// @route   POST /api/job-titles
// @access  Private (admin)
exports.createJobTitle = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return next(new ApiError('اسم المسمى الوظيفي مطلوب', 400));
  }

  // التحقق من عدم التكرار
  const existing = await JobTitle.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (existing) {
    return next(new ApiError('هذا المسمى الوظيفي موجود مسبقاً', 400));
  }

  const jobTitle = await JobTitle.create({
    name,
    createdBy: req.user._id
  });

  res.status(201).json({
    status: 'success',
    data: { jobTitle }
  });
});

// @desc    حذف مسمى وظيفي
// @route   DELETE /api/job-titles/:id
// @access  Private (admin)
exports.deleteJobTitle = asyncHandler(async (req, res, next) => {
  const jobTitle = await JobTitle.findByIdAndDelete(req.params.id);

  if (!jobTitle) {
    return next(new ApiError('المسمى الوظيفي غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'تم حذف المسمى الوظيفي بنجاح'
  });
});
