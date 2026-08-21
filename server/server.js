const app = require('./app');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`✓ Upload directory created: ${uploadDir}`);
}

// Start server
const server = app.listen(config.port, () => {
  console.log('========================================');
  console.log('  WolloShare API Server');
  console.log('========================================');
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Port:        ${config.port}`);
  console.log(`  Upload Dir:  ${uploadDir}`);
  console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

