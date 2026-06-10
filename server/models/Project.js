const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  // رقم المشروع
  projectNumber: {
    type: String,
    unique: true,
    sparse: true 
    // مثال: PROJ-2026-0001
  },
  
  // العلاقات
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  
  // معلومات المشروع
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 3000
  },
  serviceType: {
    type: String,
    required: true
  },
  
  // القيمة المالية
  totalValue: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['USD', 'ILS', 'SAR', 'JOD', 'EUR'],
    default: 'USD'
  },
  
  // التواريخ
  startDate: {
    type: Date,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  actualDeliveryDate: {
    type: Date
  },
  
  // حالة المشروع
  status: {
    type: String,
    enum: [
      'قيد التخطيط',
      'قيد التنفيذ',
      'تحت المراجعة',
      'مكتمل',
      'تم التسليم',
      'متوقف',
      'ملغي'
    ],
    default: 'قيد التخطيط'
  },
  
  // حالة التسليم
  deliveryStatus: {
    type: String,
    enum: ['لم يبدأ', 'قيد التسليم', 'تم التسليم', 'مقبول', 'مرفوض'],
    default: 'لم يبدأ'
  },
  
  // الدفعات
  paymentType: {
    type: String,
    enum: ['دفعة واحدة', 'مرحلي', 'حسب الإنجاز', 'شهري'],
    default: 'دفعة واحدة'
  },
  
  // الفريق
  team: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    role: String,
    startDate: Date,
    endDate: Date
  }],
  
  // مؤشرات محسوبة
  computedStats: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0 },
    totalInvoiced: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalRemaining: { type: Number, default: 0 },
    totalHoursSpent: { type: Number, default: 0 }
  },
  
  // فواتير المشروع
  invoices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }],
  
  notes: String,
  tags: [String],
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

ProjectSchema.index({ client: 1, status: 1 });
ProjectSchema.index({ deliveryDate: 1, status: 1 });

ProjectSchema.pre('save', async function(next) {
  if (this.isNew && !this.projectNumber) {
    try {
      const year = this.startDate ? this.startDate.getFullYear() : new Date().getFullYear();
      
      // ابحث عن آخر مشروع له رقم في هذه السنة
      const lastProject = await this.constructor.findOne({
        projectNumber: new RegExp(`^PROJ-${year}-`)
      }).sort({ projectNumber: -1 });
      
      let nextNumber = 1;
      if (lastProject && lastProject.projectNumber) {
        const parts = lastProject.projectNumber.split('-');
        nextNumber = parseInt(parts[parts.length - 1]) + 1;
      }
      
      this.projectNumber = `PROJ-${year}-${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      // إذا فشل التوليد، استخدم timestamp
      this.projectNumber = `PROJ-${Date.now()}`;
    }
  }
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
