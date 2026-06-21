const express = require('express');
const sc = require('../controllers/salaryController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();
router.use(protect);

router.get('/me', roleCheck('admin', 'finance', 'employee'), sc.getMySalary);

router.get('/pending', roleCheck('admin', 'finance'), sc.getPendingSalaries);
router.get('/', roleCheck('admin', 'finance'), sc.getSalaries);
router.post('/generate', roleCheck('admin'), sc.generateMonthlySalaries);
router.post('/', roleCheck('admin', 'finance'), sc.createSalary);
router.put('/:id', roleCheck('admin'), sc.updateSalary);
router.delete('/:id', roleCheck('admin'), sc.deleteSalary);

module.exports = router;
