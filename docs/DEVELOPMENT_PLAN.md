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

## Milestone 0 — Foundation & Project Setup

**Tujuan**: Inisialisasi monorepo, tooling, dan design system foundation.

**Deliverables:**
- [ ] Struktur folder monorepo (frontend/ + backend/ + docs/ + nginx/)
- [ ] Frontend: Vite + React 18 + TypeScript terinstal
- [ ] Backend: Express + TypeScript + Drizzle ORM terinstal
- [ ] ESLint + Prettier dikonfigurasi (shared config)
- [ ] Git repository diinisialisasi dengan .gitignore yang tepat
- [ ] .env.example terdefinisi
- [ ] CSS Design System Foundation:
  - Custom Properties (Color tokens, Typography, Spacing, Radius, Shadow)
  - CSS Reset & Base styles
  - Utility classes (DualCurrencyValue, value-number mono, status colors)
- [ ] App shell: Topbar + Sidebar (desktop) + Bottom Nav (mobile) dengan routing

**Acceptance Criteria:**
- [ ] `npm run dev` berhasil dijalankan di frontend dan backend secara bersamaan
- [ ] App shell tampil dengan navigasi yang berfungsi di desktop dan mobile
- [ ] Design tokens tersedia sebagai CSS variables di seluruh app

---

## Milestone 1 — Authentication & Security Layer

**Tujuan**: Aplikasi hanya dapat diakses oleh pemilik yang terautentikasi.

