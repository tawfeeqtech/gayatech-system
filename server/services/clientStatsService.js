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

  // حساب الأرصدة حسب العملة
  const balances = {};
  const details = {};
  
  contractMonths.forEach(cm => {
    const currency = cm.currency || 'USD';
    if (!details[currency]) details[currency] = { invoiced: 0, paid: 0 };
    details[currency].invoiced += cm.value || 0;
    details[currency].paid += cm.paidAmount || 0;
  });
  
  projects.forEach(p => {
    const currency = p.currency || 'USD';
    if (!details[currency]) details[currency] = { invoiced: 0, paid: 0 };
    details[currency].invoiced += p.totalValue || 0;
  });

  // حساب الرصيد لكل عملة
  Object.keys(details).forEach(currency => {
    balances[currency] = (details[currency].paid || 0) - (details[currency].invoiced || 0);
  });

  // استخدام findById ثم save للتأكد من حفظ كل الحقول
  const client = await Client.findById(clientId);
  if (!client) return;

  client.computedStats.totalContracts = contracts.length;
  client.computedStats.activeContracts = contracts.filter(c => c.status === 'نشط').length;
  client.computedStats.totalProjects = projects.length;
  client.computedStats.activeProjects = projects.filter(p => p.status === 'قيد التنفيذ').length;
  client.computedStats.balances = balances;
  client.computedStats.details = details;
  client.markModified('computedStats'); 

  await client.save();
};

module.exports = { updateClientStats };