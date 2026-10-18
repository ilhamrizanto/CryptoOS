# PRD — Crypto Investment & Trading Operating System (CryptoOS)

**Versi**: 1.0.0-draft  
**Tanggal**: 2026-10-18  
**Status**: Draft — Menunggu Approval  
**Owner**: [User]  
**Dibuat oleh**: Senior Analyst & Architect AI  

---

## 1. Visi Produk

**CryptoOS** adalah *personal decision cockpit* berbasis web yang dirancang khusus untuk seorang *discretionary crypto investor/trader* dengan pendekatan analisis multi-pilar (Makro → Fundamental → On-Chain → Price Action). Aplikasi ini **bukan** sistem otomasi trading, melainkan sebuah **pusat komando visual** yang menyatukan seluruh alat analisis, manajemen risiko, jurnal eksekusi, dan pembukuan investasi dalam satu antarmuka yang kohesif — dapat diakses dari mana saja via browser (desktop & mobile).

### Pernyataan Masalah

Saat ini, workflow analisis dan manajemen trading tersebar di banyak platform:
- Data makro di browser tab terpisah (FRED, CME FedWatch, DXY)
- Data fundamental di CoinGecko/DeFiLlama
- Analisis chart di TradingView
- On-chain derivatives di Coinglass
- Kalkulator posisi di Excel/kalkulator manual
- Jurnal di Google Sheets atau catatan tidak terstruktur
- Pembukuan portofolio dihitung manual

**Akibatnya**: Konteks analisis tercecer, keputusan tidak terdokumentasi secara sistematis, pola evaluasi sulit ditemukan, dan disiplin trading sulit dipertahankan.

### Solusi

Satu aplikasi web terpadu yang:
1. Mengagregasi data pasar & makroekonomi secara otomatis dari berbagai API
2. Menyediakan *Evidence Locker* untuk menyimpan screenshot analisis (TradingView, Coinglass)
3. Menghitung posisi dan risiko secara real-time dalam dual currency (USD & IDR)
4. Merekam jurnal trading dengan konteks analisis dan kondisi psikologi
5. Melacak portofolio real-time dari multiple exchange (Binance, Bybit, OKX)
6. Menyajikan laporan arus kas investasi yang akurat

---

## 2. Target Pengguna

**Single User — Personal App** (tidak multi-tenant)

| Dimensi | Deskripsi |
|---|---|
| **Profil** | Discretionary crypto investor/trader profesional |
| **Gaya Trading** | Combined: Long-term Core Portfolio + Tactical Swing Trading |
| **Exchange Aktif** | Binance, Bybit, OKX |
| **Akses Perangkat** | Desktop (analisis mendalam) + Mobile (monitoring & review) |
| **Tingkat Expertise** | Mahir — memahami semua metrik tanpa perlu penjelasan dasar |

---

## 3. Prinsip Desain Produk

1. **Decision Support, Bukan Decision Maker**: Sistem tidak pernah "melarang" atau "menyarankan" secara preskriptif. Keputusan akhir 100% ada di tangan pengguna.
2. **Speed of Review**: Setiap kartu analisis harus bisa di-*review* dalam <30 detik untuk menilai kelengkapan confluensi.
3. **Data Accuracy First**: Lebih baik menampilkan "Data tidak tersedia" daripada menampilkan data yang salah atau stale tanpa notifikasi.
4. **Frictionless Evidence Capture**: Menangkap screenshot bukti analisis harus semudah Ctrl+V.
5. **Dual Currency Native**: USD dan IDR ditampilkan berdampingan di seluruh modul secara konsisten.
6. **Mobile-First Responsiveness**: Seluruh fitur inti harus dapat dioperasikan dengan satu tangan di layar mobile.

---

## 4. Fitur & Modul Produk

### 4.1 Global Intelligence Panel (Makro & Sentiment Dashboard)

**Tujuan**: Panel otomatis yang selalu update di background, menampilkan kondisi pasar global sebagai konteks keputusan.

**Data yang Ditampilkan:**

