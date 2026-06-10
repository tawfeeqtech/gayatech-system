// الصلاحيات حسب الدور
const rolePermissions = {
  admin: {
    canViewAll: true,
    canEditAll: true,
    canDeleteAll: true,
    canManageUsers: true,
    canViewFinancial: true,
    canEditFinancial: true,
    canExport: true,
    canImport: true,
    canManageSettings: true,
  },
  finance: {
    canViewAll: true,
    canEditAll: false,
    canDeleteAll: false,
    canManageUsers: false,
    canViewFinancial: true,
    canEditFinancial: true,
    canExport: true,
    canImport: true,
    canManageSettings: false,
  },
  pm: {
    canViewAll: false,
    canEditAll: false,
    canDeleteAll: false,
    canManageUsers: false,
    canViewFinancial: false,
    canEditFinancial: false,
    canExport: true,
    canImport: false,
    canManageSettings: false,
    canManageClients: true,
    canManageProjects: true,
    canManageContracts: true,
  },
  accountant: {
    canViewAll: false,
    canEditAll: false,
    canDeleteAll: false,
    canManageUsers: false,
    canViewFinancial: true,
    canEditFinancial: true,
    canExport: true,
    canImport: true,
    canManageSettings: false,
  },
  employee: {
    canViewAll: false,
    canEditAll: false,
    canDeleteAll: false,
    canManageUsers: false,
    canViewFinancial: false,
    canEditFinancial: false,
    canExport: false,
    canImport: false,
    canManageSettings: false,
  },
};

// التحقق من الصلاحية
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  const permissions = rolePermissions[user.role];
  if (!permissions) return false;
  return permissions[permission] || false;
};

// التحقق من الأدوار المسموحة
export const hasRole = (user, allowedRoles) => {
  if (!user || !user.role) return false;
  return allowedRoles.includes(user.role);
};

// هل يمكنه عرض الصفحة المالية؟
export const canViewFinancial = (user) => {
  return hasRole(user, ['admin', 'finance', 'accountant']);
};

// هل يمكنه إدارة العملاء والمشاريع؟
export const canManageOperations = (user) => {
  return hasRole(user, ['admin', 'pm']);
};

// هل هو مدير؟
export const isAdmin = (user) => {
  return user?.role === 'admin';
};

export default rolePermissions;