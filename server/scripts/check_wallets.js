const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const CurrencyExchange = require('../models/CurrencyExchange');
const Wallet = require('../models/Wallet');

async function go() {
  await mongoose.connect('mongodb://localhost:27017/gayatech');
  
  // Check SAR wallet
  const sarWallet = await Wallet.findOne({ currency: 'SAR' }).lean();
  console.log('=== SAR WALLET ===');
  console.log(JSON.stringify(sarWallet, null, 2));
  
  const usdWallet = await Wallet.findOne({ name: 'محفظة الدولار - الشركة' }).lean();
  console.log('\n=== USD WALLET (الشركة) ===');
  console.log(JSON.stringify(usdWallet, null, 2));
  
  // Check SAR transactions
  console.log('\n=== ALL TRANSACTIONS ===');
  const txs = await Transaction.find().lean();
  for (const t of txs) {
    console.log(t._id + ' | ' + t.type + ' | ' + t.amount + ' ' + t.currency + ' | wallet=' + (t.fromWallet||'') + '/' + (t.toWallet||'') + ' | balanceBefore=' + t.balanceBefore + ' | balanceAfter=' + t.balanceAfter);
  }
  
  await mongoose.disconnect();
}
go().catch(e => { console.log('Error:', e.message); process.exit(1); });
