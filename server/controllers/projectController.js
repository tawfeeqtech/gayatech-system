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

  let projects = await Project.find(filter)
    .populate('client', 'name company')
    .populate('team.employee', 'name jobTitle')
    .sort(req.query.sortBy || '-createdAt')
    .skip(skip)
    .limit(limit);

  // إخفاء البيانات المالية عن مدير المشاريع
  if (req.user.role === 'pm') {
    projects = projects.map(p => {
      const obj = p.toObject();
      delete obj.totalValue;
      delete obj.currency;
      delete obj.computedStats;
      return obj;
    });
  }

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

  // إخفاء البيانات المالية عن مدير المشاريع
  if (req.user.role === 'pm') {
    const obj = project.toObject();
    delete obj.totalValue;
    delete obj.currency;
    delete obj.computedStats;
    return res.status(200).json({
      status: 'success',
      data: { project: obj }
    });
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

  if (project.team && project.team.length > 0) {
    for (const member of project.team) {
      if (member.employee) {
        await updateEmployeeStatsForProject(member.employee);
      }
    }
  }

  const Client = require('../models/Client');
  const Contract = require('../models/Contract');

  const [allContracts, allProjects] = await Promise.all([
    Contract.find({ client: project.client }),
    Project.find({ client: project.client })
  ]);

  await Client.findByIdAndUpdate(project.client, {
    computedStats: {
      totalContracts: allContracts.length,
      activeContracts: allContracts.filter(c => c.status === 'نشط').length,
      totalProjects: allProjects.length,
      activeProjects: allProjects.filter(p => p.status === 'قيد التنفيذ').length,
    }
  });

  const { updateClientStats } = require('../services/clientStatsService');
  await updateClientStats(project.client);

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

  if (project.team && project.team.length > 0) {
    for (const member of project.team) {
      if (member.employee) {
        await updateEmployeeStatsForProject(member.employee);
      }
    }
  }
  const { updateClientStats } = require('../services/clientStatsService');
  await updateClientStats(project.client);

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
  const clientId = project.client;

  // حذف المهام المرتبطة
  await ProjectTask.deleteMany({ project: req.params.id });

  await Project.findByIdAndDelete(req.params.id);
  const { updateClientStats } = require('../services/clientStatsService');
  await updateClientStats(clientId);

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

const updateEmployeeStatsForProject = async (employeeId) => {
  const Employee = require('../models/Employee');
  const Project = require('../models/Project');
  const ProjectTask = require('../models/ProjectTask');

  const projects = await Project.find({
    'team.employee': employeeId,
    status: { $in: ['قيد التخطيط', 'قيد التنفيذ', 'تحت المراجعة'] }
  });

  const tasks = await ProjectTask.find({ 'assignedTo.employee': employeeId });
  const completedTasks = tasks.filter(t => t.status === 'مكتملة').length;
  const totalHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

  await Employee.findByIdAndUpdate(employeeId, {
    computedStats: {
      activeProjects: projects.length,
      totalProjects: projects.length,
      totalTasks: tasks.length,
      completedTasks: completedTasks,
      totalHoursWorked: totalHours
    }
  });
};