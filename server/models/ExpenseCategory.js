const ExpenseCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
    // مثال: 'رواتب', 'إيجارات', 'كهرباء', 'إنترنت', 'رسوم حكومية', 'تسويق'
  },
  description: String,
  icon: String,  // أيقونة للتصنيف
  color: String, // لون للتمييز في التقارير
  isActive: {
    type: Boolean,
    default: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseCategory'
    // للتصنيفات الفرعية
  }
}, {
  timestamps: true
});