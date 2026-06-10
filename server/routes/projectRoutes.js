const express = require('express');
const projectController = require('../controllers/projectController');
const projectTaskController = require('../controllers/projectTaskController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

// مسارات المشاريع
router.get('/', roleCheck('admin', 'finance', 'pm'), projectController.getProjects);
router.get('/:id', roleCheck('admin', 'finance', 'pm'), projectController.getProject);
router.post('/', roleCheck('admin', 'pm'), projectController.createProject);
router.put('/:id', roleCheck('admin', 'pm'), projectController.updateProject);
router.patch('/:id/status', roleCheck('admin', 'pm'), projectController.updateProjectStatus);
router.delete('/:id', roleCheck('admin'), projectController.deleteProject);

// مسارات المهام (داخل المشاريع)
router.get('/:id/tasks', roleCheck('admin', 'pm'), projectController.getProjectTasks);
router.post('/:projectId/tasks', roleCheck('admin', 'pm'), projectTaskController.createTask);

// مسارات المهام (مستقلة)
router.put('/tasks/:id', roleCheck('admin', 'pm'), projectTaskController.updateTask);
router.patch('/tasks/:id/status', roleCheck('admin', 'pm'), projectTaskController.updateTaskStatus);
router.delete('/tasks/:id', roleCheck('admin'), projectTaskController.deleteTask);

module.exports = router;