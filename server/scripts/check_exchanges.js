const mongoose = require('mongoose');
const CurrencyExchange = require('../models/CurrencyExchange');
const Wallet = require('../models/Wallet');

async function go() {
  await mongoose.connect('mongodb://localhost:27017/gayatech');
  const exs = await CurrencyExchange.find().populate('fromWallet toWallet').lean();
  console.log('Count:', exs.length);
  for (const e of exs) {
    const fwName = e.fromWallet ? (e.fromWallet.name || String(e.fromWallet._id)) : 'NONE';
    const twName = e.toWallet ? (e.toWallet.name || String(e.toWallet._id)) : 'NONE';
    const fwBal = e.fromWallet ? e.fromWallet.balance : '?';
    const twBal = e.toWallet ? e.toWallet.balance : '?';
    const sid = String(e._id).slice(-6);
    console.log(sid + ': ' + e.fromAmount + ' ' + e.fromCurrency + ' -> ' + e.toAmount + ' ' + e.toCurrency +
      ' | rate=' + e.exchangeRate +
      ' | fromWallet=' + fwName + ' (bal=' + fwBal + ')' +
      ' | toWallet=' + twName + ' (bal=' + twBal + ')');
  }
  await mongoose.disconnect();
}
go().catch(e => { console.log('Error:', e.message); process.exit(1); });
