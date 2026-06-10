const ProjectTask = require('../models/ProjectTask');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    إضافة مهمة
// @route   POST /api/projects/:projectId/tasks
// @access  Private (admin, pm)
exports.createTask = asyncHandler(async (req, res, next) => {
  req.body.project = req.params.projectId;
  req.body.createdBy = req.user._id;

  const project = await Project.findById(req.params.projectId);
  if (!project) {
    return next(new ApiError('المشروع غير موجود', 404));
  }

  const task = await ProjectTask.create(req.body);

  // تحديث إحصائيات المشروع
  await updateProjectStats(req.params.projectId);

  res.status(201).json({
    status: 'success',
    data: { task }
  });
});

// @desc    تحديث مهمة
// @route   PUT /api/tasks/:id
// @access  Private (admin, pm)
exports.updateTask = asyncHandler(async (req, res, next) => {
  const task = await ProjectTask.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!task) {
    return next(new ApiError('المهمة غير موجودة', 404));
  }

  await updateProjectStats(task.project);

  res.status(200).json({
    status: 'success',
    data: { task }
  });
});

// @desc    تغيير حالة مهمة
// @route   PATCH /api/tasks/:id/status
// @access  Private (admin, pm)
exports.updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const updateData = { status };
  if (status === 'مكتملة') {
    updateData.completedDate = Date.now();
  }

  const task = await ProjectTask.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  if (!task) {
    return next(new ApiError('المهمة غير موجودة', 404));
  }

  await updateProjectStats(task.project);

  res.status(200).json({
    status: 'success',
    data: { task }
  });
});

// @desc    حذف مهمة
// @route   DELETE /api/tasks/:id
// @access  Private (admin)
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await ProjectTask.findById(req.params.id);

  if (!task) {
    return next(new ApiError('المهمة غير موجودة', 404));
  }

  const projectId = task.project;
  await ProjectTask.findByIdAndDelete(req.params.id);
  await updateProjectStats(projectId);

  res.status(200).json({
    status: 'success',
    message: 'تم حذف المهمة بنجاح'
  });
});

// دالة مساعدة
const updateProjectStats = async (projectId) => {
  const tasks = await ProjectTask.find({ project: projectId });

  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'مكتملة').length,
    totalHoursSpent: tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
  };
  stats.progressPercentage = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  await Project.findByIdAndUpdate(projectId, { computedStats: stats });
};