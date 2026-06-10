const Project = require('../models/Project');
const ProjectTask = require('../models/ProjectTask');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    الحصول على جميع المشاريع
// @route   GET /api/projects
// @access  Private
exports.getProjects = asyncHandler(async (req, res, next) => {
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.client) filter.client = req.query.client;
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { serviceType: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const projects = await Project.find(filter)
    .populate('client', 'name company')
    .populate('team.employee', 'name jobTitle')
    .sort(req.query.sortBy || '-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Project.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: projects.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: { projects }
  });
});

// @desc    الحصول على مشروع واحد
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('client', 'name company email phone')
    .populate('team.employee', 'name jobTitle');

  if (!project) {
    return next(new ApiError('المشروع غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { project }
  });
});

// @desc    إضافة مشروع جديد
// @route   POST /api/projects
// @access  Private (admin, pm)
exports.createProject = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  const project = await Project.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { project }
  });
});

// @desc    تحديث مشروع
// @route   PUT /api/projects/:id
// @access  Private (admin, pm)
exports.updateProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!project) {
    return next(new ApiError('المشروع غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { project }
  });
});

// @desc    تغيير حالة المشروع
// @route   PATCH /api/projects/:id/status
// @access  Private (admin, pm)
exports.updateProjectStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!project) {
    return next(new ApiError('المشروع غير موجود', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { project }
  });
});

// @desc    حذف مشروع
// @route   DELETE /api/projects/:id
// @access  Private (admin)
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new ApiError('المشروع غير موجود', 404));
  }

  // حذف المهام المرتبطة
  await ProjectTask.deleteMany({ project: req.params.id });

  await Project.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف المشروع وجميع المهام المرتبطة به'
  });
});

// @desc    الحصول على مهام المشروع
// @route   GET /api/projects/:id/tasks
// @access  Private
exports.getProjectTasks = asyncHandler(async (req, res, next) => {
  const tasks = await ProjectTask.find({ project: req.params.id })
    .populate('assignedTo.employee', 'name jobTitle')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: { tasks }
  });
});