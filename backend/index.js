const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { sequelize } = require('./models');
const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Pastikan folder upload ada
const uploadDir = path.resolve(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static frontend serving jika backend juga menjadi server host statis
app.use(express.static(path.resolve(__dirname, '..')));

// Welcome root route
app.get('/', (req, res) => {
  res.json({
    message: 'Selamat datang di HomeStorage Backend API',
    version: '1.1',
    docs: '/api/health',
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// Inisialisasi Database dan Menjalankan Server
const startServer = async () => {
  try {
    const dialectName = sequelize.getDialect();
    console.log(`Menghubungkan ke database (${dialectName.toUpperCase()})...`);
    await sequelize.authenticate();
    console.log(`✅ Koneksi database (${dialectName.toUpperCase()}) berhasil dibangun.`);

    // Sinkronisasi schema tabel
    await sequelize.sync({ alter: false });
    console.log('✅ Sinkronisasi model database berhasil.');

    const server = app.listen(PORT, () => {
      console.log(`🚀 HomeStorage Backend berjalan di http://localhost:${PORT}`);
      console.log(`📁 Folder upload: ${uploadDir}`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log('\nMenutup koneksi server secara aman...');
      server.close(() => {
        sequelize.close().finally(() => {
          process.exit(0);
        });
      });
      setTimeout(() => process.exit(0), 1500).unref();
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Gagal menjalankan server backend:');
    console.error(error.message || error);
    if (sequelize.getDialect() === 'postgres') {
      console.error('💡 Tips: Jika PostgreSQL belum diinstall, Anda dapat mengganti DB_DIALECT=sqlite di file .env');
    }
  }
};

startServer();

module.exports = app;
