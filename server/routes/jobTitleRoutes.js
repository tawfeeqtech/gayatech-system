const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getJobTitles,
  createJobTitle,
  updateJobTitle,
  getAllServiceTypes,
  deleteJobTitle
} = require('../controllers/jobTitleController');

// GET /api/job-titles/service-types/all — all roles (للجميع يبغوا أنواع الخدمات)
router.get('/service-types/all', protect, getAllServiceTypes);

// GET /api/job-titles — admin, finance
router.get('/', protect, roleCheck('admin', 'finance'), getJobTitles);

// POST /api/job-titles — admin only
router.post('/', protect, roleCheck('admin'), createJobTitle);

// PUT /api/job-titles/:id — admin only
router.put('/:id', protect, roleCheck('admin'), updateJobTitle);

// DELETE /api/job-titles/:id — admin only
router.delete('/:id', protect, roleCheck('admin'), deleteJobTitle);

module.exports = router;