**Deliverables:**
- [ ] Login page (desain terminal-style, minimalis)
- [ ] Backend: POST /api/auth/login (verifikasi password vs MASTER_PASSWORD_HASH di .env)
- [ ] Backend: POST /api/auth/logout
- [ ] Backend: GET /api/auth/verify (cek validitas JWT)
- [ ] JWT disimpan di browser (httpOnly cookie atau localStorage — default localStorage)
- [ ] Auth middleware di backend (semua route kecuali /auth/* wajib terautentikasi)
- [ ] Frontend route guard: redirect ke /login jika belum auth
- [ ] Auto-logout jika JWT expired

**Acceptance Criteria:**
- [ ] Tanpa login, semua halaman redirect ke /login
- [ ] Setelah login berhasil, user diarahkan ke Dashboard
- [ ] Refresh halaman tetap logged-in (token persist)
- [ ] Token expired -> otomatis redirect ke /login dengan pesan "Sesi habis"

---

## Milestone 2 — Global Intelligence Panel

**Tujuan**: Panel data pasar global yang berjalan otomatis di background.

**Deliverables Backend:**
- [ ] GET /api/market/intel — Return aggregated market data (semua data di bawah)
- [ ] Market Service dengan in-memory cache per data type (lihat TTL di ARCHITECTURE.md)
- [ ] Integration:
  - ExchangeRate-API: USD/IDR
  - FRED API: DFF (Fed Funds Rate), CPIAUCSL, DFII10
  - Stooq API: DXY (^DXY)
  - EIA / Alpha Vantage: WTI Oil
  - Alternative.me: Fear & Greed Index
  - CoinGecko: BTC Dominance, TOTAL2, Global market data
  - Blockchain Center API: Altcoin Season Index
  - CoinGlass Public: MVRV Z-Score (jika tersedia, fallback manual)
- [ ] Endpoint GET /api/market/fedwatch — Return FRED data + slot manual FedWatch probability

**Deliverables Frontend:**
- [ ] GlobalIntelligencePanel component
- [ ] DataCard component per metrik (dengan DataStatusBadge)
- [ ] FedWatch card: FRED data + input field probabilitas + link CME
- [ ] Polling setiap 5 menit via TanStack Query
- [ ] Collapse/expand panel di mobile

**Acceptance Criteria:**
- [ ] Panel tampil di semua halaman (sticky atau embedded di dashboard)
- [ ] Setiap metrik menampilkan timestamp update
- [ ] Jika API gagal, data cache terakhir tetap tampil + error badge
- [ ] FedWatch probability yang diinput tersimpan ke database
- [ ] USD/IDR rate ter-refresh setiap 5 menit

---

## Milestone 3 — Pipeline & Idea Incubator

**Tujuan**: Wadah dokumentasi analisis 4-pilar dengan evidence screenshot.

**Deliverables Backend:**
- [ ] GET /api/ideas — List semua idea dengan filter status, symbol, tanggal
- [ ] POST /api/ideas — Buat idea baru
- [ ] GET /api/ideas/:id — Detail idea
- [ ] PATCH /api/ideas/:id — Update idea (status change, edit)
- [ ] DELETE /api/ideas/:id — Hapus idea (soft delete)
- [ ] GET /api/market/coin/search?q= — Proxy CoinGecko search
- [ ] GET /api/market/coin/:coinId/fundamental — Proxy CoinGecko + DeFiLlama fundamental data
- [ ] POST /api/ideas/:id/to-journal — Convert idea ke journal entry

**Deliverables Frontend:**
- [ ] Pipeline page: Kanban-style list/grid kartu per status
- [ ] TradeIdeaCard component (compact view)
- [ ] IdeaForm (create/edit) — full 4-pilar form:
  - Ticker search dengan auto-complete + auto-fetch fundamental
  - Pilar 1 Makro: Auto-snapshot dari Intelligence Panel + override
  - Pilar 2 Fundamental: Auto-fill + override fields
  - Pilar 3 PA: Checklist + EvidencePasteZone (Ctrl+V)
  - Pilar 4 On-Chain: EvidencePasteZone x2 + notes
  - Execution Plan: Entry, SL, TP1/2/3
- [ ] EvidencePasteZone component:
  - onPaste event listener
  - Drag & drop support
  - Simpan ke IndexedDB (idb)
  - Thumbnail display
  - Lightbox modal zoom
- [ ] Status transition buttons (WATCHLIST -> READY -> ACTIVE -> CLOSED/INVALIDATED)
- [ ] Filter & sort panel

**Acceptance Criteria:**
- [ ] Ctrl+V di dalam form langsung menempel gambar di zone yang aktif/fokus
- [ ] Gambar tersimpan di IndexedDB, ID disimpan di backend
- [ ] Auto-fetch fundamental selesai dalam <3 detik setelah coin dipilih
- [ ] Khusus BTC: Field production cost otomatis muncul
- [ ] Card dapat di-filter berdasarkan status, symbol, dan tanggal
- [ ] Tombol [→ Journal] membuat draft journal entry dengan seluruh data terbawa

---

## Milestone 4 — Smart Position Size & Risk Calculator

**Tujuan**: Kalkulator ukuran posisi real-time dengan dual currency dan safety alerts.

**Deliverables Backend:**
- [ ] GET /api/portfolio/total — Total portfolio value (untuk default input)
- [ ] GET /api/journal/stats/open-risk — Total risk exposure dari posisi aktif

**Deliverables Frontend:**
- [ ] CalculatorPage dengan split layout (input kiri, output kanan)
- [ ] useCalculator hook — semua logika kalkulasi dalam useMemo (zero lag)
- [ ] Kalkulasi real-time:
  - SL Distance %, Dollar Risk, IDR Risk
  - Position Size (USD & Koin), Margin Required
  - Estimated Liquidation Price
  - R:R Ratio
  - Kelly Criterion (dari stats journal)
  - Total Open Risk Exposure
- [ ] Safety Alert components (3 tipe: ERROR/WARNING/INFO)
- [ ] [→ Log to Journal] button
- [ ] [Dari Idea Card] prefill option

**Acceptance Criteria:**
- [ ] Semua output terupdate dalam <50ms saat nilai input berubah
- [ ] Liquidation price warning tampil prominent jika liq > sl
- [ ] IDR conversion menggunakan rate live dari cache
- [ ] Kelly Suggestion hanya tampil jika ada >=10 closed trade
- [ ] Tombol log to journal membuka journal dengan data pre-filled

---

## Milestone 5 — Trading Journal & Execution Log

**Tujuan**: Rekaman lengkap lifecycle trade dari open hingga close dengan post-mortem.

**Deliverables Backend:**
- [ ] GET /api/journal — List entries (filter: status, symbol, direction, bulan)
- [ ] POST /api/journal — Buat entry baru (manual atau dari idea/calculator)
- [ ] GET /api/journal/:id — Detail entry
- [ ] PATCH /api/journal/:id — Update (mid-trade notes, partial close)
- [ ] POST /api/journal/:id/close — Close trade (input exit price, tags)
- [ ] GET /api/journal/stats — Aggregated stats (win rate, avg R, profit factor)

**Deliverables Frontend:**
- [ ] JournalPage: Tab "Posisi Aktif" dan "Riwayat Closed"
- [ ] JournalEntryCard: Compact view dengan live PnL badge
- [ ] JournalEntryDetail: Full view dengan semua data + evidence
- [ ] EmotionalStateForm component (conviction slider + emotion tags + clarity + notes)
- [ ] LivePnLTracker: Polling harga setiap 30 detik, highlight flash saat update
- [ ] CloseTradeModal: Input exit price + eval tags + psych tags + notes
- [ ] PostMortemView: Summary setelah trade closed (PnL, R-Multiple, duration, tags)
- [ ] RMultiple display: +2.3R (green) / -1.0R (red) dengan font mono

**Acceptance Criteria:**
- [ ] Entry dari Calculator/Idea membawa seluruh data termasuk screenshots
- [ ] Live PnL update setiap 30 detik tanpa refresh halaman
- [ ] R-Multiple terhitung benar: (exit - entry) / (entry - sl)
- [ ] Emotional tags tersimpan dan dapat difilter
- [ ] Export seluruh journal ke CSV

---

## Milestone 6 — Real-Time Portfolio Tracker (Exchange Integration)

**Tujuan**: Tampilan portofolio real-time dari Binance, Bybit, OKX, dan manual holdings.

**Deliverables Backend:**
- [ ] GET /api/portfolio/balances — Fetch dari semua exchange yang terkonfigurasi + manual
- [ ] GET /api/portfolio/prices — Live prices untuk semua aset di portfolio
- [ ] POST /api/portfolio/manual — Tambah manual holding (cold wallet)
- [ ] PATCH /api/portfolio/manual/:id — Update manual holding
- [ ] DELETE /api/portfolio/manual/:id — Hapus manual holding
- [ ] GET /api/portfolio/settings/exchanges — List configured exchanges (tanpa secrets)
- [ ] Exchange Service: adapter per exchange (BinanceAdapter, BybitAdapter, OKXAdapter)
  - Signed request generation (HMAC SHA256) dengan key dari .env
  - Fetch account balances endpoint per exchange

**Deliverables Frontend:**
- [ ] PortfolioPage: Total Net Worth (USD + IDR) — hero number
- [ ] BreakdownTable: Per aset (symbol, quantity, avg cost, current price, value, 24h change)
- [ ] AllocationPieChart: Visual distribusi aset
- [ ] ExchangeBreakdownCards: Per exchange + manual
- [ ] ManualHoldingForm: Tambah/edit aset luar exchange
- [ ] Auto-refresh setiap 30 detik

**Acceptance Criteria:**
- [ ] API Key tidak pernah tampil di browser (hanya backend yang tahu)
- [ ] Jika satu exchange gagal, exchange lain tetap tampil dengan error badge
- [ ] Total Net Worth = Exchange balances + Manual holdings (dinilai ke USD)
- [ ] 24h PnL dihitung dari harga 24h lalu vs sekarang

---

## Milestone 7 — Portfolio Rebalancing Matrix

**Tujuan**: Alat visualisasi dan perencanaan rebalancing portfolio.

**Deliverables Backend:**
- [ ] GET /api/rebalancing/targets — Target alokasi
- [ ] PUT /api/rebalancing/targets — Update target alokasi
- [ ] GET /api/rebalancing/analysis — Aktual vs target + drift + action plan
- [ ] POST /api/rebalancing/snapshot — Simpan snapshot rebalancing
- [ ] GET /api/rebalancing/history — Riwayat snapshot

**Deliverables Frontend:**
- [ ] RebalancingPage: Tabel alokasi dengan drift visualization
- [ ] DriftBar component: Visual bar overweight/underweight
- [ ] CadenceTracker: "Hari ke-X dari Y | Next Review: [Tanggal]" dengan countdown
- [ ] ActionPlanCard: Rekomendasi jual/beli per aset (USD + IDR)
- [ ] SnapshotHistory: Riwayat rebalancing sebelumnya

**Acceptance Criteria:**
- [ ] Perubahan harga aset otomatis mengubah % aktual secara real-time
- [ ] Alert visual jika drift > ±10% (dapat dikonfigurasi di Settings)
- [ ] Action plan menghitung nilai yang harus dijual/dibeli untuk mencapai target
- [ ] Snapshot tersimpan dengan tanggal dan bisa dilihat kembali

---

## Milestone 8 — Treasury & Cashflow Ledger

**Deliverables Backend:**
- [ ] GET /api/cashflow — List semua transaksi
- [ ] POST /api/cashflow — Tambah transaksi (DEPOSIT/WITHDRAWAL)
- [ ] DELETE /api/cashflow/:id — Hapus transaksi
- [ ] GET /api/cashflow/summary — Total injected, true net profit, return %

**Deliverables Frontend:**
- [ ] CashflowPage: Summary cards + tabel transaksi
- [ ] SummaryCards: Capital Injected, Current Net Worth, True Net Profit (USD+IDR), Return %
- [ ] HighWaterMark tracker
- [ ] NetWorthChart: Grafik garis pertumbuhan Net Worth vs Capital Injected
- [ ] TransactionForm: Input DEPOSIT/WITHDRAWAL
- [ ] Export ke CSV

**Acceptance Criteria:**
- [ ] Kurs IDR saat transaksi tersimpan (bukan kurs hari ini)
- [ ] True Net Profit = Net Worth - Capital Injected (bukan total return gross)
- [ ] High Water Mark terupdate otomatis

---

## Milestone 9 — Journal Analytics & Main Dashboard

**Deliverables Backend:**
- [ ] GET /api/journal/analytics — Comprehensive stats
  - Win rate overall, per pair, per direction
  - Avg R-Multiple (win/loss), Profit Factor
  - Emotional pattern analysis (win rate per emotion tag, per conviction level)
  - Monthly/yearly performance
  - Best/worst pairs

**Deliverables Frontend:**
- [ ] Dashboard (halaman utama): Command Center overview
  - Net Worth hero (USD + IDR) dengan 24h delta
  - Mini Intelligence Panel strip
  - Open Positions summary
  - Rebalancing status widget
  - Recent activity feed
- [ ] JournalAnalyticsPage:
  - Performance summary cards
  - Win Rate charts (bar chart per pair, per month)
  - R-Multiple distribution chart
  - Emotional Pattern heatmap (conviction vs win rate)
  - Trading Calendar (contribution-style heatmap)

**Acceptance Criteria:**
- [ ] Dashboard memberikan overview lengkap dalam <5 detik setelah login
- [ ] Emotional pattern analysis hanya tampil jika ada >=5 closed trades dengan emotional data
- [ ] Semua chart responsif di mobile

---

## Milestone 10 — Mobile Polish & PWA

**Deliverables:**
- [ ] Review dan perbaikan responsiveness semua halaman di 375px, 414px, 768px
- [ ] Bottom Navigation mobile yang smooth
- [ ] Touch targets audit (minimum 44x44px)
- [ ] Swipe gesture di Journal cards
- [ ] Pull-to-refresh di Portfolio
- [ ] PWA manifest.json + service worker (offline shell)
- [ ] "Add to Home Screen" prompt

**Acceptance Criteria:**
- [ ] Semua halaman fungsional di iPhone SE (375px) dan iPad (768px)
- [ ] No horizontal scroll yang tidak disengaja
- [ ] Keyboard angka muncul otomatis di semua numeric input

---

## Milestone 11 — Docker Compose & VPS Deployment

**Deliverables:**
- [ ] Dockerfile (frontend — multi-stage build)
- [ ] Dockerfile (backend — multi-stage build)
- [ ] docker-compose.yml (development)
- [ ] docker-compose.prod.yml (production)
- [ ] nginx/nginx.conf (reverse proxy + static file serving)
- [ ] .env.example (dokumentasi semua environment variable)
- [ ] README.md: Panduan deployment step-by-step
- [ ] Database backup script (SQLite file copy)

**Acceptance Criteria:**
- [ ] `docker-compose -f docker-compose.prod.yml up -d` berhasil di VPS
- [ ] HTTPS berjalan via Let's Encrypt
- [ ] Aplikasi dapat diakses dari browser mobile via domain/IP VPS
- [ ] SQLite database ter-persist meski container di-restart
- [ ] Backend .env tidak tersimpan di git repository

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
