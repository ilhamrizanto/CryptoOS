# CryptoOS — Quantitative Trading Terminal & Intelligence Engine

Sistem operasi analitik pasar dan portofolio kripto kuantitatif pribadi. Dilengkapi analitik makroekonomi terintegrasi, visual meter sentimen pasar, dominasi rotasi altcoin, serta pemantauan siklus suku bunga The Fed.

---

## ⚡ Panduan Cepat Menjalankan di Lokal

### 1. Prasyarat Sistem
- **Node.js**: Versi `18.x` atau `20.x` (LTS) atau lebih baru.
- **NPM**: Versi `9.x` atau `10.x` (bawaan Node.js).
- **Git** (opsional).

---

### 2. Instalasi Dependensi
Buka terminal (PowerShell / Command Prompt / Terminal VS Code) di folder proyek:

```bash
# Pastikan Anda berada di root folder proyek (CryptoOS atau investing)
npm install
```
> *Perintah ini akan secara otomatis menginstal dependensi untuk root, backend, dan frontend melalui fitur npm workspaces.*

---

### 3. Konfigurasi Environment (`.env`)
Pastikan file `.env` sudah tersedia di root proyek. Jika belum ada, salin dari `.env.example`:

```bash
# Windows Command Prompt:
copy .env.example .env

# Windows PowerShell:
Copy-Item .env.example .env
```

Isi penting dalam `.env`:
- `PORT=3001` (Port API Backend)
- `CORS_ORIGIN=http://localhost:5173` (URL Frontend)
- `DATABASE_PATH=./data/cryptoos.db` (Database SQLite lokal otomatis)
- `VITE_GOOGLE_CLIENT_ID` (Klien ID Google OAuth)

---

### 4. Menjalankan Server

#### Cara 1: Sekaligus (Rekomendasi ⭐)
Cukup jalankan satu perintah di root folder:
```bash
npm run dev
```
Perintah ini akan menyalakan backend dan frontend secara bersamaan menggunakan `concurrently`.

#### Cara 2: Terpisah dalam 2 Tab Terminal
Jika ingin memantau log backend dan frontend di tab terpisah:

- **Terminal 1 (Backend API):**
  ```bash
  npm run dev:backend
  ```
  *Server backend aktif di: `http://localhost:3001`*

- **Terminal 2 (Frontend UI):**
  ```bash
  npm run dev:frontend
  ```
  *Web client aktif di: `http://localhost:5173`*

---

### 5. Membuka Aplikasi
Buka browser dan akses alamat berikut:
- 🌐 **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- 🔌 **Backend Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)
- 📊 **Market Intel Endpoint**: [http://localhost:3001/api/market/intel](http://localhost:3001/api/market/intel)

---

### 6. Cara Login
1. Buka [http://localhost:5173](http://localhost:5173).
2. Anda akan diarahkan ke halaman login.
3. Klik tombol **"Lanjutkan dengan Google"** (*Sign in with Google*).
4. Selesai! Anda akan langsung masuk ke Dashboard CryptoOS.

---

### 7. Perintah Lainnya (Build & Lint)
- **Kompilasi Proyek (Production Build):**
  ```bash
  npm run build
  ```
- **Linting Kode:**
  ```bash
  npm run lint
  ```
- **Migrasi Database SQLite:**
  ```bash
  npm run db:migrate --workspace=backend
  ```
*(Database SQLite tersimpan secara lokal dan otomatis dibuat di `backend/data/cryptoos.db`)*
