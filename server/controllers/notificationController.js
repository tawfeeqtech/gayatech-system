const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

exports.getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id, dismissed: false };

  const notifications = await Notification.find(filter)
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ ...filter, read: false });

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    total,
    unreadCount,
    page,
    totalPages: Math.ceil(total / limit),
    data: { notifications }
  });
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    read: false,
    dismissed: false
  });

  res.status(200).json({ status: 'success', data: { unreadCount: count } });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    read: true,
    readAt: new Date()
  });

  res.status(200).json({ status: 'success', message: 'تم تعليم الإشعار كمقروء' });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true, readAt: new Date() }
  );

  res.status(200).json({ status: 'success', message: 'تم تعليم جميع الإشعارات كمقروءة' });
});

exports.dismissNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { dismissed: true });

  res.status(200).json({ status: 'success', message: 'تم تجاهل الإشعار' });
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);

  res.status(200).json({ status: 'success', message: 'تم حذف الإشعار' });
});