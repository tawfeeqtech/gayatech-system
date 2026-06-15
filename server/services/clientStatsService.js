const Client = require('../models/Client');
const Contract = require('../models/Contract');
const ContractMonth = require('../models/ContractMonth');
const Project = require('../models/Project');

const updateClientStats = async (clientId) => {
  const [contracts, contractMonths, projects] = await Promise.all([
    Contract.find({ client: clientId }),
    ContractMonth.find({ client: clientId }),
    Project.find({ client: clientId })
  ]);

  const balances = {};
  const details = {};
  
  // تجميع من أشهر العقود
  contractMonths.forEach(cm => {
    const currency = cm.currency || 'USD';
    if (!details[currency]) details[currency] = { invoiced: 0, paid: 0 };
    details[currency].invoiced += cm.value || 0;
    details[currency].paid += cm.paidAmount || 0;
  });
  
  // 👈 تجميع من المشاريع (قيمتها تضاف كـ invoiced)
  projects.forEach(p => {
    const currency = p.currency || 'USD';
    if (!details[currency]) details[currency] = { invoiced: 0, paid: 0 };
    details[currency].invoiced += p.totalValue || 0;
    // المشاريع تدفع عبر فواتير منفصلة، لذلك paid تبقى 0 حتى يتم دفع فاتورة
  });

  // حساب الرصيد لكل عملة
  Object.keys(details).forEach(currency => {
    balances[currency] = (details[currency].paid || 0) - (details[currency].invoiced || 0);
  });

  const client = await Client.findById(clientId);
  if (!client) return;

  client.computedStats.totalContracts = contracts.length;
  client.computedStats.activeContracts = contracts.filter(c => c.status === 'نشط').length;
  client.computedStats.totalProjects = projects.length;
  // 👈 تعديل: المشاريع النشطة = كل المشاريع غير المكتملة أو الملغية
  client.computedStats.activeProjects = projects.filter(
    p => !['مكتمل', 'تم التسليم', 'ملغي'].includes(p.status)
  ).length;
  client.computedStats.completedProjects = projects.filter(
    p => ['مكتمل', 'تم التسليم'].includes(p.status)
  ).length;

  client.computedStats.balances = balances;
  client.computedStats.details = details;
  client.markModified('computedStats');
  await client.save();
};

module.exports = { updateClientStats };