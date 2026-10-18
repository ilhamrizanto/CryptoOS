# DESIGN.md — CryptoOS Design System & UI/UX Specification

**Versi**: 1.0.0  
**Tanggal**: 2026-10-18  
**Status**: Draft

---

## 1. Design Philosophy

CryptoOS mengadopsi estetika **"Professional Trading Terminal"** — terinspirasi dari TradingView, Bloomberg Terminal, dan Coinglass — dengan sentuhan antarmuka modern yang nyaman dipakai berjam-jam.

**Prinsip Desain:**
1. **Information Density**: Tampilkan data maksimal tanpa terasa sesak. Setiap piksel punya makna.
2. **Clarity over Decoration**: Animasi dan efek visual ada untuk fungsi, bukan sekadar estetika.
3. **Dark-First**: Dark mode adalah default dan satu-satunya mode (sesuai konteks trading terminal).
4. **Color as Signal**: Warna hijau/merah digunakan secara konsisten dan hanya untuk status positif/negatif (bukan dekorasi).
5. **Touch-Friendly Mobile**: Tap target minimum 44x44px, bottom navigation untuk mobile.

---

## 2. Color Palette

```css
:root {
  /* === BACKGROUND HIERARCHY === */
  --color-bg-base:       #0a0e1a;   /* Latar utama (paling gelap) */
  --color-bg-surface:    #111827;   /* Card, panel */
  --color-bg-elevated:   #1a2332;   /* Dropdown, modal, popover */
  --color-bg-overlay:    #243044;   /* Hover states, selected items */

  /* === BORDER === */
  --color-border:        #1f2d40;
  --color-border-muted:  #162030;
  --color-border-accent: #2a4a6b;

  /* === TEXT === */
  --color-text-primary:  #e8f0fe;   /* Heading utama */
  --color-text-secondary:#94a3b8;   /* Label, placeholder */
  --color-text-muted:    #4a6080;   /* Timestamp, info sekunder */
  --color-text-inverse:  #0a0e1a;   /* Teks di atas background terang */

  /* === ACCENT — Brand === */
  --color-accent-primary:  #3b82f6;   /* Biru — Action utama, link */
  --color-accent-glow:     #1d4ed8;   /* Biru lebih gelap untuk glow */

  /* === SEMANTIC — Trading === */
  --color-bullish:       #10b981;   /* Profit, LONG, positif */
  --color-bullish-dim:   #064e3b;   /* Background badge bullish */
  --color-bearish:       #ef4444;   /* Loss, SHORT, negatif */
  --color-bearish-dim:   #450a0a;   /* Background badge bearish */
  --color-neutral:       #f59e0b;   /* Warning, neutral, pending */
  --color-neutral-dim:   #451a03;

  /* === STATUS === */
  --color-live:    #10b981;   /* Data live / terhubung */
  --color-stale:   #f59e0b;   /* Data stale */
  --color-error:   #ef4444;   /* Error / disconnected */

  /* === GRADIENT === */
  --gradient-brand:  linear-gradient(135deg, #1e3a5f 0%, #0f2040 100%);
  --gradient-bullish:linear-gradient(135deg, #064e3b 0%, #022c22 100%);
  --gradient-bearish:linear-gradient(135deg, #450a0a 0%, #2d0606 100%);
}
```

---

## 3. Typography

```css
/* Import di index.html */
/* https://fonts.google.com/specimen/Inter */
/* https://fonts.google.com/specimen/JetBrains+Mono */

:root {
  /* Font Families */
  --font-sans:  'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono:  'JetBrains Mono', 'Fira Code', monospace;

  /* Font Sizes (fluid scaling) */
  --text-xs:    0.75rem;    /* 12px — Timestamp, label kecil */
  --text-sm:    0.875rem;   /* 14px — Body kecil, badge */
  --text-base:  1rem;       /* 16px — Body utama */
  --text-lg:    1.125rem;   /* 18px — Subheading */
  --text-xl:    1.25rem;    /* 20px — Card title */
  --text-2xl:   1.5rem;     /* 24px — Section heading */
  --text-3xl:   1.875rem;   /* 30px — Page title */
  --text-4xl:   2.25rem;    /* 36px — Hero number (Portfolio value) */

  /* Font Weights */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  /* Line Heights */
  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed:1.75;
}

/* Angka keuangan WAJIB menggunakan font mono */
.value-number {
  font-family: var(--font-mono);
  font-feature-settings: "tnum"; /* Tabular numbers — alignment */
}
```

