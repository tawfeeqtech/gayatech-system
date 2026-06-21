const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');

async function go() {
  await mongoose.connect('mongodb://localhost:27017/gayatech');

  // Correct SAR wallet: should be 0 (4500 income - 4500 real exchange = 0)
  // Current: 9000 (because reversing 2 bad records added 9000 to a 0-balance wallet)
  const sarResult = await Wallet.findOneAndUpdate(
    { name: 'محفظة الريال - ريم' },
    { $set: { balance: 0 } },
    { new: true }
  ).lean();
  console.log('SAR wallet corrected:', sarResult.name, '->', sarResult.balance, sarResult.currency);

  // Correct USD (الشركة) wallet: should be 515
  // Current: -8485 (because reversing 2 bad records subtracted 9000 from 515)
  const usdResult = await Wallet.findOneAndUpdate(
    { name: 'محفظة الدولار - الشركة' },
    { $set: { balance: 515 } },
    { new: true }
  ).lean();
  console.log('USD wallet corrected:', usdResult.name, '->', usdResult.balance, usdResult.currency);

  // Verify
  console.log('\n=== VERIFICATION ===');
  const wallets = await Wallet.find().lean();
  for (const w of wallets) {
    let expected = '';
    if (w.name === 'محفظة الريال - ريم') expected = 'EXPECTED: 0';
    else if (w.name === 'محفظة الدولار - الشركة') expected = 'EXPECTED: 515';
    console.log(w.name + ': ' + w.balance + ' ' + w.currency + (expected ? ' ✅ ' + expected : ''));
  }

  await mongoose.disconnect();
}
go().catch(e => { console.log('Error:', e.message); process.exit(1); });
