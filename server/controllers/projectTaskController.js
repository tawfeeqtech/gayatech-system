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
  
  if (task.assignedTo && task.assignedTo.length > 0) {
    for (const assignee of task.assignedTo) {
      if (assignee.employee) {
        await updateEmployeeStats(assignee.employee);
      }
    }
  }

  if (project.status === 'قيد التخطيط') {
    project.status = 'قيد التنفيذ';
    await project.save();
  }

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
  await autoUpdateProjectStatus(task.project);

  if (task.assignedTo && task.assignedTo.length > 0) {
    for (const assignee of task.assignedTo) {
      if (assignee.employee) {
        await updateEmployeeStats(assignee.employee);
      }
    }
  }

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

  const assignedEmployees = task.assignedTo?.map(a => a.employee) || [];

  const projectId = task.project;
  await ProjectTask.findByIdAndDelete(req.params.id);
  await updateProjectStats(projectId);

  for (const empId of assignedEmployees) {
    if (empId) await updateEmployeeStats(empId);
  }

  res.status(200).json({
    status: 'success',
    message: 'تم حذف المهمة بنجاح'
  });
});

// دالة مساعدة
const updateProjectStats = async (projectId) => {
  const Project = require('../models/Project');
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

const autoUpdateProjectStatus = async (projectId) => {
  const Project = require('../models/Project');
  const tasks = await ProjectTask.find({ project: projectId });
  
  const project = await Project.findById(projectId);
  if (!project) return;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'مكتملة').length;

  // إذا كل المهام مكتملة والمشروع لسه مش مكتمل
  if (totalTasks > 0 && completedTasks === totalTasks) {
    // المشروع كان قيد التنفيذ → تحول لمكتمل
    if (project.status === 'قيد التنفيذ' || project.status === 'تحت المراجعة') {
      project.status = 'مكتمل';
      project.actualDeliveryDate = new Date();
      project.computedStats.progressPercentage = 100;
      await project.save();
    }
  }
  // إذا في مهام مكتملة ولكن ليس الكل
  else if (completedTasks > 0 && completedTasks < totalTasks) {
    if (project.status === 'قيد التخطيط') {
      project.status = 'قيد التنفيذ';
      await project.save();
    }
  }
};

// 👈 أضف هذه الدالة
const updateEmployeeStats = async (employeeId) => {
  const Employee = require('../models/Employee');
  const ProjectTask = require('../models/ProjectTask');
  const Project = require('../models/Project');

  // عدد المهام الكلي والمكتمل
  const tasks = await ProjectTask.find({ 'assignedTo.employee': employeeId });
  const completedTasks = tasks.filter(t => t.status === 'مكتملة').length;
  const totalHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

  // عدد المشاريع النشطة
  const projects = await Project.find({
    'team.employee': employeeId,
    status: { $in: ['قيد التخطيط', 'قيد التنفيذ', 'تحت المراجعة'] }
  });

  await Employee.findByIdAndUpdate(employeeId, {
    computedStats: {
      totalProjects: projects.length + tasks.filter(t => t.status !== 'مكتملة').length,
      activeProjects: projects.length,
      totalTasks: tasks.length,
      completedTasks: completedTasks,
      totalHoursWorked: totalHours
    }
  });
};