const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Currency = require('../models/Currency');

// العملات الافتراضية الموحدة للنظام
// (نفس القائمة الحالية في client/src/utils/constants.js)
const currencies = [
  { code: 'USD', nameAr: 'دولار', symbol: '$', sortOrder: 1, isActive: true },
  { code: 'ILS', nameAr: 'شيكل', symbol: '₪', sortOrder: 2, isActive: true },
  { code: 'SAR', nameAr: 'ريال', symbol: '﷼', sortOrder: 3, isActive: true },
  { code: 'JOD', nameAr: 'دينار', symbol: 'د.أ', sortOrder: 4, isActive: true },
  { code: 'EUR', nameAr: 'يورو', symbol: '€', sortOrder: 5, isActive: true },
];

const seedCurrencies = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/gayatech_system';
    console.log('📡 Connecting to database...');
    await mongoose.connect(connStr);
    console.log('✅ Connected\n');

    console.log('💰 Seeding currencies (upsert)...');
    for (const c of currencies) {
      await Currency.findOneAndUpdate(
        { code: c.code },
        { $set: c },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`   ✅ ${c.code} - ${c.nameAr}`);
    }

    const total = await Currency.countDocuments();
    console.log(`\n🎉 Done. Total currencies: ${total}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding currencies:', error);
    process.exit(1);
  }
};

// السماح بالتشغيل المباشر: node seed/seedCurrencies.js
if (require.main === module) {
  seedCurrencies();
}

module.exports = seedCurrencies;
