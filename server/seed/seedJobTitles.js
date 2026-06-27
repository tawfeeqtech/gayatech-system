/**
 * Seed script — إضافة المسميات الوظيفية الافتراضية
 * شغّل: node server/seed/seedJobTitles.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const JobTitle = require('../models/JobTitle');

const defaultJobTitles = [
  'مستقطب مشاريع',
  'تصميم ومونتاج',
  'تصميم متاجر',
  'ادارة متاجر',
  'ادارة حملات اعلانية',
  'مصمم جرافيك',
  'مسوقين',
  'مبرمجين',
  'مونتاج',
  'ادارة صفحات',
  'مصورين',
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gayatech');
    console.log('✅ متصل بقاعدة البيانات');
    
    let created = 0;
    for (const name of defaultJobTitles) {
      const existing = await JobTitle.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
      if (!existing) {
        await JobTitle.create({ name, createdBy: null });
        console.log(`   ✅ ${name}`);
        created++;
      } else {
        console.log(`   ⏭️  ${name} — موجود مسبقاً`);
      }
    }
    
    console.log(`\n📊 تمت إضافة ${created} مسمى وظيفي جديد من أصل ${defaultJobTitles.length}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

seed();
