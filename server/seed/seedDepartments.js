/**
 * Seed script — إضافة الأقسام الافتراضية
 * شغّل: node server/seed/seedDepartments.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Department = require('../models/Department');

const defaultDepartments = [
  'ادارة', 'تقنية', 'تسويق', 'مبيعات', 'تصميم',
  'محاسبة', 'موارد بشرية', 'خدمة عملاء', 'مشتريات',
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gayatech');
    console.log('✅ متصل بقاعدة البيانات');
    
    let created = 0;
    for (const name of defaultDepartments) {
      const existing = await Department.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
      if (!existing) {
        await Department.create({ name, createdBy: null });
        console.log(`   ✅ ${name}`);
        created++;
      } else {
        console.log(`   ⏭️  ${name} — موجود مسبقاً`);
      }
    }
    
    console.log(`\n📊 تمت إضافة ${created} قسم جديد من أصل ${defaultDepartments.length}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

seed();
