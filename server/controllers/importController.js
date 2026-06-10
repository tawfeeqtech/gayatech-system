const ExcelJS = require('exceljs');
const Client = require('../models/Client');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const Project = require('../models/Project');
const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const path = require('path');
const fs = require('fs');

// نماذج الاستيراد
const importHandlers = {
  clients: {
    model: Client,
    fields: ['name', 'company', 'email', 'phone', 'clientType', 'status', 'notes'],
    required: ['name']
  },
  employees: {
    model: Employee,
    fields: ['name', 'email', 'phone', 'jobTitle', 'department', 'baseSalary', 'salaryCurrency', 'joiningDate'],
    required: ['name', 'jobTitle']
  },
  contracts: {
    model: Contract,
    fields: ['client', 'title', 'serviceType', 'defaultMonthlyValue', 'currency', 'startDate', 'status'],
    required: ['client', 'title', 'defaultMonthlyValue']
  },
  projects: {
    model: Project,
    fields: ['client', 'title', 'serviceType', 'totalValue', 'currency', 'startDate', 'deliveryDate', 'status'],
    required: ['client', 'title', 'totalValue']
  },
  transactions: {
    model: Transaction,
    fields: ['type', 'amount', 'currency', 'transactionDate', 'description', 'paymentMethod', 'status'],
    required: ['type', 'amount', 'transactionDate']
  },
  expenses: {
    model: Expense,
    fields: ['category', 'amount', 'currency', 'expenseDate', 'description', 'vendor'],
    required: ['amount', 'expenseDate', 'description']
  }
};

// @desc    استيراد بيانات
// @route   POST /api/import/:type
exports.importData = asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  const handler = importHandlers[type];

  if (!handler) {
    return next(new ApiError('نوع الاستيراد غير صالح', 400));
  }

  if (!req.file) {
    return next(new ApiError('يرجى رفع ملف Excel', 400));
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(req.file.path);

  const worksheet = workbook.worksheets[0];
  const rows = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // تخطي الصف الأول (العناوين)

    const rowData = {};
    row.values.forEach((value, index) => {
      if (index > 0 && handler.fields[index - 1]) {
        rowData[handler.fields[index - 1]] = value;
      }
    });
    rows.push(rowData);
  });

  // التحقق من البيانات
  const errors = [];
  const validRows = [];

  rows.forEach((row, index) => {
    const rowErrors = [];
    handler.required.forEach(field => {
      if (!row[field]) {
        rowErrors.push(`الحقل "${field}" مطلوب`);
      }
    });

    if (rowErrors.length > 0) {
      errors.push({ row: index + 2, errors: rowErrors });
    } else {
      row.createdBy = req.user._id;
      validRows.push(row);
    }
  });

  // إدراج البيانات الصالحة
  let inserted = 0;
  if (validRows.length > 0) {
    const result = await handler.model.insertMany(validRows, { ordered: false });
    inserted = result.length;
  }

  // حذف الملف المؤقت
  fs.unlinkSync(req.file.path);

  res.status(200).json({
    status: 'success',
    data: {
      total: rows.length,
      inserted,
      errors: errors.length,
      errorDetails: errors
    }
  });
});

// @desc    تحميل قالب استيراد
// @route   GET /api/import/template/:type
exports.downloadTemplate = asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  const handler = importHandlers[type];

  if (!handler) {
    return next(new ApiError('نوع القالب غير صالح', 400));
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  // العناوين
  const headers = handler.fields.map(f => {
    if (handler.required.includes(f)) return `${f} *`;
    return f;
  });
  worksheet.addRow(headers);

  // تنسيق العناوين
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
  headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // مثال صف
  const exampleRow = [];
  handler.fields.forEach(f => {
    if (f === 'name') exampleRow.push('مثال: شركة التقنية');
    else if (f === 'clientType') exampleRow.push('شركة');
    else if (f === 'status') exampleRow.push('نشط');
    else if (f === 'currency') exampleRow.push('USD');
    else if (f === 'type') exampleRow.push('دخل');
    else if (f.includes('Date')) exampleRow.push('2026-01-01');
    else if (f === 'amount' || f.includes('Value') || f.includes('Salary')) exampleRow.push(1000);
    else exampleRow.push('');
  });
  worksheet.addRow(exampleRow);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=template_${type}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});