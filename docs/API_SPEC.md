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

## 8. Settings, Disaster Recovery & Webhook Dispatchers

### GET /api/settings/backup/export
Mengekspor seluruh rekaman database terisolasi milik user yang terotentikasi (`trade_ideas`, `journal_entries`, `portfolio_holdings`, `cashflow_ledger`) sebagai arsip snapshot JSON portabel master.

**Response (200):**
```json
{
  "version": "2.0.0",
  "exportTimestamp": "2026-10-24T04:28:19.000Z",
  "userId": "usr_99182a",
  "records": {
    "tradeIdeas": [ ... ],
    "journalEntries": [ ... ],
    "portfolioHoldings": [ ... ],
    "cashflowLedger": [ ... ]
  }
}
```

---

### POST /api/settings/backup/import
Memulihkan (*restore*) database akun dari file snapshot JSON master secara atomik dengan proteksi transaksi.

**Request Body:**
```json
{
  "backup": {
    "version": "2.0.0",
    "exportTimestamp": "2026-10-24T04:28:19.000Z",
    "records": {
      "tradeIdeas": [ ... ],
      "journalEntries": [ ... ],
      "portfolioHoldings": [ ... ],
      "cashflowLedger": [ ... ]
    }
  },
  "mode": "merge" // Opsi: "merge" (append rekaman baru) atau "overwrite" (wipe & replace)
}
```

**Response (200):**
```json
{
  "success": true,
  "counts": {
    "total": 45,
    "journalEntries": 18,
    "portfolioHoldings": 12,
    "cashflowLedger": 9,
    "tradeIdeas": 6
  }
}
```

---

### POST /api/settings/webhook/telegram
Mengirim pesan tes ping ke bot Telegram terkonfigurasi.

**Request Body:**
```json
{
  "botToken": "7182910382:AAH9f28_x9...",
  "chatId": "109283741",
  "testMessage": "🔔 [CryptoOS Test Ping] Terminal notification bridge active."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Telegram ping sent successfully"
}
```

---

### POST /api/settings/webhook/discord
Mengirim pesan embed tes ke webhook channel Discord terkonfigurasi.

**Request Body:**
```json
{
  "webhookUrl": "https://discord.com/api/webhooks/12984.../aX9...",
  "testMessage": "🔔 [CryptoOS Sentinel] Webhook test ping dispatched."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Discord webhook embed dispatched successfully"
}
```

---

### GET /api/settings/exchanges
Melihat status konfigurasi API Key bursa (Binance, Bybit, OKX). Hanya mengembalikan metadata status boolean tanpa membocorkan API Secret.

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "name": "Binance", "configured": true, "permission": "READ_ONLY" },
    { "name": "Bybit", "configured": false, "permission": "NONE" },
    { "name": "OKX", "configured": false, "permission": "NONE" }
  ]
}
```

---

### POST /api/settings/exchanges/test
Menguji konektivitas read-only ke bursa eksternal.

**Request Body:**
```json
{
  "exchange": "Binance"
}
```

**Response (200):**
```json
{
  "success": true,
  "connected": true,
  "message": "Binance spot read-only API connection verified."
}
```

---

*API Spec ini diperbarui untuk CryptoOS v2.0. Seluruh endpoint dilindungi header JWT Bearer Authorization kecuali /auth/login.*