| Data | Sumber API | Frekuensi Update |
|---|---|---|
| USD/IDR Kurs | ExchangeRate-API | Setiap 5 menit |
| DXY Index | Stooq / Alpha Vantage | Setiap 15 menit |
| WTI Crude Oil | EIA API / Alpha Vantage | Setiap hari |
| FOMC Current Rate | FRED API (DFF) | Real-time |
| Next FOMC Meeting Date | FRED API / Manual | Per rilis jadwal |
| CPI YoY (US) | FRED API (CPIAUCSL) | Per rilis bulanan |
| US Core Inflation | FRED API | Per rilis bulanan |
| Fear & Greed Index | Alternative.me | Setiap hari |
| BTC Dominance | CoinGecko | Setiap 5 menit |
| TOTAL3 Market Cap | CoinGecko | Setiap 5 menit |
| OTHERS Market Cap | CoinGecko | Setiap 5 menit |
| Altcoin Season Index | Blockchain Center API | Setiap hari |
| MVRV Z-Score | CoinGlass Public | Setiap hari |
| BTC Production Cost | MacroMicro (Embedded) | Per minggu |

**FedWatch Integration (Hybrid FRED + Manual):**
- Tampilkan: Current Fed Funds Rate, Tanggal FOMC berikutnya, Rate sebelumnya
- Tombol shortcut: [Buka CME FedWatch] (membuka tab baru ke CME)
- Input manual: Field "Ease Prob. %" / "No Change Prob. %" / "Hike Prob. %" yang diisi setelah membaca FedWatch
- Snapshot probabilitas ini tersimpan bersama setiap Trade Idea yang dibuat

**Acceptance Criteria:**
- [ ] Semua data memiliki timestamp "Diperbarui X menit lalu"
- [ ] Badge status: Live / Stale (>30 menit) / Error
- [ ] Jika API gagal, tampilkan data cache terakhir + notifikasi error non-blocking
- [ ] Panel dapat di-collapse di mobile

---

### 4.2 Pipeline & Idea Incubator

**Tujuan**: Wadah terstruktur untuk mendokumentasikan analisis 4 pilar sebelum keputusan eksekusi.

**Lifecycle Status Ide:**
```
WATCHLIST -> READY TO EXECUTE -> ACTIVE (Posisi Terbuka) -> CLOSED / INVALIDATED
```

**Pilar 1 — Makro (Auto-Fetch + Manual Confirmation)**
- Snapshot otomatis dari Global Intelligence Panel saat kartu dibuat
- Input manual: Probabilitas FedWatch (Ease/No Change/Hike %)
- Dropdown: FOMC Stance, DXY Trend, Oil Impact
- Catatan opsional

**Pilar 2 — Fundamental (Hybrid Auto + Manual)**
- Input ticker -> Auto-fetch via CoinGecko: Market Cap, FDV, Supply %, Volume 24H
- Jika ada di DeFiLlama: Protocol Revenue otomatis di-fetch
- Khusus BTC: Production Cost vs Current Price
- Semua field bisa di-override manual
- Catatan opsional

**Pilar 3 — Price Action (Manual + Screenshot)**
- Area paste screenshot TradingView (Ctrl+V / Drag & Drop)
- Checklist: Trend Aligned, Fibo Level, EMA 13/21, Std Deviation, Stoch RSI Div
- Catatan opsional

**Pilar 4 — On-Chain Evidence (Manual + Screenshot)**
- Area paste screenshot CVD/OI/Funding dari Coinglass (Ctrl+V)
- Area paste screenshot Liquidation Heatmap (Ctrl+V)
- Catatan opsional

**Rencana Eksekusi**
- Entry, Stop Loss, TP1, TP2, TP3 (opsional)
- Risk % dari Total Portfolio
- Tombol: [Hitung di Position Sizer] dan [Buat Trade Entry di Journal]

**Acceptance Criteria:**
- [ ] Auto-fetch fundamental selesai dalam <3 detik
- [ ] Paste screenshot berhasil dengan Ctrl+V tanpa klik tambahan
- [ ] Gambar disimpan di IndexedDB browser (bukan LocalStorage)
- [ ] Klik gambar membuka lightbox zoom full-screen
- [ ] Filter kartu berdasarkan status, pair, dan tanggal

