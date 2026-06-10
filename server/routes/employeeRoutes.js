const express = require('express');
const employeeController = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router.get('/', roleCheck('admin', 'finance', 'pm'), employeeController.getEmployees);
router.get('/:id', roleCheck('admin', 'finance', 'pm'), employeeController.getEmployee);
router.post('/', roleCheck('admin'), employeeController.createEmployee);
router.put('/:id', roleCheck('admin'), employeeController.updateEmployee);
router.patch('/:id/status', roleCheck('admin'), employeeController.updateEmployeeStatus);
router.delete('/:id', roleCheck('admin'), employeeController.deleteEmployee);

module.exports = router;