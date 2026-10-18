# 🏛️ Universal Senior Fullstack Guidelines & Adaptive Engineering Constitution

> **Prinsip Dasar**: Dokumen ini dirancang sebagai template universal yang dapat diduplikasi ke berbagai proyek masa depan (Frontend, Backend, Mobile, Cloud, Fullstack Monorepo, maupun Microservices). Aturan di bawah adalah *pedoman mutu produksi*, namun **Prinsip #0 (Pragmatisme & Adaptabilitas)** selalu memiliki prioritas tertinggi.

---

## 0. Meta-Rule: Prinsip Pragmatisme, Adaptabilitas & Inovasi (HIGHEST PRIORITY)
- **Pedoman Bukan Dogma**: Standar di bawah adalah *best practices* default. Namun, jika dalam implementasi nyata terdapat batasan teknis (misal: library pihak ketiga tidak kompatibel, arsitektur legacy yang kaku, trade-off performa ekstrem, atau instruksi spesifik dari pengguna), **model AI diizinkan dan didorong untuk berimprovisasi, berkreasi, dan memilih solusi yang paling pragmatis**.
- **Transparent Rationale**: Jika model harus menyimpang dari salah satu aturan (misal terpaksa menggunakan type assertion atau struktur non-standar), sertakan penjelasan singkat yang rasional: *mengapa* keputusan tersebut diambil dan bagaimana mitigasinya.
- **Fail-Safe Evolution**: Jika terdapat konflik antar-aturan atau konfigurasi yang cacat/membingungkan, utamakan **fungsionalitas kerja, keamanan data, dan kejelasan kode** di atas kepatuhan sintaksis kaku.

---

## 1. Arsitektur & Pola Desain (Clean, Layered & Modular Architecture)
- **Separation of Concerns (SoC)**:
  - **Interface / Transport Layer (Controllers, Route Handlers, Resolvers)**: Bertugas memetakan input, autentikasi awal, dan memformat respon. Hindari logika bisnis murni di layer ini.
  - **Domain / Service Layer**: Menampung *core business logic* yang agnostic terhadap framework HTTP.
  - **Data Access Layer (Repositories, ORM, Query Builders)**: Mengisolasi operasi persistence (Database, Cache, External API).
- **Boundary Validation**: Validasi input di batas luar aplikasi (menggunakan schema validator seperti Zod, Valibot, atau Pydantic) sebelum data diproses oleh domain logic.
- **Single Responsibility**: Jaga fungsi tetap fokus dan ringkas (ideal 30–50 baris). Jika fungsi terlalu gemuk, pecah menjadi sub-routine atau helpers yang deklaratif.
- **Boy Scout Rule & Legacy Handling**: Pada codebase legacy, tinggalkan kode sedikit lebih bersih dari saat ditemukan (*incremental refactoring*) tanpa menimbulkan *breaking changes* fatal.

---

## 2. Type Safety & Data Integrity (Zero-Compromise)
- **Strict Typing Default**:
  - Hindari penggunaan tipe `any`. Utamakan `unknown` dengan *type narrowing*, *discriminated unions*, atau generics.
  - Tulis *explicit return types* pada fungsi publik dan API handler untuk mencegah *accidental contract drift*.
- **Immutability First**:
  - Gunakan immutable data structures (`readonly`, `as const`, immutable update patterns) untuk state krusial guna mencegah *side-effects*.

---

## 3. Database, Concurrency & Data Integrity
- **Query Safety**: Selalu gunakan *Parameterized Queries* atau ORM yang aman untuk mencegah SQL/NoSQL Injection.
- **Performance Awareness**: Waspadai masalah performa klasik seperti **N+1 Queries** (gunakan batching / eager loading / DataLoader) dan ketiadaan indeks pada kolom filter/join/sort.
- **Transactions & Idempotency**:
  - Bungkus mutasi multi-tabel dalam *Database Transaction* dengan rollback yang aman.
  - Gunakan *Idempotency Keys* pada mutasi kritis (pembayaran, order creation, trigger webhook) untuk mencegah duplikasi eksekusi.

---

## 4. Keamanan & Defense-in-Depth (OWASP Standards)
- **Zero Secrets in Codebase**: Kredensial, API key, dan access token wajib melalui environment variables yang divalidasi saat startup runtime (`env.ts`).
- **Authorization at Domain Level**: Jangan hanya mengandalkan route middleware; pastikan kepemilikan data (*tenant/user isolation*) divalidasi langsung di query database atau domain layer.
- **Hardening**: Terapkan rate limiting pada public endpoints, konfigurasi CORS restriktif, dan gunakan security headers (Helmet / CSP).

---

## 5. Observability, Error Handling & Resilience
- **Structured Domain Errors**:
  - Gunakan hierarki error terstruktur (misal: `NotFoundError`, `UnauthorizedError`, `ValidationError`) yang mewarisi `AppError` dasar dengan `statusCode`, `errorCode`, dan user-safe `message`.
- **Never Swallow Errors**: Dilarang menggunakan `catch (e) {}` kosong. Error wajib ditangani atau diteruskan ke central error handler.
- **Structured Telemetry**: Utamakan JSON structured logging (`level`, `message`, `timestamp`, `traceId`) daripada `console.log` mentah di production.

---

## 6. Frontend Architecture & Modern UI Standards
- **State Colocation**: Letakkan state sedekat mungkin dengan komponen yang memakainya. Bedakan antara *Server State (Cache)*, *URL State*, dan *Local UI State*.
- **4-State UI Handling**: Setiap aksi asinkronus wajib menangani 4 status:
  1. *Loading State* (Skeleton / visual placeholder yang proporsional).
  2. *Error State* (Pesan user-friendly + aksi retry).
  3. *Empty State* (Ilustrasi / CTA saat data kosong).
  4. *Success / Data State*.
- **Accessibility & Semantics (a11y)**: Gunakan elemen semantik HTML5, sertakan `aria-label` jika tidak ada teks visual, dan pastikan keyboard-navigable.

---

## 7. Testing Strategy & Maintainability
- **ROI-Driven Testing**: Utamakan *Integration Tests* untuk alur fungsional nyata di samping unit tests untuk domain logic murni.
- **Self-Documenting Code**: Nama variabel dan fungsi harus deklaratif. Tulis komentar hanya untuk menjelaskan *alasan ("MENGAPA")* suatu keputusan desain diambil, bukan sekadar *apa yang dilakukan*.
