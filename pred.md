# PRD — HomeStorage

**Nama Produk:** HomeStorage
**Versi:** 1.1 (MVP)
**Status:** Final Draft
**Platform:** Web App — Single Page HTML/CSS/JavaScript
**Penyimpanan:** Lokal browser (IndexedDB)
**Referensi Implementasi:** Website HomeStorage dengan Hero Section, upload file, catatan, pencarian, statistik, dan export data.

---

## 1. Ringkasan Produk

HomeStorage adalah aplikasi web penyimpanan pribadi yang memungkinkan pengguna menyimpan file dan catatan penting langsung di browser. Aplikasi tidak memerlukan akun, backend, atau koneksi server. Semua data disimpan secara lokal menggunakan IndexedDB, dan pengguna dapat mengekspor seluruh data dalam satu klik sebagai cadangan.

Produk ditujukan untuk pengguna yang membutuhkan tempat cepat dan privat untuk menyimpan dokumen, gambar, arsip, serta catatan sensitif ringan seperti PIN, nomor rekening, atau informasi penting lainnya.

---

## 2. Latar Belakang & Masalah

Pengguna sering menyimpan file penting di folder yang berantakan atau mencatat data penting di tempat yang tersebar. Solusi cloud memang populer, tetapi tidak semua pengguna nyaman mengunggah data pribadi ke server pihak ketiga.

**Masalah utama:**
- Data penting tersebar dan sulit ditemukan kembali.
- Pengguna membutuhkan penyimpanan cepat tanpa registrasi.
- Pengguna ingin privasi lebih tinggi karena data tidak dikirim ke server.
- Catatan kecil dan file sering disimpan terpisah.
- Data lokal rentan hilang jika cache browser dibersihkan, sehingga butuh mekanisme backup.

**Peluang:**
Membuat aplikasi penyimpanan lokal yang ringan, privat, mudah digunakan, dan menyediakan backup satu klik.

---

## 3. Tujuan Produk

### 3.1 Tujuan
1. Menyediakan penyimpanan file dan catatan penting yang cepat diakses.
2. Menjaga privasi dengan menyimpan seluruh data di perangkat pengguna.
3. Memberikan pengalaman unggah file yang mudah melalui klik atau drag-and-drop.
4. Menyediakan pencarian, statistik, dan pengelolaan data dasar.
5. Menampilkan Hero Section yang menarik dan komunikatif.
6. Menyediakan fitur export seluruh data dalam satu klik sebagai cadangan.

### 3.2 Non-Tujuan
1. Tidak menyediakan sinkronisasi antar perangkat.
2. Tidak menyediakan akun, login, atau autentikasi.
3. Tidak menyediakan enkripsi end-to-end pada versi MVP.
4. Tidak menyediakan kolaborasi atau berbagi file.
5. Tidak menjadi pengganti cloud storage berskala besar.
6. Tidak menyediakan fitur import pada MVP (masuk Fase 2).

---

## 4. Target Pengguna

### Persona 1 — Pengguna Pribadi
- Menyimpan dokumen penting, gambar, dan catatan kecil.
- Ingin akses cepat tanpa membuat akun.
- Peduli privasi data.
- Ingin bisa mencadangkan data kapan saja.

### Persona 2 — Pelajar / Mahasiswa
- Menyimpan file tugas, catatan, dan referensi.
- Membutuhkan pencarian cepat dan pengelolaan file sederhana.

### Persona 3 — Pengguna Sensitif terhadap Privasi
- Tidak ingin data diunggah ke server.
- Memahami bahwa data lokal dapat hilang jika cache dibersihkan.
- Membutuhkan backup lokal berkala.

---

## 5. Ruang Lingkup MVP

### Termasuk dalam MVP
- Hero Section dengan headline, badge privasi, CTA, dan statistik.
- Navbar dengan anchor ke Fitur, Penyimpanan, dan Tentang.
- Upload file melalui klik dan drag-and-drop.
- Penyimpanan file di IndexedDB.
- Daftar file dengan nama, ukuran, tanggal, ikon, tombol unduh, dan hapus.
- Penyimpanan catatan dengan judul dan isi.
- Daftar catatan dengan tombol salin dan hapus.
- Pencarian file dan catatan.
- Tab File dan Catatan.
- Statistik jumlah file, total ukuran, dan jumlah catatan.
- Tombol Export Semua Data dalam satu klik (format JSON).
- Toast notification.
- Empty state.
- Responsive layout.

