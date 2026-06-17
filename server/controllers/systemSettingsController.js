const SystemSettings = require('../models/SystemSettings');
const asyncHandler = require('../utils/asyncHandler');

exports.getSettings = asyncHandler(async (req, res) => {
  let settings = await SystemSettings.findOne()
    .populate('defaultExpenseAccount', 'name')
    .populate('defaultExpenseWallet', 'name currency');

  if (!settings) {
    settings = await SystemSettings.create({});
  }

  res.status(200).json({ status: 'success', data: { settings } });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  req.body.updatedBy = req.user._id;

  let settings = await SystemSettings.findOne();

  if (!settings) {
    settings = await SystemSettings.create(req.body);
  } else {
    settings = await SystemSettings.findOneAndUpdate({}, req.body, {
      new: true,
      runValidators: true
    });
  }

  res.status(200).json({ status: 'success', data: { settings } });
});
