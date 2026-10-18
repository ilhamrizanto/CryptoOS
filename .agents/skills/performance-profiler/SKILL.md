---
name: performance-profiler
description: Skill untuk menganalisis dan mengoptimalkan performa aplikasi fullstack, mendeteksi bottleneck query database (N+1 problem), optimasi bundle size, memory leak, caching strategy (Redis/HTTP), dan Core Web Vitals.
---

# Performance Profiler & Optimization Workflow

Gunakan skill ini ketika pengguna ingin meningkatkan kecepatan aplikasi, menganalisis query lambat, mengoptimasi rendering frontend, atau mengurangi konsumsi resource/memori.

## 1. Backend & Database Profiling
Periksa area performa backend:
- **Database Query Analysis (N+1 Detection)**:
  - Cek query database yang dijalankan di dalam loop (`for/forEach/map`).
  - Ganti dengan teknik **Batching (IN operator)**, **Eager Loading**, atau **DataLoader Pattern**.
- **Indexing & Query Plan (EXPLAIN ANALYZE)**:
  - Identifikasi operasi *Sequential Scan (Full Table Scan)* pada tabel besar dan rekomendasikan pembuatan index yang tepat.
- **Caching Architecture (Layered Cache)**:
  - Evaluasi kebutuhan In-Memory Cache (Redis/Memcached) dengan strategi invalidasi yang tepat: *Cache-Aside*, *Write-Through*, atau *Time-To-Live (TTL) with Stale-While-Revalidate*.
- **I/O & Async Execution**:
  - Ganti operasi I/O sekuensial yang independen menjadi paralel menggunakan `Promise.all()` / `Promise.allSettled()`.
  - Hindari blocking event loop dengan komputasi sinkronus berat (alihkan ke worker threads atau background jobs queue).

## 2. Frontend & Rendering Optimization
Periksa area performa browser & web vitals:
- **Core Web Vitals**:
  - **LCP (Largest Contentful Paint)**: Prioritaskan preloading gambar hero / fonts penting; optimasi format gambar (WebP/AVIF).
  - **INP (Interaction to Next Paint)**: Hindari long tasks di main thread (> 50ms); gunakan *transition hooks* (`useTransition`) atau debouncing/throttling pada input/scroll listener.
  - **CLS (Cumulative Layout Shift)**: Berikan atribut `width` dan `height` eksplisit pada semua gambar, video, dan container iklan; gunakan CSS `min-height` untuk skeleton loader.
- **Component Re-render Optimization**:
  - Identifikasi unnecessary re-renders akibat pembuatan object/array baru secara inline pada props.
  - Terapkan `React.memo`, `useMemo`, dan `useCallback` secara targeted (bukan membabi-buta, fokus pada komputasi berat dan referential equality).
- **Bundle Size & Code Splitting**:
  - Terapkan dynamic imports (`lazy()` / `next/dynamic`) pada halaman dan modal/dialog berat yang tidak langsung terlihat saat load awal.
  - Hindari mengimpor seluruh library monolitik jika hanya butuh satu fungsi (contoh: gunakan `import debounce from 'lodash/debounce'` alih-alih `import { debounce } from 'lodash'`).

## 3. Profiling Output & Actionable Recommendations
Sajikan hasil audit performa dengan tabel perbandingan:
| Komponen / Operasi | Masalah Saat Ini (Bottleneck) | Dampak Estimasi | Rekomendasi Solusi & Kode |
| :--- | :--- | :--- | :--- |
| Query Pengambilan Order | N+1 Query pada relasi item | Latensi 450ms $\to$ 1200ms | Eager load dengan `include: { items: true }` |
