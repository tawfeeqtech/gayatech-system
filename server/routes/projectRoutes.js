const express = require('express');
const bulkController = require('../controllers/bulkController');
const projectController = require('../controllers/projectController');
const projectTaskController = require('../controllers/projectTaskController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Project = require('../models/Project');

const router = express.Router();

router.use(protect);

router.post('/bulk-delete', roleCheck('admin'), bulkController.bulkDelete(Project));
router.post('/bulk-update', roleCheck('admin'), bulkController.bulkUpdate(Project));

// ⚠️ المسارات المستقلة أولاً (قبل `/:id`)
router.put('/tasks/:id', roleCheck('admin', 'pm'), projectTaskController.updateTask);
router.patch('/tasks/:id/status', roleCheck('admin', 'pm'), projectTaskController.updateTaskStatus);
router.delete('/tasks/:id', roleCheck('admin'), projectTaskController.deleteTask);

// مسارات المشاريع العامة
router.get('/', roleCheck('admin', 'pm'), projectController.getProjects);
router.post('/', roleCheck('admin', 'pm'), projectController.createProject);

// مسارات مشروع محدد
router.get('/:id', roleCheck('admin', 'pm'), projectController.getProject);
router.put('/:id', roleCheck('admin', 'pm'), projectController.updateProject);
router.patch('/:id/status', roleCheck('admin', 'pm'), projectController.updateProjectStatus);
router.delete('/:id', roleCheck('admin'), projectController.deleteProject);

// مسارات المهام داخل مشروع
router.get('/:id/tasks', roleCheck('admin', 'pm'), projectController.getProjectTasks);
router.post('/:projectId/tasks', roleCheck('admin', 'pm'), projectTaskController.createTask);

module.exports = router;