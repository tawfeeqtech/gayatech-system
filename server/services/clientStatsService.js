const Client = require('../models/Client');
const Contract = require('../models/Contract');
const Project = require('../models/Project');
const Invoice = require('../models/Invoice');

const updateClientStats = async (clientId) => {
  const [contracts, projects, invoices] = await Promise.all([
    Contract.find({ client: clientId }),
    Project.find({ client: clientId }),
    Invoice.find({ client: clientId })
  ]);

  const balances = {};
  const details = {};
  
  invoices.forEach(inv => {
    const currency = inv.currency || 'USD';
    if (!details[currency]) details[currency] = { invoiced: 0, paid: 0 };
    details[currency].invoiced += inv.totalAmount || 0;
    details[currency].paid += inv.paidAmount || 0;
  });
  
  // 👈 تجميع من المشاريع
  projects.forEach(p => {
    const currency = p.currency || 'USD';
    if (!details[currency]) details[currency] = { invoiced: 0, paid: 0 };
    details[currency].invoiced += p.totalValue || 0;
  });

  // حساب الرصيد لكل عملة
  Object.keys(details).forEach(currency => {
    balances[currency] = (details[currency].paid || 0) - (details[currency].invoiced || 0);
  });

  const totalInvoiced = Object.values(details).reduce((sum, d) => sum + (d.invoiced || 0), 0);
  const totalPaid = Object.values(details).reduce((sum, d) => sum + (d.paid || 0), 0);

  const client = await Client.findById(clientId);
  if (!client) return;

  client.computedStats.totalContracts = contracts.length;
  client.computedStats.activeContracts = contracts.filter(c => c.status === 'نشط').length;
  client.computedStats.totalProjects = projects.length;
  client.computedStats.activeProjects = projects.filter(
    p => !['مكتمل', 'تم التسليم', 'ملغي'].includes(p.status)
  ).length;
  client.computedStats.completedProjects = projects.filter(
    p => ['مكتمل', 'تم التسليم'].includes(p.status)
  ).length;
  client.computedStats.totalInvoiced = totalInvoiced;
  client.computedStats.totalPaid = totalPaid;
  client.computedStats.balance = totalPaid - totalInvoiced;
  client.computedStats.balances = balances;
  client.computedStats.details = details;
  client.markModified('computedStats');
  await client.save();
};

module.exports = { updateClientStats };