const Salary = require('../models/Salary');
const Employee = require('../models/Employee');
const invoiceFactoryService = require('./invoiceFactoryService');
const deductionService = require('./deductionService');

const salaryService = {
  /**
   * توليد الرواتب الشهرية المفقودة للموظف
   */
  generateSalariesForEmployee: async (employeeId, userId) => {
    const employee = await Employee.findById(employeeId);
    if (!employee || employee.status !== 'نشط') return;

    const joiningDate = new Date(employee.joiningDate);
    const now = new Date();

    let currentMonth = new Date(joiningDate.getFullYear(), joiningDate.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const generated = [];

    while (currentMonth <= endMonth) {
      const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

      // التحقق من عدم وجود راتب مسبق
      const existing = await Salary.findOne({ employee: employeeId, month: monthStr });

      if (!existing) {
        // إنشاء الراتب
        const salary = new Salary({
          employee: employeeId,
          month: monthStr,
          baseAmount: employee.baseSalary,
          currency: employee.salaryCurrency,
          createdBy: userId
        });

        // تطبيق الخصومات (السلف)
        await deductionService.applyDeductions(salary);

        await salary.save();

        // إنشاء فاتورة للراتب
        const invoice = await invoiceFactoryService.createInvoice({
          type: 'راتب',
          amount: salary.totalAmount,
          currency: salary.currency,
          issueDate: new Date(),
          dueDate: new Date(),
          refId: salary._id,
          refModel: 'salary',
          recipientId: employeeId,
          recipientType: 'employee',
          description: `راتب شهر ${monthStr} - ${employee.name}`,
          userId
        });

        salary.invoice = invoice._id;
        await salary.save();

        generated.push(salary);
      }

      // الانتقال للشهر التالي
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    return generated;
  },

  /**
   * توليد الرواتب لجميع الموظفين النشطين
   */
  generateAllSalaries: async (userId) => {
    const employees = await Employee.find({
      status: 'نشط',
      autoGenerateSalary: { $ne: false }
    });
    let totalGenerated = 0;

    for (const emp of employees) {
      const gen = await salaryService.generateSalariesForEmployee(emp._id, userId);
      if (gen) totalGenerated += gen.length;
    }

    return totalGenerated;
  }
};

module.exports = salaryService;
