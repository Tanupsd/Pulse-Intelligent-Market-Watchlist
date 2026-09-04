const app = require('./src/app');
const { pool } = require('./src/db/pool');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 Pulse API Server running on port ${PORT}`);
  console.log(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});

const gracefulShutdown = () => {
  console.log('\n[Pulse] Received shutdown signal. Closing HTTP server & DB pool...');
  server.close(async () => {
    console.log('[Pulse] HTTP server closed.');
    await pool.end();
    console.log('[Pulse] DB pool ended. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
