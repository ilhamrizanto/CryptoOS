# ARCHITECTURE.md — CryptoOS Technical Architecture

**Versi**: 1.0.0  
**Tanggal**: 2026-10-18  
**Status**: Draft

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        VPS Server                           │
│                                                             │
│  ┌──────────────────┐        ┌─────────────────────────┐   │
│  │   Nginx (Reverse │        │   Docker Compose Stack  │   │
│  │   Proxy + HTTPS) │───────>│                         │   │
│  └──────────────────┘        │  ┌───────────────────┐  │   │
│                              │  │  Frontend (Nginx)  │  │   │
│                              │  │  React + Vite SPA  │  │   │
│                              │  └────────┬──────────┘  │   │
│                              │           │ /api/*       │   │
│                              │  ┌────────▼──────────┐  │   │
│                              │  │  Backend (Node.js) │  │   │
│                              │  │  Express + TypeSc. │  │   │
│                              │  └────────┬──────────┘  │   │
│                              │           │              │   │
│                              │  ┌────────▼──────────┐  │   │
│                              │  │  SQLite Database   │  │   │
│                              │  │  (via Drizzle ORM) │  │   │
│                              │  └───────────────────┘  │   │
│                              └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                              │
         │ Browser                      │ External APIs
         ▼                              ▼
┌────────────────┐        ┌─────────────────────────────────┐
│  User Browser  │        │  CoinGecko / FRED / Binance /   │
│  IndexedDB     │        │  Bybit / OKX / Alternative.me   │
│  (Screenshots) │        │  Stooq / ExchangeRate-API       │
└────────────────┘        └─────────────────────────────────┘
```

---

## 2. Technology Stack

### Frontend
| Layer | Technology | Alasan |
|---|---|---|
| Framework | React 18 + TypeScript | Component model ideal untuk dashboard kompleks |
| Build Tool | Vite | HMR cepat, build optimal |
| State Management | Zustand | Ringan, simple API, cocok untuk personal app |
| Server State | TanStack Query (React Query) | Caching, background refetch, stale-while-revalidate |
| Routing | React Router v6 | SPA routing standar |
| Styling | Vanilla CSS + CSS Variables | Full control, zero runtime overhead, dark theme native |
| Charts | Recharts | React-native, ringan, customizable |
| Storage (Screenshots) | idb (IndexedDB wrapper) | Simpan blob image tanpa limit 5MB |
| Icons | Lucide React | Modern, tree-shakeable |
| Date | date-fns | Lightweight, immutable |

### Backend
| Layer | Technology | Alasan |
|---|---|---|
| Runtime | Node.js 20 LTS | Stable, LTS |
| Framework | Express 4 + TypeScript | Minimal overhead, full control |
| ORM | Drizzle ORM | Type-safe, SQL-first, migration ringan |
| Database | SQLite | Zero-ops, single-file, perfect untuk single-user |
| Auth | JWT (jsonwebtoken) + bcrypt | Simple, stateless |
| Validation | Zod | Schema validation + TypeScript inference |
| HTTP Client | Axios | Untuk proxy request ke exchange API |
| Env | dotenv | Environment variable management |

### Infrastructure
| Layer | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| SSL/HTTPS | Let's Encrypt (Certbot) |
| Process Manager | Docker restart: always |

---

## 3. Project Structure

```
cryptoos/
├── frontend/                          # React + Vite SPA
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css                  # Global design tokens & utilities
│   │   ├── types/                     # Shared TypeScript interfaces
│   │   │   ├── trade.types.ts
│   │   │   ├── portfolio.types.ts
│   │   │   ├── market.types.ts
│   │   │   └── cashflow.types.ts
│   │   ├── services/                  # Frontend data layer
│   │   │   ├── api.ts                 # Axios instance (points to /api)
│   │   │   ├── db.ts                  # IndexedDB via idb (screenshot storage)
│   │   │   └── queryKeys.ts           # TanStack Query key factory
│   │   ├── store/                     # Zustand stores (local UI state)
│   │   │   ├── auth.store.ts
│   │   │   ├── settings.store.ts
│   │   │   └── ui.store.ts
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useMarketData.ts
│   │   │   ├── usePortfolio.ts
│   │   │   ├── useCalculator.ts
│   │   │   └── useClipboardPaste.ts   # Ctrl+V screenshot handler
│   │   ├── components/
│   │   │   ├── ui/                    # Reusable primitives
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   ├── Badge/
│   │   │   │   ├── Slider/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Lightbox/          # Screenshot zoom viewer
│   │   │   │   ├── EvidencePasteZone/ # Ctrl+V capture component
│   │   │   │   ├── DualCurrencyValue/ # USD + IDR display
│   │   │   │   └── DataStatusBadge/   # Live/Stale/Error indicator
│   │   │   └── features/              # Feature-specific components
│   │   │       ├── intelligence/      # Global Intelligence Panel
│   │   │       ├── pipeline/          # Idea Incubator
│   │   │       ├── calculator/        # Position Sizer
│   │   │       ├── journal/           # Trading Journal
│   │   │       ├── portfolio/         # Portfolio Tracker + Rebalancing
│   │   │       ├── cashflow/          # Treasury Ledger
│   │   │       └── settings/          # Settings page
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PipelinePage.tsx
│   │   │   ├── CalculatorPage.tsx
│   │   │   ├── JournalPage.tsx
│   │   │   ├── PortfolioPage.tsx
│   │   │   ├── RebalancingPage.tsx
│   │   │   ├── CashflowPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── LoginPage.tsx
│   │   └── utils/
│   │       ├── formatCurrency.ts      # USD & IDR formatter
│   │       ├── calculator.ts          # Position sizing formulas
│   │       └── riskAnalysis.ts        # Kelly, exposure calc
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                           # Node.js + Express API
│   ├── src/
│   │   ├── server.ts                  # Express app entry point
│   │   ├── env.ts                     # Validated env variables (Zod)
│   │   ├── db/
│   │   │   ├── schema.ts              # Drizzle schema definitions
│   │   │   ├── index.ts               # DB connection
│   │   │   └── migrations/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts     # JWT verification
│   │   │   └── error.middleware.ts    # Central error handler
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.router.ts
│   │   │   │   └── auth.service.ts
│   │   │   ├── market/                # Proxy + cache untuk external APIs
│   │   │   │   ├── market.router.ts
│   │   │   │   └── market.service.ts
│   │   │   ├── exchange/              # Proxy untuk Binance/Bybit/OKX
│   │   │   │   ├── exchange.router.ts
│   │   │   │   └── exchange.service.ts
│   │   │   ├── ideas/                 # Trade Idea CRUD
│   │   │   │   ├── ideas.router.ts
│   │   │   │   ├── ideas.service.ts
│   │   │   │   └── ideas.schema.ts    # Zod validation
│   │   │   ├── journal/               # Journal CRUD
│   │   │   │   ├── journal.router.ts
│   │   │   │   ├── journal.service.ts
│   │   │   │   └── journal.schema.ts
│   │   │   ├── portfolio/             # Manual holdings
│   │   │   │   ├── portfolio.router.ts
│   │   │   │   └── portfolio.service.ts
│   │   │   ├── cashflow/              # Treasury transactions
│   │   │   │   ├── cashflow.router.ts
│   │   │   │   └── cashflow.service.ts
│   │   │   └── settings/              # App settings
│   │   │       ├── settings.router.ts
│   │   │       └── settings.service.ts
│   │   └── utils/
│   │       ├── cache.ts               # In-memory cache untuk API responses
│   │       └── apiClients.ts          # Configured axios instances per provider
│   ├── data/                          # SQLite database file (volume mounted)
│   │   └── cryptoos.db
│   ├── package.json
│   └── tsconfig.json
│
├── nginx/
│   └── nginx.conf                     # Reverse proxy + HTTPS config
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── docs/                              # Dokumentasi proyek
    ├── PRD.md
    ├── ARCHITECTURE.md
    ├── DESIGN.md
    ├── API_SPEC.md
    └── DEVELOPMENT_PLAN.md
```

---

## 4. Database Schema (Drizzle ORM / SQLite)

### Table: users
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
username    TEXT NOT NULL UNIQUE
password    TEXT NOT NULL  -- bcrypt hash
created_at  INTEGER NOT NULL  -- Unix timestamp
```

### Table: trade_ideas
```sql
id                  TEXT PRIMARY KEY  -- UUID
created_at          INTEGER NOT NULL
updated_at          INTEGER NOT NULL
symbol              TEXT NOT NULL     -- e.g., "BTCUSDT"
direction           TEXT NOT NULL     -- 'LONG' | 'SHORT'
timeframe           TEXT NOT NULL
status              TEXT NOT NULL     -- 'WATCHLIST' | 'READY' | 'ACTIVE' | 'CLOSED' | 'INVALIDATED'
-- Pilar 1: Makro (stored as JSON)
macro_data          TEXT              -- JSON
-- Pilar 2: Fundamental (stored as JSON)
fundamental_data    TEXT              -- JSON
-- Pilar 3: Price Action (stored as JSON)
price_action_data   TEXT              -- JSON
-- Pilar 4: Evidence (screenshot IDs stored here, blobs in IndexedDB)
evidence_data       TEXT              -- JSON
-- Execution Plan
entry_price         REAL
stop_loss_price     REAL
tp1_price           REAL
tp2_price           REAL
tp3_price           REAL
risk_percent        REAL
notes               TEXT
```

### Table: journal_entries
```sql
id                  TEXT PRIMARY KEY  -- UUID
idea_id             TEXT              -- FK -> trade_ideas.id (nullable)
created_at          INTEGER NOT NULL
opened_at           INTEGER NOT NULL
closed_at           INTEGER
symbol              TEXT NOT NULL
direction           TEXT NOT NULL
entry_price         REAL NOT NULL
stop_loss_price     REAL NOT NULL
tp1_price           REAL
tp2_price           REAL
position_size_usd   REAL NOT NULL
leverage            REAL NOT NULL DEFAULT 1
risk_usd            REAL NOT NULL
status              TEXT NOT NULL     -- 'OPEN' | 'CLOSED' | 'PARTIAL'
exit_price          REAL
realized_pnl_usd    REAL
r_multiple          REAL
holding_duration_ms INTEGER
-- Emotional Log
conviction_level    INTEGER           -- 1-5
emotions            TEXT              -- JSON array of tags
setup_clarity       TEXT
emotion_notes       TEXT
-- Post-Mortem
eval_tags           TEXT              -- JSON array of tags
psych_tags          TEXT              -- JSON array of tags
post_mortem_notes   TEXT
-- Snapshot at entry
market_snapshot     TEXT              -- JSON: macro data at time of entry
```

### Table: portfolio_holdings (Manual Holdings)
```sql
id          TEXT PRIMARY KEY
symbol      TEXT NOT NULL
quantity    REAL NOT NULL
location    TEXT NOT NULL  -- 'COLD_WALLET' | 'OTHER_EXCHANGE' | label custom
notes       TEXT
updated_at  INTEGER NOT NULL
```

### Table: rebalancing_targets
```sql
id          TEXT PRIMARY KEY
category    TEXT NOT NULL  -- 'CORE' | 'TACTICAL' | 'DRY_POWDER'
symbol      TEXT           -- NULL untuk DRY_POWDER
target_pct  REAL NOT NULL
```

### Table: rebalancing_snapshots
```sql
id              TEXT PRIMARY KEY
created_at      INTEGER NOT NULL
snapshot_data   TEXT NOT NULL  -- JSON: {symbol, actual_pct, target_pct, value_usd}[]
notes           TEXT
next_review_at  INTEGER
```

### Table: cashflow_transactions
```sql
id              TEXT PRIMARY KEY
created_at      INTEGER NOT NULL
type            TEXT NOT NULL      -- 'DEPOSIT' | 'WITHDRAWAL'
amount_usd      REAL NOT NULL
usd_idr_rate    REAL NOT NULL      -- Kurs pada tanggal transaksi
amount_idr      REAL NOT NULL      -- amount_usd * usd_idr_rate
notes           TEXT
```

### Table: settings
```sql
key     TEXT PRIMARY KEY
value   TEXT NOT NULL  -- JSON serialized values
```

---

## 5. API Security Architecture

### Problem
Exchange API (Binance/Bybit/OKX) tidak dapat dipanggil langsung dari browser karena:
1. CORS policy memblokir cross-origin request dari browser
2. API Secret tidak boleh ada di browser (bisa diinspeksi)

### Solution: Backend Proxy Pattern

```
Browser                Backend (VPS)              Exchange API
   │                       │                           │
   │  GET /api/portfolio    │                           │
   │──────────────────────>│                           │
   │                       │  Signed request dengan    │
   │                       │  API Key dari .env        │
   │                       │──────────────────────────>│
   │                       │  Portfolio data           │
   │                       │<──────────────────────────│
   │  Portfolio data       │                           │
   │<──────────────────────│                           │
   │ (TANPA API Key)       │                           │
```

### Environment Variables (.env di VPS)
```bash
# Auth
JWT_SECRET=<random-256-bit-string>
MASTER_PASSWORD_HASH=<bcrypt-hash-of-your-password>

# Exchange APIs (Read-Only)
BINANCE_API_KEY=
BINANCE_API_SECRET=
BYBIT_API_KEY=
BYBIT_API_SECRET=
OKX_API_KEY=
OKX_API_SECRET=
OKX_PASSPHRASE=

# Market Data APIs
FRED_API_KEY=          # Gratis di fred.stlouisfed.org
ALPHA_VANTAGE_KEY=     # Gratis di alphavantage.co
EXCHANGERATE_API_KEY=  # Gratis di exchangerate-api.com

# App Config
NODE_ENV=production
PORT=3001
DATABASE_PATH=/app/data/cryptoos.db
CORS_ORIGIN=https://your-domain.com
```

---

## 6. Authentication Flow

CryptoOS menggunakan **Single-User JWT Authentication**:

```
1. POST /api/auth/login { password: "..." }
2. Backend verifikasi password dengan MASTER_PASSWORD_HASH
3. Backend return JWT token (expires: 7 hari)
4. Browser simpan token di localStorage
5. Semua request berikutnya menyertakan: Authorization: Bearer <token>
6. Backend middleware verifikasi JWT di setiap protected route
7. Jika token expired -> redirect ke /login
```

---

## 7. Caching Strategy

Untuk menghindari rate-limit dari free tier API (terutama CoinGecko 30 req/menit):

| Data Type | Cache Layer | TTL |
|---|---|---|
| Crypto prices (BTC, ETH, dll.) | In-memory (backend) | 30 detik |
| Market cap, FDV, Supply | In-memory (backend) | 5 menit |
| BTC Dominance, TOTAL3 | In-memory (backend) | 5 menit |
| Fear & Greed Index | In-memory (backend) | 1 jam |
| DXY, Oil, FOMC Rate | In-memory (backend) | 15 menit |
| CPI, US Inflation | In-memory (backend) | 24 jam |
| Altcoin Season Index | In-memory (backend) | 1 jam |
| USD/IDR Rate | In-memory (backend) | 5 menit |
| CoinGecko Coin Search | In-memory (backend) | 10 menit |

---

## 8. Deployment Architecture (Docker Compose)

```yaml
# docker-compose.yml (struktur)
services:
  backend:
    build: ./backend
    env_file: .env
    volumes:
      - ./data:/app/data    # SQLite database persistence
    restart: always

  frontend:
    build: ./frontend
    depends_on: [backend]
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./certbot/conf:/etc/letsencrypt
    depends_on: [frontend, backend]
    restart: always
```

### Deployment Steps (VPS)
1. `git clone` repository ke VPS
2. Copy `.env.example` ke `.env`, isi semua variable
3. `docker-compose up -d --build`
4. Setup Let's Encrypt: `certbot --nginx -d your-domain.com`
5. Done — aplikasi berjalan di `https://your-domain.com`

---

## 9. Data Flow: Trade Idea -> Journal

```
[Pipeline Page]
    User input ticker "QUSDT"
         │
         ▼
    GET /api/market/coin/search?q=QUSDT
    Backend -> CoinGecko Search API -> return coin_id
         │
         ▼
    GET /api/market/coin/QUSDT/fundamental
    Backend -> CoinGecko + DeFiLlama -> return data
         │
         ▼
    Form terisi otomatis (Market Cap, FDV, Supply, Volume, Revenue)
         │
    User paste screenshot (Ctrl+V) -> IndexedDB (browser)
         │
    User lengkapi checklist PA + On-Chain notes
         │
    User klik [Kirim ke Journal]
         │
         ▼
    POST /api/ideas/:id/to-journal
    Backend simpan TradeIdea (status: ACTIVE) + buat JournalEntry
         │
         ▼
    [Journal Page] - Tiket posisi terbuka tampil
    Live PnL dari GET /api/market/price?symbols=QUSDT (30s polling)
         │
    User close trade -> input exit price
         │
         ▼
    PATCH /api/journal/:id/close
    Backend kalkulasi: Realized PnL, R-Multiple, Duration
         │
         ▼
    JournalEntry status: CLOSED
    Analytics dashboard terupdate
```

---

*Dokumen ini akan diupdate seiring perkembangan implementasi.*
