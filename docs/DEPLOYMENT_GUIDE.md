# 🚀 Panduan Deployment Produksi VPS CryptoOS

Dokumen ini menjelaskan langkah-langkah lengkap untuk melakukan deployment sistem **CryptoOS** ke Virtual Private Server (VPS) produksi menggunakan Docker Compose, Nginx Reverse Proxy, dan sertifikat SSL Let's Encrypt.

---

## 1. Spesifikasi Server yang Direkomendasikan

| Komponen | Spesifikasi Minimum | Rekomendasi Produksi |
| :--- | :--- | :--- |
| **Sistem Operasi** | Ubuntu 22.04 LTS / Debian 12 | Ubuntu 24.04 LTS |
| **CPU** | 1 vCPU | 2 vCPU |
| **RAM** | 1 GB (dengan Swap 2 GB) | 2 GB - 4 GB |
| **Penyimpanan** | 20 GB SSD | 40 GB NVMe SSD |
| **Bandwidth** | 1 TB/bulan | Unlimited / 2 TB+ |

---

## 2. Persiapan Awal di VPS (Prerequisites)

Masuk ke VPS via SSH:
```bash
ssh root@IP_VPS_ANDA
```

Update repositori paket dan instal Git, Docker, serta Docker Compose:
```bash
# Update paket
sudo apt update && sudo apt upgrade -y

# Instal dependencies dasar
sudo apt install -y curl git ufw fail2ban

# Instal Docker via script resmi
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Pasang Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Konfigurasi firewall UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (SSL ACME Challenge)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 3. Clone Repository & Konfigurasi Lingkungan (`.env`)

Clone repositori proyek ke direktori `/opt/cryptoos` atau home user:
```bash
cd /opt
git clone <URL_REPOSITORY_ANDA> cryptoos
cd cryptoos
```

Salin file contoh konfigurasi lingkungan:
```bash
cp .env.example .env
```

Buka file `.env` dengan editor (misal `nano .env`) dan atur nilai produksi:
```ini
# ==========================================
# CryptoOS Environment Configuration (.env)
# ==========================================

# Auth & Keamanan
# Generate JWT Secret acak: openssl rand -base64 32
JWT_SECRET=rahasia_jwt_super_aman_minimal_32_karakter_acak

# Password Master Hash (bcrypt hash dari password pilihan Anda)
# Anda bisa generate hash dengan: node -e "console.log(require('bcryptjs').hashSync('PASSWORD_ANDA', 10))"
MASTER_PASSWORD_HASH=$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Exchange API Keys (Opsional - Cukup READ-ONLY)
BINANCE_API_KEY=
BINANCE_API_SECRET=
BYBIT_API_KEY=
BYBIT_API_SECRET=
OKX_API_KEY=
OKX_API_SECRET=
OKX_PASSPHRASE=

# Data Pasar Eksternal
FRED_API_KEY=
ALPHA_VANTAGE_KEY=
EXCHANGERATE_API_KEY=

# Aplikasi
NODE_ENV=production
PORT=3001
DATABASE_PATH=/app/data/cryptoos.db
CORS_ORIGIN=https://domain-anda.com
```

---

## 4. Menjalankan Aplikasi via Docker Compose

Beri izin eksekusi pada script deployment dan jalankan:
```bash
chmod +x deploy.sh
./deploy.sh
```

Atau jalankan secara manual:
```bash
docker compose up -d --build
```

Periksa status container:
```bash
docker compose ps
```
Hasil yang diharapkan:
- `backend` (Status: Up)
- `frontend` (Status: Up)
- `nginx` (Status: Up, Ports: 0.0.0.0:80->80, 0.0.0.0:443->443)

---

## 5. Konfigurasi Domain & Sertifikat SSL Let's Encrypt

1. Pastikan domain Anda (misal `cryptoos.yourdomain.com`) sudah mengarah ke IP publik VPS Anda (DNS A Record).
2. Dapatkan sertifikat SSL menggunakan Certbot:
```bash
docker run -it --rm --name certbot \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d cryptoos.yourdomain.com \
  --email email_anda@example.com --agree-tos --no-eff-email
```

3. Update konfigurasi `nginx/nginx.conf` untuk mengaktifkan HTTPS port 443:
```nginx
server {
    listen 80;
    server_name cryptoos.yourdomain.com;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name cryptoos.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/cryptoos.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptoos.yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /api/ {
        proxy_pass http://backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location / {
        proxy_pass http://frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

4. Reload konfigurasi Nginx:
```bash
docker compose exec nginx nginx -s reload
```

---

## 6. Automasi Backup Database SQLite

Database CryptoOS menggunakan SQLite WAL yang tersimpan di `./backend/data/cryptoos.db`. Untuk mengamankan data transaksi dan jurnal Anda, buat cronjob harian:

```bash
# Buka crontab
crontab -e

# Tambahkan baris berikut untuk backup otomatis setiap jam 02:00 pagi
0 2 * * * cp /opt/cryptoos/backend/data/cryptoos.db /opt/cryptoos/backend/data/backup_$(date +\%F_\%H\%M).db && find /opt/cryptoos/backend/data/ -name "backup_*.db" -mtime +14 -delete
```
*Baris ini akan menyimpan backup database harian dan otomatis menghapus backup yang lebih tua dari 14 hari.*

---

## 7. Pemantauan & Maintenance

- **Cek log backend secara real-time:**
  ```bash
  docker compose logs -f backend
  ```
- **Restart layanan setelah pembaruan kode:**
  ```bash
  git pull origin main
  docker compose up -d --build
  ```
- **Cek penggunaan sumber daya:**
  ```bash
  docker stats
  ```
