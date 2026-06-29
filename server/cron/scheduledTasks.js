/**
 * جدولة المهام التلقائية
 * - توليد الرواتب الشهرية تلقائياً
 * - يعمل عند بدء التشغيل، ثم كل 24 ساعة
 */
const salaryService = require('../services/salaryService');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function runSalaryGeneration() {
  console.log('[Cron] بدء توليد الرواتب التلقائي - ' + new Date().toISOString());
  try {
    const count = await salaryService.generateAllSalaries(null);
    console.log('[Cron] تم إنشاء ' + count + ' راتب/مرتب');
  } catch (err) {
    console.error('[Cron] خطأ في توليد الرواتب:', err.message);
  }
}

// تشغيل فوري عند بدء التشغيل (للأشهر الفائتة)
runSalaryGeneration();

// جدولة كل 24 ساعة
setInterval(runSalaryGeneration, ONE_DAY_MS);

console.log('[Cron] تم تشغيل جدولة المهام التلقائية (كل 24 ساعة)');

module.exports = { runSalaryGeneration };
