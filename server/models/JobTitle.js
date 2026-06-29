const mongoose = require('mongoose');

const JobTitleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم المسمى الوظيفي مطلوب'],
    unique: true,
    trim: true
  },
  serviceTypes: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('JobTitle', JobTitleSchema);
