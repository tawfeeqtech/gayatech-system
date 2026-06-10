const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const users = [
  {
    username: 'admin',
    email: 'admin@gayatech.ps',
    password: 'admin123',
    fullName: 'مدير النظام',
    role: 'admin',
    isActive: true,
    preferences: { language: 'ar', defaultCurrency: 'USD' }
  },
  {
    username: 'finance',
    email: 'finance@gayatech.ps',
    password: 'finance123',
    fullName: 'المدير المالي',
    role: 'finance',
    isActive: true,
    preferences: { language: 'ar', defaultCurrency: 'USD' }
  },
  {
    username: 'pm',
    email: 'pm@gayatech.ps',
    password: 'pm123',
    fullName: 'مدير المشاريع',
    role: 'pm',
    isActive: true,
    preferences: { language: 'ar', defaultCurrency: 'USD' }
  },
  {
    username: 'accountant',
    email: 'accountant@gayatech.ps',
    password: 'accountant123',
    fullName: 'المحاسب',
    role: 'accountant',
    isActive: true,
    preferences: { language: 'ar', defaultCurrency: 'USD' }
  },
  {
    username: 'employee',
    email: 'employee@gayatech.ps',
    password: 'employee123',
    fullName: 'موظف تجريبي',
    role: 'employee',
    isActive: true,
    preferences: { language: 'ar', defaultCurrency: 'USD' }
  }
];

const seedDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/gayatech_system';
    console.log(`Connecting to database: ${connStr}`);
    await mongoose.connect(connStr);
    
    // Clear existing users
    await User.deleteMany();
    console.log('Cleared existing users.');

    // Insert new users one by one to trigger save middleware (bcrypt password hashing)
    for (const u of users) {
      await User.create(u);
      console.log(`Created user: ${u.username} (${u.role})`);
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