---

## 4. Spacing & Layout

```css
:root {
  /* Spacing Scale (8px base grid) */
  --space-1:  0.25rem;   /* 4px */
  --space-2:  0.5rem;    /* 8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */

  /* Border Radius */
  --radius-sm:  0.375rem;   /* 6px — Badge, chip */
  --radius-md:  0.5rem;     /* 8px — Input, button */
  --radius-lg:  0.75rem;    /* 12px — Card */
  --radius-xl:  1rem;       /* 16px — Modal, panel */
  --radius-full:9999px;     /* Pill badge */

  /* Shadows */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg:  0 8px 30px rgba(0,0,0,0.6);
  --shadow-glow-blue:   0 0 20px rgba(59,130,246,0.15);
  --shadow-glow-green:  0 0 20px rgba(16,185,129,0.15);
  --shadow-glow-red:    0 0 20px rgba(239,68,68,0.15);
}
```

---

## 5. Responsive Breakpoints

```css
/* Breakpoints */
/* Mobile:  < 768px  — Bottom navigation, stacked layout */
/* Tablet:  768px-1024px — Sidebar navigation, 2-column */
/* Desktop: > 1024px — Full sidebar + multi-column dashboard */

/* CSS Custom Media Queries */
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

---

## 6. Layout Anatomy

### Desktop Layout (>1024px)
```
┌─────────────────────────────────────────────────────────┐
│  TOPBAR: Logo | Live Ticker Strip | Net Worth USD / IDR  │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  SIDEBAR │  MAIN CONTENT AREA                           │
│  (220px) │                                              │
│          │  [Page Content]                              │
│  Navigation                                             │
│  Links   │                                              │
│          │                                              │
│  [Status │                                              │
│  panel]  │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### Mobile Layout (<768px)
```
┌─────────────────────────┐
│  TOPBAR: Logo | Balance  │
├─────────────────────────┤
│                         │
│  MAIN CONTENT AREA      │
│  (Stacked, scrollable)  │
│                         │
│                         │
├─────────────────────────┤
│  BOTTOM NAV (5 tabs)    │
│  🏠 📊 🧮 📔 ⚙️         │
└─────────────────────────┘
```

---

## 7. Navigation Structure

### Desktop Sidebar Navigation
```
CryptoOS
─────────────────
📡 Intelligence     (Global Macro Dashboard)
💡 Pipeline         (Idea Incubator)
🧮 Calculator       (Position Sizer)
📔 Journal          (Trading Log)
💼 Portfolio        (Tracker + Rebalancing)
💰 Cashflow         (Treasury Ledger)
─────────────────
⚙️  Settings
```

### Mobile Bottom Navigation
```
🏠 Dash | 💡 Ideas | 🧮 Calc | 📔 Journal | 💼 Portfolio
```
(Settings diakses via hamburger menu di Topbar di mobile)

---

## 8. Component Specifications

### 8.1 DualCurrencyValue
Komponen paling sering digunakan di seluruh aplikasi.

```
Tampilan Desktop:
$12,450.00              ← Primary (USD, bold, besar)
Rp 202.312.500          ← Secondary (IDR, smaller, muted)

Tampilan Mobile (compact):
$12,450 · Rp 202.3jt   ← Inline, dipisah dot
```

**States:**
- Positive: warna `--color-bullish`
- Negative: warna `--color-bearish`
- Neutral: warna `--color-text-primary`

---

### 8.2 DataStatusBadge
Menampilkan status freshness setiap data feed.

```
🟢 Live              ← Updated < 5 menit lalu
🟡 5m ago            ← Updated 5-30 menit lalu
🔴 Error: Timeout    ← Gagal fetch, tampilkan pesan
⚪ Loading...        ← Sedang fetch pertama kali
```

---

### 8.3 EvidencePasteZone
Area untuk paste screenshot dari clipboard.

