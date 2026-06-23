const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getJobTitles,
  createJobTitle,
  deleteJobTitle
} = require('../controllers/jobTitleController');

// GET /api/job-titles — admin, finance
router.get('/', protect, roleCheck('admin', 'finance'), getJobTitles);

// POST /api/job-titles — admin only
router.post('/', protect, roleCheck('admin'), createJobTitle);

// DELETE /api/job-titles/:id — admin only
router.delete('/:id', protect, roleCheck('admin'), deleteJobTitle);

module.exports = router;
