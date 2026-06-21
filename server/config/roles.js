/**
 * نظام الصلاحيات - Gayatech System
 * تعريف صلاحيات كل دور على حدة
 */

// أسماء الأدوار بالعربية
const ROLE_NAMES = {
  admin: 'مدير النظام',
  finance: 'مدير مالي',
  pm: 'مدير مشاريع',
  accountant: 'محاسب',
  employee: 'موظف'
};

// وحدات النظام (modules)
const MODULES = {
  DASHBOARD: 'dashboard',
  CLIENTS: 'clients',
  CONTRACTS: 'contracts',
  PROJECTS: 'projects',
  TRANSACTIONS: 'transactions',
  INVOICES: 'invoices',
  EXPENSES: 'expenses',
  VENDORS: 'vendors',
  ACCOUNTS: 'accounts',
  WALLETS: 'wallets',
  EMPLOYEES: 'employees',
  SALARIES: 'salaries',
  ADVANCES: 'advances',
  PARTNERS: 'partners',
  SUBSCRIPTIONS: 'subscriptions',
  CURRENCY_EXCHANGE: 'currencyExchange',
  REPORTS: 'reports',
  IMPORT: 'import',
  SETTINGS: 'settings',
  USERS: 'users',
  CURRENCIES: 'currencies'
};

// الصلاحيات: VIEW | CREATE | EDIT | DELETE
// لكل وحدة، نحدد الأدوار المسموح لها بكل عملية
const ROLE_PERMISSIONS = {
  // مدير النظام - كل شيء
  admin: {
    modules: Object.values(MODULES),
    canDelete: true,
    canManageUsers: true,
    canSeeFinancialData: true,
    canSeeSalaries: true,
    canSeeProjects: true
  },

  // مدير مالي - فواتير، مصاريف، حسابات، معاملات
  finance: {
    modules: [
      MODULES.DASHBOARD,
      MODULES.TRANSACTIONS,
      MODULES.INVOICES,
      MODULES.EXPENSES,
      MODULES.VENDORS,
      MODULES.ACCOUNTS,
      MODULES.WALLETS,
      MODULES.CURRENCY_EXCHANGE,
      MODULES.REPORTS,
      MODULES.SUBSCRIPTIONS
    ],
    canDelete: false,
    canManageUsers: false,
    canSeeFinancialData: true,
    canSeeSalaries: false,
    canSeeProjects: false
  },

  // مدير مشاريع - عملاء، عقود، مشاريع فقط (بدون أرقام مالية)
  pm: {
    modules: [
      MODULES.DASHBOARD,
      MODULES.CLIENTS,
      MODULES.CONTRACTS,
      MODULES.PROJECTS,
      MODULES.EMPLOYEES,
      MODULES.REPORTS  // تقارير غير مالية فقط
    ],
    canDelete: false,
    canManageUsers: false,
    canSeeFinancialData: false,
    canSeeSalaries: false,
    canSeeProjects: true
  },

  // محاسب - فواتير ومصاريف فقط، لا يحذف
  accountant: {
    modules: [
      MODULES.DASHBOARD,
      MODULES.INVOICES,
      MODULES.EXPENSES,
      MODULES.VENDORS,
      MODULES.ACCOUNTS,
      MODULES.WALLETS
    ],
    canDelete: false,
    canManageUsers: false,
    canSeeFinancialData: true,
    canSeeSalaries: false,
    canSeeProjects: false
  },

  // موظف - راتبه ومهامه فقط
  employee: {
    modules: [
      MODULES.DASHBOARD,
      MODULES.SALARIES
    ],
    canDelete: false,
    canManageUsers: false,
    canSeeFinancialData: false,
    canSeeSalaries: true,
    canSeeProjects: false
  }
};

// دالة مساعدة للتحقق من صلاحية الوحدة
function hasModuleAccess(role, module) {
  const config = ROLE_PERMISSIONS[role];
  if (!config) return false;
  return config.modules.includes(module);
}

// دالة مساعدة للتحقق من صلاحية الحذف
function canDelete(role) {
  const config = ROLE_PERMISSIONS[role];
  return config?.canDelete === true;
}

module.exports = {
  ROLE_NAMES,
  MODULES,
  ROLE_PERMISSIONS,
  hasModuleAccess,
  canDelete
};
