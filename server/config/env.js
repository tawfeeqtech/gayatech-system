const dotenv = require('dotenv');
const path = require('path');

// تحميل متغيرات البيئة
dotenv.config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  port: process.env.PORT || 9001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '90d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:9173',
  uploadPath: process.env.UPLOAD_PATH || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760
};