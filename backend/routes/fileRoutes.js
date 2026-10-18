const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const authenticateToken = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Semua route file membutuhkan autentikasi
router.use(authenticateToken);

// Upload: mendukung single maupun multiple files
router.post('/upload', upload.array('files', 20), fileController.uploadFiles);

// Summary statistics
router.get('/stats/summary', fileController.getStats);

// List & search files
router.get('/', fileController.getFiles);

// Detail file
router.get('/:id', fileController.getFileById);

// Download file
router.get('/:id/download', fileController.downloadFile);

// Hapus file
router.delete('/:id', fileController.deleteFile);

module.exports = router;