---

### 4.3 Smart Position Size & Risk Calculator

**Input:**
- Total Portfolio (auto dari Portfolio Tracker, bisa override)
- Risk % per Trade (slider 0.1% - 5%, default dari Settings)
- Entry Price, Stop Loss, Take Profit 1 & 2
- Leverage (default: 1x = Spot)

**Output real-time:**
- SL Distance %, Dollar Risk, IDR Risk
- Position Size (USD & Koin), Margin Required
- Estimated Liquidation Price
- Risk:Reward Ratio
- Kelly Criterion Suggestion (jika ada >=10 trade closed)
- Total Open Risk Exposure (semua posisi aktif + posisi ini)

**Safety Alerts:**
- BAHAYA: Liquidation Price lebih dekat dari Stop Loss
- PERHATIAN: Total Exposure melebihi threshold
- PERHATIAN: Risk melebihi Kelly optimal

**Acceptance Criteria:**
- [ ] Semua output update instan saat input berubah (tanpa klik Calculate)
- [ ] Safety Alert tampil prominent secara visual
- [ ] Konversi IDR selalu menggunakan kurs live terbaru
- [ ] Kelly Criterion hanya tampil jika ada minimal 10 trade closed

---

### 4.4 Trading Journal & Execution Log

**Trade Entry (Open Position):**
- Data carry-over otomatis dari Idea Card + Position Sizer
- Emotional State Log:
  - Conviction Level: 1-5 bintang (slider)
  - Dominant Emotion: Confident / Calm / Anxious / FOMO / Uncertain / Greedy / Fearful
  - Setup Clarity: Crystal Clear / Some Doubt / Forced/Revenge
  - Free-text narasi psikologi (opsional)
- Tanggal & waktu entry

**Position Management (Ongoing):**
- Live PnL tracker (USD & IDR)
- Catatan mid-trade
- Partial Close log
- Breakeven Calculator otomatis setelah partial close

**Trade Close & Post-Mortem:**
- Exit Price, Tanggal Close
- Tag evaluasi: Sesuai Rencana / Early Exit / Late Exit / Stop Hit / TP Hit / Invalidasi
- Tag psikologi post-trade
- Catatan evaluasi (textarea)
- Output: Realized PnL, R-Multiple, Holding Duration

**Journal Analytics:**
- Win Rate (keseluruhan, per pair, per direction)
- Average R-Multiple, Profit Factor
- Emotional Pattern Analysis (Win Rate & Avg R per tag/conviction)
- Kalender aktivitas trading (GitHub contribution style)

**Acceptance Criteria:**
- [ ] Screenshot dari Idea Card terbawa ke Journal tanpa upload ulang
- [ ] Live PnL update setiap 30 detik
- [ ] Export journal ke CSV
- [ ] Filter & sort berdasarkan pair, direction, bulan, status, tag

---

### 4.5 Portfolio Rebalancing Matrix

**Struktur Alokasi (dikonfigurasi di Settings):**
- Core Holdings (Long-term): BTC, ETH, SOL, dll.
- Tactical Pool (Trading capital)
- Dry Powder (USDT/USDC/Cash)

**Fitur:**
- Target % vs Aktual % vs Delta per aset
- Visual drift bar: Overweight / On Target / Underweight
- Cadence tracker: "Hari ke-X dari Y | Next review: [Tanggal]"
- Action Plan Generator dengan nilai USD & IDR
- Riwayat snapshot rebalancing

**Acceptance Criteria:**
- [ ] Harga aset otomatis mengubah % aktual secara real-time
- [ ] Alert jika drift melebihi threshold (default: ±10%)
- [ ] Countdown hari menuju next review selalu terlihat

---

### 4.6 Real-Time Portfolio Tracker

**Sumber Data:**
- Exchange API (Read-Only Key): Binance, Bybit, OKX
- Manual Holdings: Aset di cold wallet / luar exchange

**Tampilan:**
- Total Net Worth (USD + IDR)
- Breakdown per exchange + manual
- Breakdown per aset dengan live price
- 24h PnL (USD + IDR + %)
- Pie chart alokasi aset

