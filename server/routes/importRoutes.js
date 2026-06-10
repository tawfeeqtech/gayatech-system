const express = require('express');
const multer = require('multer');
const path = require('path');
const ic = require('../controllers/importController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
router.use(protect);

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads', 'imports'),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.post('/:type', roleCheck('admin', 'finance'), upload.single('file'), ic.importData);
router.get('/template/:type', roleCheck('admin', 'finance'), ic.downloadTemplate);

module.exports = router;