**Empty State:**
```
┌─────────────────────────────────────┐
│                                     │
│   📋  Ctrl+V untuk paste screenshot │
│       atau drag & drop file         │
│                                     │
└─────────────────────────────────────┘
```

**Filled State:**
```
┌─────────────────────────────────────┐
│  [Thumbnail gambar]    [🗑️ Hapus]   │
│  Klik untuk zoom full-screen        │
└─────────────────────────────────────┘
```

**Interaction:**
- Paste via Ctrl+V: Seluruh kartu/form mendengarkan event paste
- Drag & drop file image
- Klik thumbnail: Buka Lightbox modal
- Hover: Tampilkan overlay dengan tombol hapus

---

### 8.4 TradeIdeaCard (Pipeline)
```
┌────────────────────────────────────────────┐
│ BTCUSDT  LONG  4H       [READY TO EXECUTE] │
│ ──────────────────────────────────────── │
│ Makro    ████████░░  8/10 checklist filled │
│ FA       ██████░░░░  6/10                  │
│ PA       ████░░░░░░  4 / 5 konfirmasi ✓   │
│ Evidence [Img 1] [Img 2]                   │
│ ──────────────────────────────────────── │
│ Entry: $67,500  SL: $64,200  TP1: $74,000 │
│ Risk: 1.5% ($750) | R:R 1:2.8             │
│                                           │
│ [Edit] [Kirim ke Calculator] [→ Journal]  │
└────────────────────────────────────────────┘
```

---

### 8.5 Position Sizer Layout (Calculator Page)
```
┌─────────────────────────────────────────────────────────┐
│  SMART POSITION SIZE CALCULATOR                         │
├──────────────────────┬──────────────────────────────────┤
│  INPUT               │  OUTPUT (real-time)              │
│                      │                                  │
│  Portfolio: $50,000  │  💵 Risk Amount                  │
│             [Auto]   │     $500.00 / Rp 8.125.000       │
│                      │                                  │
│  Risk %: [━━━●━━━]   │  📦 Position Size                │
│          1.0%        │     $9,174.31 / 135 koin         │
│                      │                                  │
│  Entry:  [______]    │  📊 Risk : Reward                │
│  SL:     [______]    │     1 : 2.8                      │
│  TP1:    [______]    │                                  │
│  TP2:    [______]    │  ⚡ Margin Required               │
│                      │     $917.43 (10x leverage)       │
│  Leverage:[━━━●━━]   │                                  │
│           10x        │  🎯 Est. Liquidation              │
│                      │     $60,750 (Safe: 1.8x from SL) │
│  [From Idea Card ↗]  │                                  │
│                      │  🧠 Kelly Suggestion: 0.8%       │
│                      │  📡 Total Exposure: 3.0%         │
│                      │                                  │
│                      │  ⚠️ WARNING: ...                  │
│                      │                                  │
│                      │  [→ LOG TO JOURNAL]              │
└──────────────────────┴──────────────────────────────────┘
```

---

### 8.6 Global Intelligence Panel Layout
```
┌──────┬──────┬──────┬──────┬──────┬──────┐
│ DXY  │ OIL  │FOMC  │ CPI  │ F&G  │BTC.D │
│105.2 │$78.3 │5.25% │3.2%  │ 72   │ 54%  │
│▲0.3% │▼1.2% │[No   │[Cool]│[Grdy]│      │
│🟢    │🟡 4m │Change│🟢    │🟢    │🟢    │
└──────┴──────┴──────┴──────┴──────┴──────┘

┌──────────────┬──────┬──────┬──────────────┐
│ FEDWATCH     │TOTAL3│MVRV  │ ALTSEASON    │
│Rate: 5.25%   │$892B │ 1.8  │   Index: 67  │
│Next: 28 Oct  │+2.1% │(Fair │  [Alt Season]│
│Ease: 84.5%   │🟢    │Value)│🟢            │
│[→ CME Link]  │      │🟢    │              │
└──────────────┴──────┴──────┴──────────────┘

USD/IDR: Rp 16.250   🟢 Live (2m lalu)
```

---

