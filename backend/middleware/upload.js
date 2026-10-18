const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Path folder upload
const uploadDir = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

// Pastikan direktori upload ada
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate nama file unik: timestamp + random string + ekstensi asli
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);

    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  },
});

// Batas ukuran file (default 50MB)
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800;

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
});

module.exports = {
  upload,
  uploadDir,
};
