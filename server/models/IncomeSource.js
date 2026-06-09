const IncomeSourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
    // 'عقود شهرية', 'مشاريع', 'متجر سلة', 'استقطاب مشاريع', 'الشركاء', 'أخرى'
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  color: String,
  icon: String
}, { timestamps: true });