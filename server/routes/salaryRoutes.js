const express = require('express');
const sc = require('../controllers/salaryController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();
router.use(protect);

router.get('/pending', roleCheck('admin', 'finance'), sc.getPendingSalaries);
router.get('/', roleCheck('admin', 'finance'), sc.getSalaries);
router.post('/', roleCheck('admin', 'finance'), sc.createSalary);
router.put('/:id', roleCheck('admin'), sc.updateSalary);
router.delete('/:id', roleCheck('admin'), sc.deleteSalary);
router.patch('/:id/pay', roleCheck('admin', 'finance'), sc.paySalary);

module.exports = router;