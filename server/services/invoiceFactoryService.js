const Invoice = require('../models/Invoice');

/**
 * خدمة مركزية لإنشاء الفواتير لأنواع السجلات المختلفة
 */
const invoiceFactoryService = {
  /**
   * إنشاء فاتورة لسجل معين
   * @param {Object} params
   * @param {string} params.type - نوع الفاتورة (راتب، سلفة، مصروف، اشتراك، مشروع)
   * @param {number} params.amount - المبلغ الإجمالي
   * @param {string} params.currency - العملة
   * @param {Date} params.dueDate - تاريخ الاستحقاق
   * @param {Date} params.issueDate - تاريخ الإصدار (اختياري، الافتراضي الآن)
   * @param {string} params.refId - معرف السجل المرتبط (salaryId, expenseId, etc)
   * @param {string} params.refModel - اسم الحقل المرجعي في موديل الفاتورة (salary, expense, etc)
   * @param {string} params.recipientId - معرف المستلم (employeeId, vendorId, clientId)
   * @param {string} params.recipientType - نوع المستلم (employee, vendor, client)
   * @param {string} params.description - وصف الفاتورة
   * @param {string} params.userId - معرف المستخدم المنشئ
   */
  createInvoice: async (params) => {
    const {
      type,
      amount,
      currency,
      dueDate,
      issueDate = new Date(),
      refId,
      refModel,
      recipientId,
      recipientType,
      description,
      userId
    } = params;

    const invoiceData = {
      invoiceType: type,
      totalAmount: amount,
      currency: currency || 'USD',
      issueDate,
      dueDate: dueDate || issueDate,
      items: [{
        description: description || `فاتورة ${type}`,
        quantity: 1,
        unitPrice: amount,
        totalPrice: amount
      }],
      status: 'مصدرة', // الفواتير التلقائية تعتبر مصدرة فوراً
      createdBy: userId,
      [refModel]: refId,
      [recipientType]: recipientId
    };

    return await Invoice.create(invoiceData);
  }
};

module.exports = invoiceFactoryService;
