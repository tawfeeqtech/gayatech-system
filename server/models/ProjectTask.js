const ProjectTaskSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  title: {
    type: String,
    required: true
  },
  description: String,
  
  // المسؤولون
  assignedTo: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    role: String
  }],
  
  // الحالة
  status: {
    type: String,
    enum: ['لم تبدأ', 'قيد التنفيذ', 'تحت المراجعة', 'مكتملة', 'ملغاة'],
    default: 'لم تبدأ'
  },
  
  // التواريخ
  startDate: Date,
  dueDate: Date,
  completedDate: Date,
  
  // الوقت
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // الأولوية
  priority: {
    type: String,
    enum: ['منخفضة', 'متوسطة', 'عالية', 'حرجة'],
    default: 'متوسطة'
  },
  
  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

ProjectTaskSchema.index({ project: 1, status: 1 });
ProjectTaskSchema.index({ assignedTo: 1, status: 1 });