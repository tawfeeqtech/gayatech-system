const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { updateClientStats } = require('../services/clientStatsService');
const Client = require('../models/Client');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to DB\n');

    const clients = await Client.find();
    console.log(`📋 Found ${clients.length} clients\n`);

    for (const client of clients) {
      await updateClientStats(client._id);
      console.log(`✅ Updated: ${client.name}`);
    }

    console.log('\n🎉 All clients updated!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run();