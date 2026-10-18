const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const fileRoutes = require('./fileRoutes');
const noteRoutes = require('./noteRoutes');
const backupRoutes = require('./backupRoutes');

router.use('/auth', authRoutes);
router.use('/files', fileRoutes);
router.use('/notes', noteRoutes);
router.use('/backup', backupRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'HomeStorage Backend API',
  });
});

module.exports = router;
