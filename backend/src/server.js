require('dotenv').config();

const app       = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB before accepting any requests
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🚲 ════════════════════════════════════════════════');
      console.log('   Pixx Bicycle Owner\'s Declaration System');
      console.log('   PixxTechnologiees — UK Bicycle Business');
      console.log('🚲 ════════════════════════════════════════════════');
      console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Server      : http://localhost:${PORT}`);
      console.log(`   Health      : http://localhost:${PORT}/api/health`);
      console.log('🚲 ════════════════════════════════════════════════');
      console.log('');
    });

    // ── Graceful shutdown ─────────────────────────────────
    const shutdown = (signal) => {
      console.log(`\n${signal} received — shutting down gracefully...`);
      server.close(() => {
        console.log('✅ HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
