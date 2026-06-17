const Advance = require('../models/Advance');

const deductionService = {
  /**
   * البحث عن السلف النشطة وتطبيق الأقساط على الراتب
   */
  applyDeductions: async (salary) => {
    // جلب السلف التي لم تسدد بالكامل للموظف وتعتمد الخصم من الراتب
    const pendingAdvances = await Advance.find({
      employee: salary.employee,
      status: { $in: ['موافق عليها', 'مسددة جزئياً'] },
      repaymentMethod: { $in: ['خصم من الراتب', 'أقساط'] }
    }).populate('invoice');

    for (const advance of pendingAdvances) {
      let deductionAmount = 0;

      if (advance.repaymentMethod === 'أقساط' && advance.installmentAmount > 0) {
        deductionAmount = Math.min(advance.installmentAmount, advance.remainingAmount);
      } else if (advance.repaymentMethod === 'خصم من الراتب') {
        // إذا كان يخصم كاملاً من أول راتب
        deductionAmount = advance.remainingAmount;
      }

      if (deductionAmount > 0) {
        // التحقق من أن صافي الراتب لن يصبح سالباً بشكل مبالغ فيه (حسب طلب المستخدم: تجاهل القسط إذا كان الصافي أقل)
        const currentNet = salary.baseAmount - (salary.deductions || 0) + (salary.bonuses || 0);

        if (currentNet >= deductionAmount) {
          // إضافة بند الخصم للراتب
          salary.deductionItems.push({
            amount: deductionAmount,
            reason: `قسط من سلفة ${advance.invoice?.invoiceNumber || advance._id}`,
            advance: advance._id
          });

          // تحديث السلفة
          advance.deductions.push({
            salary: salary._id,
            amount: deductionAmount,
            date: new Date()
          });

          advance.repaidAmount += deductionAmount;
          await advance.save();
        }
      }
    }
  }
};

module.exports = deductionService;