### Di luar MVP
- Login dan akun.
- Enkripsi data.
- Sinkronisasi cloud.
- Berbagi file.
- Folder dan tag.
- Preview file.
- Backup otomatis / terjadwal.
- Import data dari file backup.
- Export selektif per item.
- Export terenkripsi.
- Dark/light theme toggle.
- Drag-and-drop untuk mengatur urutan.

---

## 6. User Stories

| ID | User Story | Prioritas |
|---|---|---|
| US-01 | Sebagai pengguna, saya ingin melihat Hero Section yang menjelaskan manfaat aplikasi agar saya memahami produk. | Must |
| US-02 | Sebagai pengguna, saya ingin mengunggah file dengan klik atau drag-and-drop agar cepat menyimpan data. | Must |
| US-03 | Sebagai pengguna, saya ingin melihat daftar file beserta ukuran dan tanggal agar mudah dikelola. | Must |
| US-04 | Sebagai pengguna, saya ingin mengunduh file yang tersimpan agar bisa digunakan kembali. | Must |
| US-05 | Sebagai pengguna, saya ingin menghapus file agar penyimpanan tetap rapi. | Must |
| US-06 | Sebagai pengguna, saya ingin menyimpan catatan penting agar tidak lupa. | Must |
| US-07 | Sebagai pengguna, saya ingin menyalin isi catatan agar mudah digunakan di tempat lain. | Should |
| US-08 | Sebagai pengguna, saya ingin mencari file atau catatan agar cepat menemukan data. | Must |
| US-09 | Sebagai pengguna, saya ingin melihat statistik penyimpanan agar tahu jumlah data saya. | Should |
| US-10 | Sebagai pengguna, saya ingin mendapatkan notifikasi saat aksi berhasil atau gagal. | Should |
| US-11 | Sebagai pengguna, saya ingin tampilan tetap nyaman di ponsel. | Must |
| US-12 | Sebagai pengguna, saya ingin mengekspor seluruh file dan catatan dalam satu klik agar saya memiliki cadangan data lokal. | Must |

---

## 7. Functional Requirements

### FR-01 — Hero Section
**Deskripsi:** Menampilkan headline utama, badge "100% tersimpan di perangkat Anda", paragraf penjelasan, CTA "Mulai Unggah File", CTA "Lihat Penyimpanan", dan statistik.
**Prioritas:** Must
**Acceptance Criteria:**
- Hero tampil di bagian atas halaman.
- CTA "Mulai Unggah File" menggulir ke bagian penyimpanan dan membuka file picker.
- Statistik menampilkan jumlah file, total ukuran, dan jumlah catatan secara dinamis.

### FR-02 — Navbar
**Deskripsi:** Navbar sticky dengan logo dan tautan ke Fitur, Penyimpanan, dan Tentang.
**Prioritas:** Must
**Acceptance Criteria:**
- Navbar tetap terlihat saat halaman digulir.
- Tautan melakukan smooth scroll ke section terkait.
- Navbar responsif; tautan dapat disembunyikan di layar kecil.

### FR-03 — Upload File
**Deskripsi:** Pengguna dapat mengunggah satu atau beberapa file melalui klik area dropzone atau drag-and-drop.
**Prioritas:** Must
**Acceptance Criteria:**
- Klik dropzone membuka file picker.
- Drag-and-drop file ke dropzone memicu proses upload.
- File yang sama dapat dipilih ulang setelah upload.
- File disimpan ke IndexedDB dengan metadata nama, tipe, ukuran, blob, dan tanggal.
- Jika berhasil, toast sukses muncul dan daftar file diperbarui.
- Jika gagal, toast error muncul.

