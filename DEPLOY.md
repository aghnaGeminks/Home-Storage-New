# Panduan Deployment Gratis ke Render.com 🚀

Proyek **HomeStorage** sudah dipersiapkan sepenuhnya untuk dideploy secara gratis dan permanen di **Render.com**.

---

### Langkah 1: Buat Repositori di GitHub
1. Buka [github.com/new](https://github.com/new).
2. Beri nama repositori (misalnya `homestorage`).
3. Pilih **Public** atau **Private**, lalu klik **Create repository**.
4. Salin URL repositori yang muncul (contoh: `https://github.com/username/homestorage.git`).

---

### Langkah 2: Push Kode ke GitHub
Jalankan perintah berikut di terminal komputer Anda (di folder `HOME STORAGE`):

```bash
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/homestorage.git
git push -u origin main
```
*(Ganti `USERNAME_ANDA` dengan username GitHub Anda).*

---

### Langkah 3: Hubungkan ke Render.com (Gratis)
1. Buka dan login ke [dashboard.render.com](https://dashboard.render.com/) (bisa login menggunakan akun GitHub).
2. Klik tombol **New +** di pojok kanan atas, lalu pilih **Web Service** (atau **Blueprint**).
3. Pilih repositori `homestorage` yang baru saja Anda push.
4. Render akan otomatis mendeteksi konfigurasi dari file `render.yaml` kita:
   - **Name**: `homestorage`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Klik **Create Web Service**.

---

### 🎉 Selesai!
Dalam 1–2 menit, Render akan mengompilasi dan mengaktifkan website Anda dengan URL publik permanen bersertifikat SSL/HTTPS gratis:
```
https://homestorage-xxxx.onrender.com
```
Website dan API backend Anda akan aktif 24 jam nonstop!
