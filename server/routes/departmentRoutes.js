const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  deleteDepartment
} = require('../controllers/departmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getDepartments)
  .post(createDepartment);

router
  .route('/:id')
  .delete(deleteDepartment);

module.exports = router;
