# CryptoOS — Market & Price Data API Documentation

Dokumentasi lengkap endpoint API harga, makroekonomi, sentimen, dan tokenomics di **CryptoOS Backend**. Dokumentasi ini dapat Anda gunakan untuk mengecek manual ketersediaan data langsung dari browser atau command line (`curl` / PowerShell).

Base URL: `http://localhost:3001/api`

---

## 1. Ringkasan Sumber Data (Providers)

| Metrik / Data | Sumber Data Utama & Ticker | Kalibrasi Nilai Terkini | Status Feed |
| :--- | :--- | :--- | :--- |
| **Kurs USD/IDR** | **TradingView (ACE:USDIDR)** / Interbank Feed | **17,943** | **Realtime (Live)** |
| **US Dollar Index (DXY)** | **TradingView (TVC:DXY)** | **101.590** | **Realtime (Live)** |
| **BTC Dominance (BTC.D)** | **TradingView (CRYPTOCAP:BTC.D)** | **60.59%** | **Realtime (Live)** |
| **TOTAL3 (Altcoin Cap)** | **CoinMarketCap (CMC:TOTAL3)** | **$770.42B** | **Realtime (Live)** |
| **Crypto Fear & Greed** | **CoinMarketCap (CMC) Fear & Greed** | **53 (Neutral)** | **Realtime (Live)** |
| **Altcoin Season Index** | **CoinMarketCap (CMC) AltSeason** | **58 (Altcoin Momentum)** | **Realtime (Live)** |
| **MVRV Z-Score** | **CryptoQuant On-Chain MVRV Z-Score** | **1.85 (Akumulasi)** | **Realtime (Live)** |
| **WTI Crude Oil** | **TradingView (CFI:OIL_CRUDE)** | **$101.0 / bbl** | **Realtime (Live)** |
| **Pencarian Token (Coin Search)** | **CoinGecko Search API** (`/v3/search`) | Top Popular Coins Index | **Realtime (Live)** |
| **Fundamental & Tokenomics Koin** | **CoinGecko Coins Market Data API** (`/v3/coins/{id}`) | FDV/Mcap Dilution Ratio | **Realtime (Live)** |
| **CME FedWatch & FOMC** | **CME Group FedWatch / CBOT Futures** | 82.8% Pause / 17.2% Hike | **Realtime / Model** |

---

## 2. Daftar Endpoint API & Panduan Cek Manual

### A. Agregasi Intelijen Pasar (Macro, Forex, Crypto, Sentiment)
* **Endpoint**: `GET /api/market/intel`
* **Query Parameters**:
  - `refresh=true` (opsional): Memaksa refresh langsung ke provider eksternal dan menghapus cache memori lokal.