### 8.7 Emotional Log Component (Journal)
```
┌─────────────────────────────────────────────┐
│  🧠 EMOTIONAL STATE BEFORE ENTRY            │
│                                             │
│  Conviction Level                           │
│  ⭐⭐⭐⭐☆  [━━━━━━━━━●━] 4/5              │
│                                             │
│  Dominant Emotion (pilih semua yang sesuai) │
│  [✓ Confident] [  Calm] [  Anxious]        │
│  [  FOMO] [  Uncertain] [  Greedy]          │
│                                             │
│  Setup Clarity                              │
│  ◉ Crystal Clear  ○ Some Doubt  ○ Forced   │
│                                             │
│  Catatan Psikologi (opsional)               │
│  ┌─────────────────────────────────────┐   │
│  │ Setup terlihat sangat bersih,       │   │
│  │ confluence 4 pilar terpenuhi...     │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 9. Micro-Animations & Transitions

| Elemen | Animasi | Duration |
|---|---|---|
| Page transition | Fade in + slide up 8px | 200ms ease-out |
| Card hover | translateY(-2px) + shadow increase | 150ms ease |
| Number update (price) | Flash highlight (kuning -> normal) | 800ms |
| Positive PnL change | Flash green | 600ms |
| Negative PnL change | Flash red | 600ms |
| Modal open | Scale 0.95->1 + fade in | 200ms ease-out |
| Toast/notification | Slide in dari kanan | 300ms ease |
| Safety Alert | Pulse animation (attention) | 1s infinite |
| Loading skeleton | Shimmer left-to-right | 1.5s infinite |
| Badge status Live | Pulse dot hijau | 2s infinite |

**Aturan Animasi:**
- Respektif terhadap `prefers-reduced-motion: reduce`
- Tidak ada animasi yang memblokir interaksi pengguna
- Durasi maksimal animasi dekoratif: 300ms

---

## 10. Mobile UX Specific Guidelines

### Touch Targets
- Semua tombol interaktif: minimum 44x44px
- Spacing antar tap target: minimum 8px

### Gesture Support
- Swipe horizontal di Journal untuk Quick Actions (Archive, Edit)
- Pull-to-refresh di Portfolio Tracker

### Mobile-Specific Layouts
- Kalkulator: Input di atas, output di bawah (scroll)
- Pipeline card: Compact view dengan expand on tap
- Chart/Graph: Horizontal scroll jika terlalu lebar
- Modal: Bottom sheet style (muncul dari bawah) di mobile

### Form Optimization
- Numeric fields: `inputMode="decimal"` untuk trigger keyboard angka
- Semua form label di atas input (bukan inline placeholder)

---

## 11. States & Feedback Patterns (4-State UI)

Setiap komponen yang mengambil data secara asinkron WAJIB menangani:

### Loading State
```
[Skeleton shimmer — lebar sesuai konten yang ditunggu]
```

### Error State
```
⚠️ Gagal memuat data DXY
   Menggunakan data terakhir (15 menit lalu)
   [Coba Lagi]
```

### Empty State
```
📭 Belum ada trade idea.
   Mulai dengan menganalisis peluang trading Anda.
   [+ Buat Idea Baru]
```

### Success / Data State
```
[Konten data yang dimuat]
```

---

## 12. Color Usage Rules for Trading Data

| Data | Warna | Contoh |
|---|---|---|
| Nilai positif / profit | --color-bullish (#10b981) | +$250, +2.3R, +5.2% |
| Nilai negatif / loss | --color-bearish (#ef4444) | -$100, -1.0R, -3.1% |
| Netral / zero | --color-text-secondary | $0, 0R, 0% |
| LONG direction | --color-bullish | Badge LONG |
| SHORT direction | --color-bearish | Badge SHORT |
| Peringatan / attention | --color-neutral | Warning, FOMO tag |
| Kritis / danger | --color-bearish | Safety Alert, Liquidation warning |

**Aturan Ketat:**
- Jangan gunakan warna merah/hijau untuk dekorasi non-data
- Angka moneter selalu gunakan `font-family: var(--font-mono)`
- Positive number TIDAK boleh memiliki prefix "+", kecuali jika menampilkan delta/change

---

*Dokumen ini adalah living document. Update seiring design iteration.*