### FR-04 — Daftar File
**Deskripsi:** Menampilkan file tersimpan dengan ikon sesuai tipe, nama, ukuran, tanggal, tombol unduh, dan hapus.
**Prioritas:** Must
**Acceptance Criteria:**
- File diurutkan dari yang terbaru.
- Nama file panjang dipotong dengan ellipsis.
- Tombol unduh mengunduh file dengan nama asli.
- Tombol hapus meminta konfirmasi sebelum menghapus.
- Empty state muncul jika tidak ada file.

### FR-05 — Catatan
**Deskripsi:** Pengguna dapat menyimpan catatan dengan judul dan isi.
**Prioritas:** Must
**Acceptance Criteria:**
- Form memiliki input judul dan textarea isi.
- Tombol "Simpan Catatan" menyimpan catatan ke IndexedDB.
- Validasi: judul atau isi tidak boleh kosong bersamaan.
- Setelah simpan, form dikosongkan dan daftar catatan diperbarui.
- Catatan tampil dengan judul, tanggal, dan cuplikan isi.
- Tombol salin menyalin judul dan isi ke clipboard.
- Tombol hapus meminta konfirmasi.
- Shortcut Ctrl/Cmd + Enter menyimpan catatan.

### FR-06 — Pencarian
**Deskripsi:** Pencarian memfilter file atau catatan pada tab aktif.
**Prioritas:** Must
**Acceptance Criteria:**
- Input pencarian tersedia di panel penyimpanan.
- Pencarian file berdasarkan nama file.
- Pencarian catatan berdasarkan judul dan isi.
- Hasil diperbarui secara real-time.
- Empty state khusus muncul jika tidak ada hasil.

### FR-07 — Tab File dan Catatan
**Deskripsi:** Pengguna dapat berpindah antara tab File dan Catatan.
**Prioritas:** Must
**Acceptance Criteria:**
- Tab aktif memiliki state visual berbeda.
- Panel yang sesuai ditampilkan.
- Jumlah item ditampilkan pada label tab jika ada data.

### FR-08 — Statistik Penyimpanan
**Deskripsi:** Menampilkan jumlah file, total ukuran file, dan jumlah catatan.
**Prioritas:** Should
**Acceptance Criteria:**
- Statistik diperbarui setelah upload, hapus file, atau simpan/hapus catatan.
- Ukuran file diformat dalam B, KB, MB, atau GB.

### FR-09 — Toast Notification
**Deskripsi:** Menampilkan notifikasi singkat untuk aksi sukses atau gagal.
**Prioritas:** Should
**Acceptance Criteria:**
- Toast muncul di kanan bawah.
- Toast hilang otomatis setelah sekitar 2,6 detik.
- Toast memiliki varian sukses dan error.

### FR-10 — Persistensi Data
**Deskripsi:** Data disimpan di IndexedDB browser.
**Prioritas:** Must
**Acceptance Criteria:**
- Data tetap ada setelah halaman dimuat ulang.
- Data hilang jika pengguna menghapus data situs/browser.
- Aplikasi menampilkan error jika IndexedDB tidak didukung.

### FR-11 — Empty State
**Deskripsi:** Menampilkan pesan ketika tidak ada file, catatan, atau hasil pencarian.
**Prioritas:** Should
**Acceptance Criteria:**
- Empty state file dan catatan berbeda.
- Empty state pencarian menyesuaikan kata kunci.

### FR-12 — Responsive Design
**Deskripsi:** Layout nyaman digunakan di desktop dan mobile.
**Prioritas:** Must
**Acceptance Criteria:**
- Hero dan statistik menyesuaikan ukuran layar.
- Panel penyimpanan tetap dapat digunakan di layar kecil.
- Tombol dan input memiliki ukuran yang nyaman disentuh.

### FR-13 — Export Semua Data
**Deskripsi:** Pengguna dapat mengunduh seluruh data penyimpanan (file dan catatan) dalam satu file backup.
**Prioritas:** Must
**Acceptance Criteria:**
- Terdapat tombol **"Export Semua Data"** di panel penyimpanan atau area pengaturan.
- Klik tombol memicu pembuatan file backup dengan format `.json`.
- File backup berisi:
  - Metadata file: nama, tipe, ukuran, tanggal, dan konten file dalam bentuk **base64**.
  - Seluruh catatan: judul, isi, dan tanggal.
