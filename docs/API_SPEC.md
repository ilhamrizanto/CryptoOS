# API_SPEC.md — CryptoOS Backend API Specification

**Versi**: 1.0.0  
**Tanggal**: 2026-10-18  
**Base URL**: `/api`  
**Auth**: Bearer JWT di header `Authorization: Bearer <token>` (kecuali endpoint /auth/*)

---

## Konvensi

### Response Format (Sukses)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": 1729234800000,
    "cached": true,
    "cacheAge": 120
  }
}
```

### Response Format (Error)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Entry price harus lebih besar dari 0",
    "details": { ... }
  }
}
```

### Error Codes
| Code | HTTP Status | Keterangan |
|---|---|---|
| UNAUTHORIZED | 401 | Token tidak valid atau tidak ada |
| FORBIDDEN | 403 | Token valid tapi tidak punya akses |
| NOT_FOUND | 404 | Resource tidak ditemukan |
| VALIDATION_ERROR | 422 | Input tidak valid (Zod schema) |
| EXTERNAL_API_ERROR | 502 | Gagal fetch data dari provider eksternal |
| INTERNAL_ERROR | 500 | Error tidak terduga di server |

---

## 1. Authentication

### POST /api/auth/login
Melakukan autentikasi dengan master password.

**Request Body:**
```json
{ "password": "string" }
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expiresAt": 1729839600000
  }
}
```

**Response (401):**
```json
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Password salah" } }
```

---

### GET /api/auth/verify
Cek validitas token yang sedang aktif.

**Response (200):**
```json
{ "success": true, "data": { "valid": true, "expiresAt": 1729839600000 } }
```

---

## 2. Market Intelligence

### GET /api/market/intel
Mengembalikan seluruh data pasar global (dari cache backend).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "forex": {
      "usdIdr": { "value": 16250, "change24h": 0.3, "updatedAt": 1729234800000 },
      "dxy": { "value": 105.2, "change24h": 0.28, "updatedAt": 1729234800000 }
    },
    "commodities": {
      "wtiOil": { "value": 78.3, "change24h": -1.2, "updatedAt": 1729234800000 }
    },
    "macro": {
      "fedFundsRate": { "value": 5.25, "updatedAt": 1729234800000 },
      "nextFomcDate": "2026-10-28",
      "cpiYoy": { "value": 3.2, "updatedAt": 1729234800000 },
      "coreInflation": { "value": 2.8, "updatedAt": 1729234800000 }
    },
    "fedwatch": {
      "easeProb": null,
      "noChangeProb": null,
      "hikeProb": null,
      "manuallyUpdatedAt": null,
      "cmeFedwatchUrl": "https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html"
    },
    "sentiment": {
      "fearAndGreed": { "value": 72, "classification": "Greed", "updatedAt": 1729234800000 },
      "altcoinSeasonIndex": { "value": 67, "classification": "Altcoin Season", "updatedAt": 1729234800000 }
    },
    "crypto": {
      "btcDominance": { "value": 54.2, "change24h": -0.3, "updatedAt": 1729234800000 },
      "total3": { "value": 892000000000, "change24h": 2.1, "updatedAt": 1729234800000 },
      "others": { "value": 450000000000, "change24h": 1.8, "updatedAt": 1729234800000 }
    },
    "onchain": {
      "mvrvZScore": { "value": 1.8, "classification": "Fair Value", "updatedAt": 1729234800000 }
    }
  }
}
```

---

### PATCH /api/market/fedwatch
Update probabilitas FedWatch secara manual.

**Request Body:**
```json
{
  "easeProb": 84.5,
  "noChangeProb": 15.5,
  "hikeProb": 0.0
}
```

**Response (200):** Updated fedwatch data.

---

### GET /api/market/coin/search
Cari koin berdasarkan nama atau ticker.

**Query Params:** `q=QUSDT`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "q-protocol",
      "symbol": "Q",
      "name": "Q Protocol",
      "thumb": "https://..."
    }
  ]
}
```

---

### GET /api/market/coin/:coinId/fundamental
Fetch data fundamental koin (CoinGecko + DeFiLlama).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "symbol": "Q",
    "name": "Q Protocol",
    "currentPriceUsd": 0.1211,
    "marketCapUsd": 850000000,
    "fullyDilutedValuationUsd": 1200000000,
    "circulatingSupply": 7020000000,
    "totalSupply": 10000000000,
    "circulatingSupplyPercent": 70.2,
    "volume24hUsd": 45000000,
    "fdvMcRatio": 1.41,
    "coingeckoUrl": "https://www.coingecko.com/en/coins/q-protocol",
    "defillama": {
      "available": true,
      "fees24hUsd": 12000,
      "fees7dUsd": 85000,
      "revenue24hUsd": 8000,
      "revenue7dUsd": 56000
    },
    "btcSpecific": null
  }
}
```

*Untuk BTC, btcSpecific akan berisi: { productionCostUsd: 42000 }*

---

### GET /api/market/prices
Live prices untuk daftar simbol.

**Query Params:** `symbols=BTC,ETH,SOL,QUSDT`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "BTC": { "price": 67500, "change24h": 2.3 },
    "ETH": { "price": 2650, "change24h": 1.8 },
    "SOL": { "price": 175, "change24h": -0.5 }
  }
}
```

---

## 3. Trade Ideas (Pipeline)

### GET /api/ideas
List semua trade ideas.

**Query Params:** `status=WATCHLIST,READY` | `symbol=BTC` | `direction=LONG` | `limit=20` | `offset=0`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [ { "id": "uuid", "symbol": "BTCUSDT", "direction": "LONG", "status": "READY", ... } ],
    "total": 15,
    "limit": 20,
    "offset": 0
  }
}
```

---

### POST /api/ideas
Buat trade idea baru.

**Request Body:** (sesuai schema TradeIdea di PRD)

---

### GET /api/ideas/:id
Detail trade idea termasuk semua pilar dan rencana eksekusi.

---

### PATCH /api/ideas/:id
Update idea (partial update diizinkan).

---

### DELETE /api/ideas/:id
Soft delete idea (status -> DELETED).

---

### POST /api/ideas/:id/to-journal
Convert idea menjadi open journal entry.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "journalEntryId": "uuid",
    "message": "Trade idea berhasil dikonversi ke journal entry"
  }
}
```

---

## 4. Trading Journal

### GET /api/journal
List journal entries.

**Query Params:** `status=OPEN,CLOSED` | `symbol=BTC` | `direction=LONG,SHORT` | `month=2026-10` | `limit=20` | `offset=0`

---

### POST /api/journal
Buat journal entry baru (manual, tanpa idea card).

**Request Body (minimum):**
```json
{
  "symbol": "BTCUSDT",
  "direction": "LONG",
  "entryPrice": 67500,
  "stopLossPrice": 64200,
  "tp1Price": 74000,
  "positionSizeUsd": 9174.31,
  "riskUsd": 500,
  "leverage": 10,
  "openedAt": 1729234800000,
  "convictionLevel": 4,
  "emotions": ["Confident", "Calm"],
  "setupClarity": "Crystal Clear",
  "emotionNotes": "Setup sangat bersih..."
}
```

---

### GET /api/journal/:id
Detail journal entry lengkap dengan semua field.

---

### PATCH /api/journal/:id
Update ongoing trade (mid-trade notes, partial close log).

---

### POST /api/journal/:id/close
Tutup posisi trading.

**Request Body:**
```json
{
  "exitPrice": 73500,
  "closedAt": 1729839600000,
  "evalTags": ["Sesuai Rencana", "TP Hit"],
  "psychTags": ["Disiplin"],
  "postMortemNotes": "Setup terbukti valid..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "realizedPnlUsd": 1285.5,
    "realizedPnlIdr": 20888375,
    "rMultiple": 2.57,
    "holdingDurationMs": 604800000
  }
}
```

---

### GET /api/journal/stats
Aggregated trading statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalTrades": 45,
    "closedTrades": 42,
    "openTrades": 3,
    "winRate": 0.619,
    "avgWinRMultiple": 2.1,
    "avgLossRMultiple": -0.95,
    "profitFactor": 3.42,
    "totalRealizedPnlUsd": 12500,
    "openRiskPercent": 3.0,
    "emotionalPatterns": {
      "byEmotion": [
        { "emotion": "FOMO", "count": 8, "winRate": 0.25, "avgR": -0.8 },
        { "emotion": "Confident", "count": 24, "winRate": 0.72, "avgR": 1.9 }
      ],
      "byConviction": [
        { "level": 5, "count": 12, "winRate": 0.83, "avgR": 2.4 },
        { "level": 1, "count": 5, "winRate": 0.20, "avgR": -1.1 }
      ]
    },
    "bySymbol": [
      { "symbol": "BTCUSDT", "trades": 18, "winRate": 0.72, "totalPnlUsd": 8200 }
    ],
    "monthlyPerformance": [
      { "month": "2026-10", "trades": 8, "winRate": 0.75, "pnlUsd": 3200 }
    ]
  }
}
```

---

## 5. Portfolio

### GET /api/portfolio/balances
Fetch saldo dari semua exchange + manual holdings.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsd": 52450.75,
    "totalIdr": 852326875,
    "change24hUsd": 1230.5,
    "change24hPct": 2.4,
    "exchanges": [
      {
        "name": "Binance",
        "connected": true,
        "totalUsd": 25000,
        "balances": [
          { "symbol": "BTC", "quantity": 0.25, "valueUsd": 16875, "price": 67500, "change24h": 2.3 }
        ]
      },
      {
        "name": "Bybit",
        "connected": false,
        "error": "Connection timeout"
      }
    ],
    "manualHoldings": [
      { "id": "uuid", "symbol": "ETH", "quantity": 2.5, "location": "Cold Wallet", "valueUsd": 6625, "price": 2650 }
    ]
  }
}
```

---

### POST/PATCH/DELETE /api/portfolio/manual
CRUD untuk manual holdings.

---

## 6. Rebalancing

### GET /api/rebalancing/analysis
Analisis alokasi aktual vs target.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalPortfolioUsd": 52450,
    "cadence": { "daysSinceLastRebalance": 38, "cycleDays": 60, "nextReviewAt": 1730000000000 },
    "allocations": [
      {
        "category": "CORE",
        "symbol": "BTC",
        "targetPct": 40,
        "actualPct": 52.1,
        "driftPct": 12.1,
        "status": "OVERWEIGHT",
        "actualValueUsd": 27327,
        "targetValueUsd": 20980,
        "actionUsd": -6347,
        "actionIdr": -103138750
      }
    ]
  }
}
```

---

## 7. Cashflow

### GET /api/cashflow
List semua transaksi cashflow.

### POST /api/cashflow
Tambah transaksi.

**Request Body:**
```json
{
  "type": "DEPOSIT",
  "amountUsd": 5000,
  "usdIdrRate": 16250,
  "notes": "Top-up modal Oktober",
  "createdAt": 1729234800000
}
```

### GET /api/cashflow/summary
Summary kalkulasi arus kas.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalDepositUsd": 45000,
    "totalWithdrawalUsd": 5000,
    "totalInjectedUsd": 40000,
    "currentNetWorthUsd": 52450,
    "trueNetProfitUsd": 12450,
    "trueNetProfitIdr": 202312500,
    "totalReturnPct": 31.1,
    "highWaterMarkUsd": 52450,
    "highWaterMarkDate": 1729234800000
  }
}
```

---

## 8. Settings

### GET /api/settings
Ambil semua settings.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "defaultRiskPercent": 1.0,
    "maxTotalExposurePercent": 5.0,
    "rebalancingCycleDays": 60,
    "timezone": "Asia/Jakarta",
    "exchanges": [
      { "name": "Binance", "configured": true },
      { "name": "Bybit", "configured": false },
      { "name": "OKX", "configured": false }
    ]
  }
}
```

### PATCH /api/settings
Update settings (partial).

### POST /api/settings/exchange
Simpan API Key exchange (hanya mengupdate .env runtime, atau simpan terenkripsi di DB).

**Request Body:**
```json
{
  "exchange": "Binance",
  "apiKey": "string",
  "apiSecret": "string"
}
```

### POST /api/settings/exchange/:name/test
Test koneksi ke exchange.

**Response (200):**
```json
{ "success": true, "data": { "connected": true, "accountType": "SPOT", "message": "Terhubung ke Binance Spot" } }
```

### GET /api/settings/export
Export seluruh data (ideas, journal, cashflow, settings) sebagai JSON.

### POST /api/settings/import
Import data dari file JSON backup.

---

*API Spec ini akan diperbarui seiring development. Seluruh endpoint dilindungi JWT kecuali /auth/login.*
