# HomeStorage — Backend API

Backend RESTful API untuk **HomeStorage** dibangun menggunakan Node.js, Express, PostgreSQL, Sequelize, Multer, dan JSON Web Tokens (JWT).

---

## 🚀 Fitur Utama
1. **Autentikasi & Otorisasi**:
   - Registrasi pengguna dengan enkripsi password (Bcrypt).
   - Login dengan penerbitan JWT (Bearer token).
   - Proteksi route dengan middleware `authenticateToken`.
2. **Pengelolaan File**:
   - Upload file (tunggal atau banyak) dengan Multer & sanitasi nama file.
   - Filter & pencarian nama file real-time.
   - Download file aman berdasarkan kepemilikan user.
   - Hapus file (membersihkan file di disk dan database).
   - Statistik ringkasan (jumlah file, total ukuran byte, jumlah catatan).
3. **Pengelolaan Catatan**:
   - Simpan catatan rahasia/penting (judul & isi).
   - Pencarian catatan berdasarkan kata kunci pada judul atau isi.
   - Edit & hapus catatan.
4. **Backup & Restore**:
   - Export seluruh data pengguna (file base64 + catatan) dalam satu file `.json` sesuai standar PRD v1.1.
   - Import / restore data dari file backup JSON.

---

## 🛠️ Instalasi & Konfigurasi

### 1. Prasyarat
- **Node.js** (v18 atau lebih baru)
- **PostgreSQL** aktif di komputer lokal atau server remote

### 2. Konfigurasi Environment (`.env`)
Salin atau sesuaikan file `.env` di dalam folder `backend/`:
```env
PORT=5000
NODE_ENV=development

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=homestorage
DB_USER=postgres
DB_PASSWORD=password_postgres_kamu

# JWT Secret
JWT_SECRET=kunci-rahasia-super-aman-ganti-di-sini
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=uploads
```

*Catatan: Pastikan database dengan nama `homestorage` sudah dibuat di PostgreSQL (misal via pgAdmin atau psql: `CREATE DATABASE homestorage;`).*

### 3. Menjalankan Server
```bash
# Menjalankan server dalam mode development (auto reload)
npm run dev

# Menjalankan server dalam mode production
npm start
```

---

## 📡 Daftar Endpoint API

### 🔐 Autentikasi (`/api/auth`)
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Mendaftarkan akun baru (`name`, `email`, `password`) | Publik |
| `POST` | `/api/auth/login` | Login akun dan mendapatkan JWT token | Publik |
| `GET` | `/api/auth/me` | Mengambil profil user saat ini | Bearer Token |

### 📁 Pengelolaan File (`/api/files`)
*Semua endpoint memerlukan header `Authorization: Bearer <TOKEN>`*

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/files/upload` | Upload satu/banyak file (form-data: key `files`) |
| `GET` | `/api/files` | Daftar file user (opsional: `?q=kata_kunci`) |
| `GET` | `/api/files/stats/summary` | Statistik total file, total ukuran, total catatan |
| `GET` | `/api/files/:id` | Detail metadata file |
| `GET` | `/api/files/:id/download` | Mengunduh file fisik |
| `DELETE` | `/api/files/:id` | Menghapus file dari database dan disk |

### 📝 Pengelolaan Catatan (`/api/notes`)
*Semua endpoint memerlukan header `Authorization: Bearer <TOKEN>`*

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/notes` | Membuat catatan baru (`title`, `content`) |
| `GET` | `/api/notes` | Daftar catatan (opsional: `?q=kata_kunci`) |
| `GET` | `/api/notes/:id` | Detail catatan |
| `PUT` | `/api/notes/:id` | Memperbarui catatan |
| `DELETE` | `/api/notes/:id` | Menghapus catatan |

### 💾 Backup & Restore (`/api/backup`)
*Semua endpoint memerlukan header `Authorization: Bearer <TOKEN>`*

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/backup/export` | Download satu file `home-storage-backup-YYYY-MM-DD.json` |
| `POST` | `/api/backup/import` | Restore data dari payload JSON backup |

### 🩺 Health Check
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/health` | Cek status kesehatan backend |