- Nama file backup menggunakan format: `home-storage-backup-YYYY-MM-DD.json`.
- Proses export menampilkan toast sukses setelah file berhasil diunduh.
- Jika tidak ada data, tombol tetap ada tetapi menampilkan toast informasi "Tidak ada data untuk diekspor."
- Jika terjadi error saat membuat backup, tampilkan toast error.
- Pengguna diberikan peringatan bahwa file backup berisi data sensitif dan harus disimpan dengan aman.

**Catatan Teknis:**
- File blob dikonversi ke base64 menggunakan `FileReader`.
- Untuk data besar, proses export dapat memakan waktu; tampilkan indikator loading sederhana.
- Ukuran file backup bergantung pada total ukuran file asli (base64 menambah ~33%).

---

## 8. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| Performa | Halaman dimuat cepat karena hanya HTML/CSS/JS statis. Render daftar harus responsif hingga ratusan item ringan. |
| Privasi | Tidak ada data yang dikirim ke server. Tidak ada tracking. |
| Keamanan | Data tidak dienkripsi pada MVP. Pengguna diberi tahu bahwa data lokal dapat dihapus dan file backup bersifat sensitif. |
| Kompatibilitas | Mendukung browser modern: Chrome, Edge, Firefox, Safari versi terbaru. |
| Aksesibilitas | Elemen interaktif dapat digunakan dengan keyboard. Kontras teks memadai. |
| Reliabilitas | Error IndexedDB dan error export ditangani dengan toast. |
| Usability | Upload maksimal 2 langkah: klik/seret lalu selesai. Pencarian real-time. Export maksimal 1 klik. |
| Batasan Penyimpanan | Mengikuti kuota browser. Aplikasi tidak menjamin backup permanen. |
| Keamanan Export | File backup berisi data sensitif; UI memberikan peringatan sebelum/saat export. |

---

## 9. UI/UX Requirements

### 9.1 Hero Section
- Badge privasi dengan indikator hijau.
- Headline besar dengan gradien pada frasa kunci.
- Paragraf penjelasan singkat.
- Dua CTA: primer "Mulai Unggah File" dan sekunder "Lihat Penyimpanan".
- Statistik berbentuk kartu: File Tersimpan, Total Ukuran, Catatan.

### 9.2 Panel Penyimpanan
- Tab File dan Catatan.
- Search bar.
- Tombol "Export Semua Data" di header panel atau area pengaturan.
- Dropzone dengan border dashed.
- Daftar item berbentuk kartu.
- Tombol aksi ikon: unduh, hapus, salin.

### 9.3 Gaya Visual
- Tema gelap modern.
- Warna utama: indigo `#6366f1`, cyan `#22d3ee`, background `#0b1020`.
- Radius 12–22 px.
- Animasi halus: fade up, hover lift, toast in/out.

### 9.4 State
- Default.
- Hover.
- Active.
- Dragover.
- Empty.
- Error toast.
- Success toast.
- Info toast (export tanpa data).
- Loading state (opsional saat export).

---

## 10. Data Model

### Store: `files`
| Field | Tipe | Keterangan |
|---|---|---|
| id | number | Auto increment |
| name | string | Nama file |
| type | string | MIME type |
| size | number | Ukuran byte |
| blob | Blob | Isi file |
| date | number | Timestamp |

### Store: `notes`
| Field | Tipe | Keterangan |
|---|---|---|
| id | number | Auto increment |
| title | string | Judul catatan |
| content | string | Isi catatan |
| date | number | Timestamp |

**Database:** `homeStorageDB`
**Versi:** 1

### Struktur File Backup (Export)
```json
{
  "app": "HomeStorage",
  "version": "1.1",
  "exportedAt": "2025-01-01T00:00:00.000Z",
  "files": [
    {
      "name": "dokumen.pdf",
      "type": "application/pdf",
      "size": 12345,
      "date": 1700000000000,
      "data": "base64-string..."
    }
  ],
  "notes": [
    {
      "title": "PIN ATM",
      "content": "123456",
      "date": 1700000000000
    }
  ]
}