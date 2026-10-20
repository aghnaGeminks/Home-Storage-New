const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Buat folder uploads jika belum ada
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Inisialisasi SQLite Database
const dbFile = path.join(__dirname, 'homestorage.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) console.error('Gagal membuka database:', err.message);
    else console.log('Terhubung ke database SQLite.');
});

// Buat tabel jika belum ada
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT,
        size INTEGER,
        path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../'))); // Menyajikan file statis dari root workspace jika diinginkan

// Konfigurasi Multer untuk Upload File
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- API ROUTES ---

// 1. Ambil Statistik & Semua Data
app.get('/api/data', (req, res) => {
    db.all(`SELECT * FROM files ORDER BY id DESC`, [], (err, files) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all(`SELECT * FROM notes ORDER BY id DESC`, [], (err, notes) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({ files, notes });
        });
    });
});

// 2. Upload File
app.post('/api/files', upload.array('files'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
    }

    const stmt = db.prepare(`INSERT INTO files (name, original_name, mime_type, size, path) VALUES (?, ?, ?, ?, ?)`);
    
    let completed = 0;
    req.files.forEach(file => {
        stmt.run(file.filename, file.originalname, file.mimetype, file.size, file.path, function(err) {
            completed++;
            if (completed === req.files.length) {
                stmt.finalize();
                res.json({ message: 'File berhasil diunggah.' });
            }
        });
    });
});

// 3. Download File
app.get('/api/files/:id/download', (req, res) => {
    const id = req.params.id;
    db.get(`SELECT * FROM files WHERE id = ?`, [id], (err, file) => {
        if (err || !file) return res.status(404).json({ error: 'File tidak ditemukan.' });
        res.download(file.path, file.original_name);
    });
});

// 4. Hapus File
app.delete('/api/files/:id', (req, res) => {
    const id = req.params.id;
    db.get(`SELECT * FROM files WHERE id = ?`, [id], (err, file) => {
        if (err || !file) return res.status(404).json({ error: 'File tidak ditemukan.' });

        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        db.run(`DELETE FROM files WHERE id = ?`, [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'File berhasil dihapus.' });
        });
    });
});

// 5. Tambah Catatan
app.post('/api/notes', (req, res) => {
    const { title, content } = req.body;
    if (!title && !content) {
        return res.status(400).json({ error: 'Judul atau isi catatan wajib diisi.' });
    }

    const stmt = db.prepare(`INSERT INTO notes (title, content) VALUES (?, ?)`);
    stmt.run(title || 'Tanpa Judul', content || '', function(err) {
        stmt.finalize();
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Catatan berhasil disimpan.', id: this.lastID });
    });
});

// 6. Hapus Catatan
app.delete('/api/notes/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM notes WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Catatan berhasil dihapus.' });
    });
});

// 7. Export Semua Data (JSON Backup)
app.get('/api/export', (req, res) => {
    db.all(`SELECT * FROM files`, [], (err, files) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(`SELECT * FROM notes`, [], (err, notes) => {
            if (err) return res.status(500).json({ error: err.message });

            const exportData = {
                app: "HomeStorage",
                version: "1.1-backend",
                exportedAt: new Date().toISOString(),
                files: files.map(f => ({
                    name: f.original_name,
                    type: f.mime_type,
                    size: f.size,
                    date: new Date(f.created_at).getTime(),
                    data: fs.existsSync(f.path) ? fs.readFileSync(f.path, { encoding: 'base64' }) : null
                })),
                notes: notes.map(n => ({
                    title: n.title,
                    content: n.content,
                    date: new Date(n.created_at).getTime()
                }))
            };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=home-storage-backup-${new Date().toISOString().split('T')[0]}.json`);
            res.send(JSON.stringify(exportData, null, 2));
        });
    });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Backend HomeStorage berjalan di http://localhost:${PORT}`);
});
