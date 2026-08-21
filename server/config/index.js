require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'wolloshare'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'wolloshare_jwt_secret_dev',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'wolloshare_refresh_secret_dev',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    // In development, allow a much higher limit to prevent blocking during testing.
    // In production, the stricter RATE_LIMIT_MAX (default 100) is used.
    max: process.env.NODE_ENV === 'production'
      ? parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
      : 100000
  }
};

