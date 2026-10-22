# DEVELOPMENT_PLAN.md — CryptoOS Development Roadmap

**Versi**: 1.0.0  
**Tanggal**: 2026-10-18  
**Metodologi**: Milestone-based (bukan sprint Scrum), dengan approval checkpoint sebelum milestone berikutnya

---

## Prinsip Pengerjaan

Sesuai AI Specification Framework (Prinsip #2 & #7):
- **Specification before execution**: Setiap milestone dimulai dengan konfirmasi scope sebelum coding
- **Approval berbasis risiko**: Setiap milestone selesai membutuhkan review dan approval sebelum lanjut
- **Incremental delivery**: Setiap milestone menghasilkan sesuatu yang bisa dijalankan dan diuji

---

## Overview Milestone

```
M0  Foundation & Project Setup          [~1 hari]
M1  Auth + Infrastructure               [~1 hari]
M2  Global Intelligence Panel           [~2 hari]
M3  Pipeline & Idea Incubator           [~3 hari]
M4  Position Size Calculator            [~1 hari]
M5  Trading Journal                     [~2 hari]
M6  Portfolio Tracker (Exchange API)    [~2 hari]
M7  Portfolio Rebalancing Matrix        [~1 hari]
M8  Treasury & Cashflow Ledger          [~1 hari]
M9  Journal Analytics & Dashboard       [~2 hari]
M10 Mobile Responsiveness Polish        [~1 hari]
M11 Docker Compose & VPS Deployment     [~1 hari]
─────────────────────────────────────────────────
Total Estimasi MVP                      ~18 hari
```

---

## Milestone 0 — Foundation & Project Setup [COMPLETED]

**Tujuan**: Inisialisasi monorepo, tooling, dan design system foundation.

**Deliverables:**
- [x] Struktur folder monorepo (frontend/ + backend/ + docs/ + nginx/)
- [x] Frontend: Vite + React 18 + TypeScript terinstal
- [x] Backend: Express + TypeScript + Drizzle ORM terinstal
- [x] ESLint + Prettier dikonfigurasi (shared config)
- [x] Git repository diinisialisasi dengan .gitignore yang tepat
- [x] .env.example terdefinisi
- [x] CSS Design System Foundation:
  - Custom Properties (Color tokens, Typography, Spacing, Radius, Shadow)
  - CSS Reset & Base styles
  - Utility classes (DualCurrencyValue, value-number mono, status colors)
- [x] App shell: Topbar + Sidebar (desktop) + Bottom Nav (mobile) dengan routing

**Acceptance Criteria:**
- [x] `npm run dev` berhasil dijalankan di frontend dan backend secara bersamaan
- [x] App shell tampil dengan navigasi yang berfungsi di desktop dan mobile
- [x] Design tokens tersedia sebagai CSS variables di seluruh app

---

## Milestone 1 — Authentication & Security Layer [COMPLETED]

**Tujuan**: Aplikasi hanya dapat diakses oleh pemilik yang terautentikasi.

**Deliverables:**
- [x] Login page (desain terminal-style, minimalis)
- [x] Backend: POST /api/auth/login (verifikasi password vs MASTER_PASSWORD_HASH di .env)
- [x] Backend: POST /api/auth/logout
- [x] Backend: GET /api/auth/verify (cek validitas JWT)
- [x] JWT disimpan di browser (localStorage)
- [x] Auth middleware di backend (semua route kecuali /auth/* wajib terautentikasi)
- [x] Frontend route guard: redirect ke /login jika belum auth
- [x] Auto-logout jika JWT expired

**Acceptance Criteria:**
- [x] Tanpa login, semua halaman redirect ke /login
- [x] Setelah login berhasil, user diarahkan ke Dashboard
- [x] Refresh halaman tetap logged-in (token persist)
- [x] Token expired -> otomatis redirect ke /login dengan pesan "Sesi habis"

---

## Milestone 2 — Global Intelligence Panel [COMPLETED]

**Tujuan**: Panel data pasar global yang berjalan otomatis di background.

**Deliverables Backend:**
- [x] GET /api/market/intel — Return aggregated market data (semua data di bawah)
- [x] Market Service dengan in-memory cache per data type (lihat TTL di ARCHITECTURE.md)
- [x] Integration:
  - ExchangeRate-API: USD/IDR
  - FRED API: DFF (Fed Funds Rate), CPIAUCSL, DFII10
  - Stooq API: DXY (^DXY)
  - EIA / Alpha Vantage: WTI Oil
  - Alternative.me: Fear & Greed Index
  - CoinGecko: BTC Dominance, TOTAL2, Global market data
  - Blockchain Center API: Altcoin Season Index
  - CoinGlass Public: MVRV Z-Score (jika tersedia, fallback manual)
- [x] Endpoint GET /api/market/fedwatch — Return FRED data + slot manual FedWatch probability

**Deliverables Frontend:**
- [x] GlobalIntelligencePanel component
- [x] DataCard component per metrik (dengan DataStatusBadge)
- [x] FedWatch card: FRED data + input field probabilitas + link CME
- [x] Polling setiap 5 menit via TanStack Query
- [x] Collapse/expand panel di mobile

**Acceptance Criteria:**
- [x] Panel tampil di semua halaman (sticky atau embedded di dashboard)
- [x] Setiap metrik menampilkan timestamp update
- [x] Jika API gagal, data cache terakhir tetap tampil + error badge
- [x] FedWatch probability yang diinput tersimpan ke database
- [x] USD/IDR rate ter-refresh setiap 5 menit

---

## Milestone 3 — Pipeline & Idea Incubator [COMPLETED]

**Tujuan**: Wadah dokumentasi analisis 4-pilar dengan evidence screenshot.

**Deliverables Backend:**
- [x] GET /api/ideas — List semua idea dengan filter status, symbol, tanggal
- [x] POST /api/ideas — Buat idea baru
- [x] GET /api/ideas/:id — Detail idea
- [x] PATCH /api/ideas/:id — Update idea (status change, edit)
- [x] DELETE /api/ideas/:id — Hapus idea (soft delete)
- [x] GET /api/market/coin/search?q= — Proxy CoinGecko search
- [x] GET /api/market/coin/:coinId/fundamental — Proxy CoinGecko + DeFiLlama fundamental data
- [x] POST /api/ideas/:id/to-journal — Convert idea ke journal entry

**Deliverables Frontend:**
- [x] Pipeline page: Kanban-style list/grid kartu per status
- [x] TradeIdeaCard component (compact view)
- [x] IdeaForm (create/edit) — full 4-pilar form:
  - Ticker search dengan auto-complete + auto-fetch fundamental
  - Pilar 1 Makro: Auto-snapshot dari Intelligence Panel + override
  - Pilar 2 Fundamental: Auto-fill + override fields
  - Pilar 3 PA: Checklist + EvidencePasteZone (Ctrl+V)
  - Pilar 4 On-Chain: EvidencePasteZone x2 + notes
  - Execution Plan: Entry, SL, TP1/2/3
- [x] EvidencePasteZone component:
  - onPaste event listener
  - Drag & drop support
  - Simpan ke IndexedDB (idb)
  - Thumbnail display
  - Lightbox modal zoom
- [x] Status transition buttons (WATCHLIST -> READY -> ACTIVE -> CLOSED/INVALIDATED)
- [x] Filter & sort panel

**Acceptance Criteria:**
- [x] Ctrl+V di dalam form langsung menempel gambar di zone yang aktif/fokus
- [x] Gambar tersimpan di IndexedDB, ID disimpan di backend
- [x] Auto-fetch fundamental selesai dalam <3 detik setelah coin dipilih
- [x] Khusus BTC: Field production cost otomatis muncul
- [x] Card dapat di-filter berdasarkan status, symbol, dan tanggal
- [x] Tombol [→ Journal] membuat draft journal entry dengan seluruh data terbawa

---

## Milestone 4 — Smart Position Size & Risk Calculator [COMPLETED]

**Tujuan**: Kalkulator ukuran posisi real-time dengan dual currency dan safety alerts.

**Deliverables Backend:**
- [x] GET /api/portfolio/total — Total portfolio value (untuk default input)
- [x] GET /api/journal/stats/open-risk — Total risk exposure dari posisi aktif

**Deliverables Frontend:**
- [x] CalculatorPage dengan split layout (input kiri, output kanan)
- [x] useCalculator hook — semua logika kalkulasi dalam useMemo (zero lag)
- [x] Kalkulasi real-time:
  - SL Distance %, Dollar Risk, IDR Risk
  - Position Size (USD & Koin), Margin Required
  - Estimated Liquidation Price
  - R:R Ratio
  - Kelly Criterion (dari stats journal)
  - Total Open Risk Exposure
- [x] Safety Alert components (3 tipe: ERROR/WARNING/INFO)
- [x] [→ Log to Journal] button
- [x] [Dari Idea Card] prefill option

**Acceptance Criteria:**
- [x] Semua output terupdate dalam <50ms saat nilai input berubah
- [x] Liquidation price warning tampil prominent jika liq > sl
- [x] IDR conversion menggunakan rate live dari cache
- [x] Kelly Suggestion hanya tampil jika ada >=10 closed trade
- [x] Tombol log to journal membuka journal dengan data pre-filled

---

## Milestone 5 — Trading Journal & Execution Log [COMPLETED]

**Tujuan**: Rekaman lengkap lifecycle trade dari open hingga close dengan post-mortem.

**Deliverables Backend:**
- [x] GET /api/journal — List entries (filter: status, symbol, direction, bulan)
- [x] POST /api/journal — Buat entry baru (manual atau dari idea/calculator)
- [x] GET /api/journal/:id — Detail entry
- [x] PATCH /api/journal/:id — Update (mid-trade notes, partial close)
- [x] POST /api/journal/:id/close — Close trade (input exit price, tags)
- [x] GET /api/journal/stats — Aggregated stats (win rate, avg R, profit factor)

**Deliverables Frontend:**
- [x] JournalPage: Tab "Posisi Aktif" dan "Riwayat Closed"
- [x] JournalEntryCard: Compact view dengan live PnL badge
- [x] JournalEntryDetail: Full view dengan semua data + evidence
- [x] EmotionalStateForm component (conviction slider + emotion tags + clarity + notes)
- [x] LivePnLTracker: Polling harga setiap 30 detik, highlight flash saat update
- [x] CloseTradeModal: Input exit price + eval tags + psych tags + notes
- [x] PostMortemView: Summary setelah trade closed (PnL, R-Multiple, duration, tags)
- [x] RMultiple display: +2.3R (green) / -1.0R (red) dengan font mono

**Acceptance Criteria:**
- [x] Entry dari Calculator/Idea membawa seluruh data termasuk screenshots
- [x] Live PnL update setiap 30 detik tanpa refresh halaman
- [x] R-Multiple terhitung benar: (exit - entry) / (entry - sl)
- [x] Emotional tags tersimpan dan dapat difilter
- [x] Export seluruh journal ke CSV

---

## Milestone 6 — Real-Time Portfolio Tracker (Exchange Integration) [COMPLETED]

**Tujuan**: Tampilan portofolio real-time dari Binance, Bybit, OKX, dan manual holdings.

**Deliverables Backend:**
- [x] GET /api/portfolio/balances — Fetch dari semua exchange yang terkonfigurasi + manual
- [x] GET /api/portfolio/prices — Live prices untuk semua aset di portfolio
- [x] POST /api/portfolio/manual — Tambah manual holding (cold wallet)
- [x] PATCH /api/portfolio/manual/:id — Update manual holding
- [x] DELETE /api/portfolio/manual/:id — Hapus manual holding
- [x] GET /api/portfolio/settings/exchanges — List configured exchanges (tanpa secrets)
- [x] Exchange Service: adapter per exchange (BinanceAdapter, BybitAdapter, OKXAdapter)
  - Signed request generation (HMAC SHA256) dengan key dari .env
  - Fetch account balances endpoint per exchange

**Deliverables Frontend:**
- [x] PortfolioPage: Total Net Worth (USD + IDR) — hero number
- [x] BreakdownTable: Per aset (symbol, quantity, avg cost, current price, value, 24h change)
- [x] AllocationPieChart: Visual distribusi aset
- [x] ExchangeBreakdownCards: Per exchange + manual
- [x] ManualHoldingForm: Tambah/edit aset luar exchange
- [x] Auto-refresh setiap 30 detik

**Acceptance Criteria:**
- [x] API Key tidak pernah tampil di browser (hanya backend yang tahu)
- [x] Jika satu exchange gagal, exchange lain tetap tampil dengan error badge
- [x] Total Net Worth = Exchange balances + Manual holdings (dinilai ke USD)
- [x] 24h PnL dihitung dari harga 24h lalu vs sekarang

---

## Milestone 7 — Portfolio Rebalancing Matrix [COMPLETED]

**Tujuan**: Alat visualisasi dan perencanaan rebalancing portfolio.

**Deliverables Backend:**
- [x] GET /api/rebalancing/targets — Target alokasi
- [x] PUT /api/rebalancing/targets — Update target alokasi
- [x] GET /api/rebalancing/analysis — Aktual vs target + drift + action plan
- [x] POST /api/rebalancing/snapshot — Simpan snapshot rebalancing
- [x] GET /api/rebalancing/history — Riwayat snapshot

**Deliverables Frontend:**
- [x] RebalancingPage: Tabel alokasi dengan drift visualization
- [x] DriftBar component: Visual bar overweight/underweight
- [x] CadenceTracker: "Hari ke-X dari Y | Next Review: [Tanggal]" dengan countdown
- [x] ActionPlanCard: Rekomendasi jual/beli per aset (USD + IDR)
- [x] SnapshotHistory: Riwayat rebalancing sebelumnya

**Acceptance Criteria:**
- [x] Perubahan harga aset otomatis mengubah % aktual secara real-time
- [x] Alert visual jika drift > ±10% (dapat dikonfigurasi di Settings)
- [x] Action plan menghitung nilai yang harus dijual/dibeli untuk mencapai target
- [x] Snapshot tersimpan dengan tanggal dan bisa dilihat kembali

---

## Milestone 8 — Treasury & Cashflow Ledger [COMPLETED]

**Deliverables Backend:**
- [x] GET /api/cashflow — List semua transaksi
- [x] POST /api/cashflow — Tambah transaksi (DEPOSIT/WITHDRAWAL)
- [x] DELETE /api/cashflow/:id — Hapus transaksi
- [x] GET /api/cashflow/summary — Total injected, true net profit, return %

**Deliverables Frontend:**
- [x] CashflowPage: Summary cards + tabel transaksi
- [x] SummaryCards: Capital Injected, Current Net Worth, True Net Profit (USD+IDR), Return %
- [x] HighWaterMark tracker
- [x] NetWorthChart: Grafik garis pertumbuhan Net Worth vs Capital Injected
- [x] TransactionForm: Input DEPOSIT/WITHDRAWAL
- [x] Export ke CSV

**Acceptance Criteria:**
- [x] Kurs IDR saat transaksi tersimpan (bukan kurs hari ini)
- [x] True Net Profit = Net Worth - Capital Injected (bukan total return gross)
- [x] High Water Mark terupdate otomatis

---

## Milestone 9 — Journal Analytics & Main Dashboard [COMPLETED]

**Deliverables Backend:**
- [x] GET /api/journal/analytics — Comprehensive stats
  - Win rate overall, per pair, per direction
  - Avg R-Multiple (win/loss), Profit Factor
  - Emotional pattern analysis (win rate per emotion tag, per conviction level)
  - Monthly/yearly performance
  - Best/worst pairs

**Deliverables Frontend:**
- [x] Dashboard (halaman utama): Command Center overview
  - Net Worth hero (USD + IDR) dengan 24h delta
  - Mini Intelligence Panel strip
  - Open Positions summary
  - Rebalancing status widget
  - Recent activity feed
- [x] JournalAnalyticsPage:
  - Performance summary cards
  - Win Rate charts (bar chart per pair, per month)
  - R-Multiple distribution chart
  - Emotional Pattern heatmap (conviction vs win rate)
  - Trading Calendar (contribution-style heatmap)

**Acceptance Criteria:**
- [x] Dashboard memberikan overview lengkap dalam <5 detik setelah login
- [x] Emotional pattern analysis hanya tampil jika ada >=5 closed trades dengan emotional data
- [x] Semua chart responsif di mobile

---

## Milestone 10 — Mobile Polish & PWA [COMPLETED]

**Deliverables:**
- [x] Review dan perbaikan responsiveness semua halaman di 375px, 414px, 768px
- [x] Bottom Navigation mobile yang smooth
- [x] Touch targets audit (minimum 44x44px)
- [x] Swipe gesture di Journal cards
- [x] Pull-to-refresh di Portfolio
- [x] PWA manifest.json + service worker (offline shell)
- [x] "Add to Home Screen" prompt

**Acceptance Criteria:**
- [x] Semua halaman fungsional di iPhone SE (375px) dan iPad (768px)
- [x] No horizontal scroll yang tidak disengaja
- [x] Keyboard angka muncul otomatis di semua numeric input

---

## Milestone 11 — Docker Compose & VPS Deployment [COMPLETED]

**Deliverables:**
- [x] Dockerfile (frontend — multi-stage build)
- [x] Dockerfile (backend — multi-stage build)
- [x] docker-compose.yml (development)
- [x] docker-compose.prod.yml (production)
- [x] nginx/nginx.conf (reverse proxy + static file serving)
- [x] .env.example (dokumentasi semua environment variable)
- [x] README.md / DEPLOYMENT_GUIDE.md: Panduan deployment step-by-step
- [x] Database backup script (SQLite file copy)

**Acceptance Criteria:**
- [x] `docker-compose -f docker-compose.prod.yml up -d` berhasil di VPS
- [x] HTTPS berjalan via Let's Encrypt
- [x] Aplikasi dapat diakses dari browser mobile via domain/IP VPS
- [x] SQLite database ter-persist meski container di-restart
- [x] Backend .env tidak tersimpan di git repository

---

## Checkpoint & Approval Gates

```
M0 Selesai → Review app shell + design tokens → Lanjut M1
M1 Selesai → Test auth flow → Lanjut M2
M2 Selesai → Review data feeds (mana yang berhasil & mana yang perlu fallback) → Lanjut M3
M3 Selesai → Review pipeline form + screenshot paste → Lanjut M4
M4 Selesai → Review kalkulasi + safety alerts → Lanjut M5
M5 Selesai → Review journal lifecycle end-to-end → Lanjut M6
M6 Selesai → Test koneksi exchange + keamanan API key → Lanjut M7
M7-M8 Selesai → Review rebalancing + cashflow → Lanjut M9
M9 Selesai → Review analytics + dashboard → Lanjut M10
M10 Selesai → Mobile UX review → Lanjut M11
M11 Selesai → DEPLOYMENT & USER ACCEPTANCE TEST → MVP DONE
```

---

## Technical Debt & Known Constraints

| Item | Catatan |
|---|---|
| CME FedWatch | Tidak ada API publik; menggunakan FRED + manual input hybrid |
| CoinGecko Free Tier | Rate limit 30 req/menit; mitigasi via aggressive caching di backend |
| MVRV Z-Score | Data gratis terbatas; fallback ke manual input jika endpoint tidak available |
| BTC Production Cost | Update mingguan; bisa embedded dari MacroMicro atau manual input |
| Altcoin Season Index | Blockchain Center API bisa berubah; siapkan fallback manual |
| Screenshot IndexedDB | Tidak ter-backup via JSON export; dokumentasikan limitasi ini ke user |

---

*Dokumen ini adalah living document. Update seiring progress pengerjaan.*