* **Cek Manual via Browser**:
  👉 [http://localhost:3001/api/market/intel](http://localhost:3001/api/market/intel)
* **Cek Manual via cURL**:
  ```bash
  curl -X GET "http://localhost:3001/api/market/intel?refresh=true"
  ```
* **Contoh Respons JSON**:
  ```json
  {
    "success": true,
    "data": {
      "forex": {
        "usdIdr": {
          "value": 17943,
          "change24h": 0.08,
          "change7d": 0.18,
          "context": "TradingView (ACE:USDIDR) • Realtime",
          "isLive": true,
          "history": [ { "date": "2026-10-22", "value": 17943 } ],
          "sparkline": [ 17890, 17915, 17928, 17905, 17920, 17935, 17950, 17943 ]
        },
        "dxy": {
          "value": 101.59,
          "change24h": -0.15,
          "change7d": -0.45,
          "context": "TradingView (TVC:DXY) • Realtime"
        }
      },
      "commodities": {
        "wtiOil": {
          "value": 101.0,
          "context": "TradingView (CFI:OIL_CRUDE) • Realtime"
        }
      },
      "sentiment": {
        "fearAndGreed": {
          "value": 53,
          "classification": "Neutral",
          "isLive": true
        },
        "altcoinSeasonIndex": {
          "value": 58,
          "classification": "Altcoin Momentum"
        }
      },
      "crypto": {
        "btcDominance": { "value": 60.59, "sparkline": [59.8, 60.0, 60.2, 60.4, 60.5, 60.59] },
        "total3": { "value": 770420000000, "sparkline": [752, 756, 760, 764, 768, 770.42] }
      },
      "onchain": {
        "mvrvZScore": {
          "value": 1.85,
          "classification": "Fair Value / Akumulasi",
          "context": "CryptoQuant On-Chain MVRV Z-Score • Akumulasi"
        }
      }
      },
      "sentiment": {
        "fearAndGreed": {
          "value": 68,
          "classification": "Greed",
          "isLive": true,
          "yesterday": 65,
          "lastWeek": 62
        },
        "altcoinSeasonIndex": { "value": 36, "classification": "Bitcoin Season" }
      },
      "crypto": {
        "btcDominance": { "value": 60.1, "change24h": -0.2 },
        "total3": { "value": 786980000000, "change24h": 3.4 }
      },
      "macro": {
        "fedFundsRate": { "value": 4.88, "isLive": true },
        "nextFomcDate": "2026-10-28",
        "fomcDaysRemaining": 5,
        "fomcBias": "DOVISH LEAN",
        "macroRegime": "LIQUIDITY EXPANSION"
      },
      "fedwatch": {
        "easeProb": 88.5,
        "noChangeProb": 11.5,
        "hikeProb": 0.0
      }
    }
  }
  ```

---

### B. Kurs Realtime USD ke IDR
* **Endpoint**: `GET /api/market/usd-idr`
* **Kegunaan**: Digunakan oleh seluruh komponen `DualCurrencyValue` untuk mengonversi harga crypto & portofolio secara otomatis.
* **Cek Manual via Browser**:
  👉 [http://localhost:3001/api/market/usd-idr](http://localhost:3001/api/market/usd-idr)
* **Cek Manual via cURL**:
  ```bash
  curl -X GET "http://localhost:3001/api/market/usd-idr"
  ```
* **Contoh Respons JSON**:
  ```json
  {
    "success": true,
    "data": {
      "value": 18030,
      "change24h": -0.07,
      "isLive": true,
      "updatedAt": 1792692577935
    }
  }
  ```

---

### C. Pencarian Token & Koin (CoinGecko Search)
* **Endpoint**: `GET /api/market/coin/search?q={query}`
* **Parameter**:
  - `q`: Simbol atau nama koin (contoh: `sol`, `btc`, `eth`, `sui`)
* **Cek Manual via Browser**:
  👉 [http://localhost:3001/api/market/coin/search?q=sol](http://localhost:3001/api/market/coin/search?q=sol)
* **Cek Manual via cURL**:
  ```bash
  curl -X GET "http://localhost:3001/api/market/coin/search?q=sol"
  ```
* **Contoh Respons JSON**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "solana",
        "name": "Solana",
        "symbol": "SOL",
        "thumb": "https://coin-images.coingecko.com/coins/images/4128/thumb/solana.png",
        "marketCapRank": 4
      }
    ]
  }
  ```

---

### D. Fundamental Koin & Tokenomics (Harga, Market Cap, FDV, Suplai)
* **Endpoint**: `GET /api/market/coin/:coinId/fundamental`
* **Parameter URL**:
  - `:coinId`: ID unik koin dari CoinGecko (contoh: `solana`, `bitcoin`, `ethereum`, `sui`)
* **Cek Manual via Browser**:
  - Solana: 👉 [http://localhost:3001/api/market/coin/solana/fundamental](http://localhost:3001/api/market/coin/solana/fundamental)
  - Bitcoin: 👉 [http://localhost:3001/api/market/coin/bitcoin/fundamental](http://localhost:3001/api/market/coin/bitcoin/fundamental)
  - Ethereum: 👉 [http://localhost:3001/api/market/coin/ethereum/fundamental](http://localhost:3001/api/market/coin/ethereum/fundamental)
* **Cek Manual via cURL**:
  ```bash
  curl -X GET "http://localhost:3001/api/market/coin/solana/fundamental"
  ```
* **Contoh Respons JSON**:
  ```json
  {
    "success": true,
    "data": {
      "coinId": "solana",
      "name": "Solana",
      "symbol": "SOL",
      "thumb": "https://coin-images.coingecko.com/coins/images/4128/thumb/solana.png",
      "currentPriceUsd": 103.4,
      "marketCapUsd": 60987796109,
      "fdvUsd": 65809740279,
      "fdvToMcapRatio": 1.08,
      "circulatingSupply": 589653616.3,
      "totalSupply": 636274038.7,
      "volume24hUsd": 2648591636,
      "priceChange24h": -4.85,
      "high24h": 108.39,
      "low24h": 103.3,
      "updatedAt": 1792692585123
    }
  }
  ```

---

### E. Probabilitas CME FedWatch
* **Endpoint**: `GET /api/market/fedwatch`
* **Cek Manual via Browser**:
  👉 [http://localhost:3001/api/market/fedwatch](http://localhost:3001/api/market/fedwatch)
* **Update Manual (PATCH)**:
  `PATCH /api/market/fedwatch` dengan body JSON:
  ```json
  {
    "easeProb": 90.0,
    "noChangeProb": 10.0,
    "hikeProb": 0.0,
    "notes": "Ekspektasi pemotongan 25 bps setelah rilis CPI"
  }
  ```

---

## 3. Integrasi Pipeline: CoinGecko, CoinMarketCap & TradingView

1. **CoinGecko**:
   - Berfungsi sebagai mesin pencarian koin (`/api/market/coin/search`) dan penyedia data harga realtime, rasio FDV/Mcap, suplai sirkulasi, volume 24h, dan high/low 24h pada **Pilar 2: Fundamental & Tokenomics** di Pipeline.
2. **TradingView**:
   - Di Pipeline pada **Pilar 3: Price Action & Teknikal**, Anda dapat langsung menempelkan URL Chart TradingView atau screenshot analisis. Sistem menyediakan lightbox interaktif dan quick link untuk membuka grafik langsung di TradingView.
3. **CoinMarketCap**:
   - Data market cap dan FDV di CryptoOS memiliki struktur metrik yang identik dengan CoinMarketCap. Semua perbandingan valuasi (`fdvToMcapRatio`) diselaraskan agar menghasilkan pembacaan rasio risiko unlock token yang presisi (< 2.0x = Sehat/Rendah Risiko Dilusi).

---

## 4. Endpoint Portfolio Tracker (Live Price & Idempotent Sync)

### A. Realtime Live Coin Price Lookup
* **Endpoint**: `GET /api/portfolio/price/:symbol`
* **Kegunaan**: Digunakan saat menambahkan aset manual di modal untuk otomatis mendeteksi harga pasar terkini dan menghitung estimasi kepemilikan.
* **Cek Manual via Browser**:
  👉 [http://localhost:3001/api/portfolio/price/SOL](http://localhost:3001/api/portfolio/price/SOL)
* **Cek Manual via cURL**:
  ```bash
  curl -X GET "http://localhost:3001/api/portfolio/price/SOL" -H "Authorization: Bearer <TOKEN>"
  ```
* **Contoh Respons JSON**:
  ```json
  {
    "success": true,
    "data": {
      "symbol": "SOL",
      "priceUsd": 185.5,
      "isLive": true
    }
  }
  ```

### B. Idempotent Multi-Exchange Balance Sync
* **Endpoint**: `POST /api/portfolio/sync`
* **Kegunaan**: Melakukan sinkronisasi saldo spot dari Binance, Bybit, dan OKX. Bersifat **idempotent**: setiap kali tombol sinkronisasi diklik, data saldo lama ditimpa (upsert) berdasarkan `(user_id, symbol, exchange)` sehingga tidak akan ada duplikasi baris atau bentrok.
* **Body Request**:
  ```json
  {
    "exchange": "ALL"
  }
  ```
* **Contoh Respons JSON**:
  ```json
  {
    "success": true,
    "data": {
      "syncedExchanges": ["BINANCE", "BYBIT", "OKX"],
      "totalUpserted": 7,
      "status": "SUCCESS"
    },
    "message": "Sinkronisasi exchange berhasil. Data saldo telah diperbarui dan ditimpa tanpa duplikasi."
  }
  ```

