const express = require('express');
const nc = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);

router.get('/unread-count', nc.getUnreadCount);
router.get('/', nc.getNotifications);
router.patch('/read-all', nc.markAllAsRead);
router.patch('/:id/read', nc.markAsRead);
router.patch('/:id/dismiss', nc.dismissNotification);
router.delete('/:id', nc.deleteNotification);

module.exports = router;