const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم الدولة مطلوب'],
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

countrySchema.virtual('cities', {
  ref: 'City',
  localField: '_id',
  foreignField: 'country',
});

module.exports = mongoose.model('Country', countrySchema);
