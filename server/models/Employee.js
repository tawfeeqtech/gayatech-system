const EmployeeSchema = new mongoose.Schema({
  // المعلومات الأساسية
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true
  },
  phone: String,
  
  // الوظيفة
  jobTitle: {
    type: String,
    required: true
  },
  department: String,
  
  // الراتب
  baseSalary: {
    type: Number,
    required: true,
    min: 0
  },
  salaryCurrency: {
    type: String,
    enum: ['USD', 'ILS', 'SAR', 'JOD', 'EUR'],
    default: 'USD'
  },
  
  // التواريخ
  joiningDate: {
    type: Date,
    required: true
  },
  leavingDate: Date,
  
  // الحالة
  status: {
    type: String,
    enum: ['نشط', 'إجازة', 'متوقف', 'مستقيل', 'مفصول'],
    default: 'نشط'
  },
  
  // حساب المستخدم (إذا كان لديه دخول للنظام)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // مؤشرات محسوبة
  computedStats: {
    totalProjects: { type: Number, default: 0 },
    activeProjects: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    totalHoursWorked: { type: Number, default: 0 },
    totalSalariesReceived: { type: Number, default: 0 },
    totalAdvances: { type: Number, default: 0 },
    pendingAdvances: { type: Number, default: 0 }
  },
  
  // المهارات
  skills: [String],
  
  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ name: 1 });