**Keamanan:**
- API Key & Secret disimpan di .env VPS (server-side)
- Tidak pernah dikirim ke browser
- Backend proxy yang melakukan request ke exchange

**Acceptance Criteria:**
- [ ] Harga aset terupdate setiap 30 detik
- [ ] API Key tidak pernah muncul di response browser
- [ ] Test connection button di Settings
- [ ] Graceful handling jika satu exchange error

---

### 4.7 Treasury & Investment Cashflow Ledger

**Jenis Transaksi:** DEPOSIT, WITHDRAWAL

**Kalkulasi:**
- Total Capital Injected = Sigma DEPOSIT - Sigma WITHDRAWAL
- True Net Profit (USD) = Current Net Worth - Total Capital Injected
- True Net Profit (IDR) = True Net Profit USD x Current Rate
- Total Return % = True Net Profit / Total Capital Injected x 100

**Catatan per transaksi:**
- Tanggal, jumlah (USD), kurs USD/IDR saat itu, nilai IDR, keterangan

**Acceptance Criteria:**
- [ ] Kurs USD/IDR tercatat pada tanggal transaksi (bukan kurs hari ini)
- [ ] High Water Mark tracker
- [ ] Grafik pertumbuhan modal bersih sepanjang waktu
- [ ] Export ke CSV

---

### 4.8 Settings & Configuration

| Setting | Tipe | Default |
|---|---|---|
| Default Risk % per Trade | Slider 0.1-5% | 1% |
| Max Total Exposure Alert | Input % | 5% |
| Rebalancing Cadence | Input hari | 60 |
| Target Alokasi Portofolio | Form per aset | — |
| Exchange API Keys | Form per exchange | — |
| Alpha Vantage API Key | Input | — |
| FRED API Key | Input | — |
| Timezone | Dropdown | Asia/Jakarta |
| Backup/Restore Data | JSON Export/Import | — |

---

## 5. Non-Functional Requirements

| Aspek | Requirement |
|---|---|
| **Performance** | First Contentful Paint < 1.5 detik; background fetch tidak blokir UI |
| **Responsiveness** | Fully functional di 320px - 2560px viewport |
| **Security** | API Key tidak di-expose ke client; HTTPS wajib di VPS; JWT auth |
| **Reliability** | Graceful degradation jika API provider down; cache tetap tampil |
| **Privacy** | Semua data di VPS sendiri; tidak ada third-party analytics |
| **Portability** | Data dapat di-export dan di-import sepenuhnya (no vendor lock-in) |

---

## 6. Out of Scope (v1)

- Automated trading / bot execution
- Push notification / alert
- Multi-user / multi-tenant
- Backtesting engine
- Tax calculation
- Staking yield tracking
- Airdrop tracking

---

## 7. Definition of Done (MVP)

- [ ] Semua 8 modul dapat dioperasikan end-to-end
- [ ] Global Intelligence Panel menampilkan minimal 10 dari 14 data feed
- [ ] Portfolio Tracker terhubung ke minimal 1 exchange
- [ ] Trade Idea dapat dibuat dengan screenshot dan dikirim ke Journal dalam <5 klik
- [ ] Position Sizer menampilkan kalkulasi dual currency dengan benar
- [ ] Auth login berjalan dan aplikasi tidak dapat diakses tanpa login
- [ ] Aplikasi responsif dan fungsional di mobile (iOS Safari & Android Chrome)
- [ ] Deployment via Docker Compose di VPS berhasil

---

## 8. Risiko & Mitigasi

| Risiko | Kemungkinan | Mitigasi |
|---|---|---|
| Exchange API CORS blocking | Tinggi | Backend proxy server |
| MVRV/BTC Production Cost tidak gratis | Medium | Fallback ke embedded chart atau manual |
| CME FedWatch tidak ada API | Pasti | Hybrid FRED + manual + link shortcut |
| CoinGecko rate limit (30 req/menit free) | Medium | Caching agresif di backend |
| IndexedDB screenshot rusak saat browser clear | Low | Warning; data JSON tetap aman di VPS |

---

*Dokumen ini adalah living document. Akan diupdate seiring development berlangsung.*
