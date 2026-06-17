const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم المزود مطلوب'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'التصنيف مطلوب']
    // مثال: 'أدوات مكتبية', 'خدمات سحابية', 'أثاث'
  },
  email: String,
  phone: String,
  address: {
    city: String,
    street: String,
    country: {
      type: String,
      default: 'فلسطين'
    }
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vendor', VendorSchema);
