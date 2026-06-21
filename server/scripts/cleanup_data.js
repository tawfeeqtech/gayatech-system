const mongoose = require('mongoose');
const CurrencyExchange = require('../models/CurrencyExchange');
const Wallet = require('../models/Wallet');

async function go() {
  await mongoose.connect('mongodb://localhost:27017/gayatech');

  // Find bad records (rate=1, SAR->USD)
  const badRecords = await CurrencyExchange.find({ exchangeRate: 1, fromCurrency: 'SAR', toCurrency: 'USD' });
  console.log('Bad records found:', badRecords.length);

  for (const ex of badRecords) {
    console.log('Deleting:', ex._id, ex.fromAmount, ex.fromCurrency, '->', ex.toAmount, ex.toCurrency);
    
    // Reverse the balance effects
    if (ex.fromWallet && ex.toWallet) {
      await Wallet.findByIdAndUpdate(ex.fromWallet, { $inc: { balance: ex.fromAmount } });
      await Wallet.findByIdAndUpdate(ex.toWallet, { $inc: { balance: -ex.toAmount } });
      console.log('  Reversed balance: fromWallet +' + ex.fromAmount + ', toWallet -' + ex.toAmount);
    }
    
    await CurrencyExchange.findByIdAndDelete(ex._id);
    console.log('  Deleted successfully');
  }

  // Check updated wallet balances
  const wallets = await Wallet.find().lean();
  console.log('\n=== UPDATED WALLET BALANCES ===');
  for (const w of wallets) {
    console.log(w.name + ': ' + w.balance + ' ' + w.currency);
  }

  await mongoose.disconnect();
}
go().catch(e => { console.log('Error:', e.message); process.exit(1); });
