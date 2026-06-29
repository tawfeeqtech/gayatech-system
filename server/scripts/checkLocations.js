const mongoose = require('mongoose');
const Country = require('../models/Country');
const City = require('../models/City');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gayatech');
  
  const countries = await Country.find({}).sort({name:1});
  console.log('=== COUNTRIES ===');
  countries.forEach(c => console.log(c.name, '- _id:', c._id.toString()));
  
  const cities = await City.find({}).populate('country','name').sort({name:1}).limit(50);
  console.log('\n=== CITIES (first 50) ===');
  cities.forEach(c => {
    const cn = c.country ? (c.country.name || c.country._id?.toString()) : 'N/A';
    console.log(c.name, '- country:', cn);
  });
  
  console.log('\n=== TEST FILTER ===');
  if (countries.length > 0) {
    const saudi = countries.find(c => c.name === 'السعودية');
    if (saudi) {
      const saudiCities = await City.find({ country: saudi._id });
      console.log('Cities for Saudi Arabia (' + saudi._id + '):');
      saudiCities.forEach(c => console.log(' -', c.name));
      console.log('Total:', saudiCities.length);
    }
  }
  
  await mongoose.disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
