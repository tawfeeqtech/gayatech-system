const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false  // لا يعاد في الاستعلامات
  },
  
  // الملف الشخصي
  fullName: {
    type: String,
    required: true
  },
  avatar: String,
  
  // الدور
  role: {
    type: String,
    enum: ['admin', 'finance', 'pm', 'accountant', 'employee'],
    required: true
  },
  
  // الصلاحيات المخصصة (توسيع)
  permissions: {
    canDeleteInvoices: { type: Boolean, default: false },
    canImportData: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canExportReports: { type: Boolean, default: true },
    canViewFinancialReports: { type: Boolean, default: false }
  },
  
  // الحالة
  isActive: {
    type: Boolean,
    default: true
  },
  
  // الموظف المرتبط
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  
  // الأمان
  lastLogin: Date,
  refreshToken: String,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // الإعدادات الشخصية
  preferences: {
    language: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar'
    },
    defaultCurrency: {
      type: String,
      default: 'USD'
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
