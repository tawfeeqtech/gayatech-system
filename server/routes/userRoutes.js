const express = require('express');
const uc = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();
router.use(protect);

router.get('/', roleCheck('admin'), uc.getUsers);
router.get('/:id', roleCheck('admin'), uc.getUser);
router.post('/', roleCheck('admin'), uc.createUser);
router.put('/:id', roleCheck('admin'), uc.updateUser);
router.delete('/:id', roleCheck('admin'), uc.deleteUser);
router.patch('/:id/role', roleCheck('admin'), uc.updateUserRole);
router.patch('/:id/permissions', roleCheck('admin'), uc.updateUserPermissions);
router.patch('/:id/activate', roleCheck('admin'), uc.toggleUserStatus);

module.exports = router;