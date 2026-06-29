// سيد أنواع الخدمات الافتراضية للمسميات الوظيفية
const mongoose = require('mongoose');
const JobTitle = require('../models/JobTitle');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gayatech';

const defaultJobTitles = [
  {
    name: 'مبرمج',
    serviceTypes: ['تطوير مواقع', 'تطوير تطبيقات', 'برمجة', 'صيانة تقنية', 'تطوير أنظمة']
  },
  {
    name: 'مصمم جرافيك',
    serviceTypes: ['تصميم جرافيك', 'تصميم هوية بصرية', 'تصميم شعارات', 'تصميم مطبوعات', 'تصميم واجهات']
  },
  {
    name: 'مسوق رقمي',
    serviceTypes: ['تسويق رقمي', 'إدارة مواقع', 'إدارة سوشال ميديا', 'إعلانات ممولة', 'تحسين محركات بحث', 'كتابة محتوى']
  },
  {
    name: 'مدير مشروع',
    serviceTypes: ['استشارات', 'إدارة مشاريع', 'تدقيق', 'تخطيط استراتيجي']
  },
  {
    name: 'محلل بيانات',
    serviceTypes: ['تحليل بيانات', 'تقارير', 'ذكاء أعمال', 'لوحات تحكم']
  },
  {
    name: 'محاسب',
    serviceTypes: ['تدقيق مالي', 'محاسبة', 'إعداد ميزانيات', 'تقارير مالية']
  },
  {
    name: 'مدخل بيانات',
    serviceTypes: ['إدخال بيانات', 'أرشفة', 'تنظيم ملفات']
  },
  {
    name: 'مهندس شبكات',
    serviceTypes: ['صيانة شبكات', 'تركيب شبكات', 'أمن سيبراني', 'استضافة']
  }
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ متصل بقاعدة البيانات');

  for (const jt of defaultJobTitles) {
    const existing = await JobTitle.findOne({ name: jt.name });
    if (existing) {
      if (!existing.serviceTypes || existing.serviceTypes.length === 0) {
        existing.serviceTypes = jt.serviceTypes;
        await existing.save();
        console.log(`🔄 تحديث: ${jt.name} (${jt.serviceTypes.length} أنواع خدمات)`);
      } else {
        console.log(`⏭️ موجود مسبقاً: ${jt.name}`);
      }
    } else {
      await JobTitle.create({ name: jt.name, serviceTypes: jt.serviceTypes });
      console.log(`✅ إنشاء: ${jt.name} (${jt.serviceTypes.length} أنواع خدمات)`);
    }
  }

  console.log('🏁 تم!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
