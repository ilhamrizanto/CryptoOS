---
name: api-scaffold
description: Skill untuk membuat endpoint atau fitur API baru secara terstandar menggunakan Clean / Layered Architecture lengkap dari DTO validation, Controller, Service, Repository, hingga Integration Test.
---

# API Scaffold Workflow (Senior Fullstack Standard)

Ketika pengguna meminta untuk membuat endpoint, module, atau fitur API baru (REST / RPC / GraphQL), jalankan alur kerja terstruktur berikut:

## 1. Domain Modeling & Contract Definition (DTO)
- Tentukan schema input dan output secara presisi menggunakan validator (misal: Zod, Valibot, atau Pydantic).
- Terapkan prinsip *Parse, Don't Validate*: pastikan data yang masuk langsung dikonversi menjadi TypeScript interface yang strongly-typed.
- Sertakan deskripsi error yang jelas untuk setiap kegagalan validasi field.

## 2. Interface & Contract Isolation
- Definisikan interface/abstraksi untuk **Service** dan **Repository**.
- Pastikan tidak ada dependensi melingkar (*circular dependency*).

## 3. Layer Implementation (Inside-Out atau Outside-In)
- **Data Access Layer (Repository)**:
  - Buat method untuk query/mutasi database.
  - Wajib gunakan *parameterized queries* atau typed ORM methods.
  - Tangani database transaction jika operasi melibatkan lebih dari satu tabel.
- **Business Logic Layer (Service)**:
  - Implementasikan aturan bisnis murni.
  - Lempar *custom domain error* (misal `NotFoundError`, `ConflictError`, `ValidationError`) jika kondisi bisnis tidak terpenuhi.
  - Layer ini dilarang menyentuh objek request/response HTTP mentah.
- **Transport Layer (Controller / Handler)**:
  - Parsing HTTP request (body, query, params, headers).
  - Validasi otentikasi/otorisasi awal.
  - Panggil Service layer dan petakan hasilnya ke HTTP status code yang sesuai (200, 201, 204).

## 4. Automated Testing Generation
- Buat file test yang mencakup:
  - **Happy Path**: Skenario ketika semua input valid dan data berhasil diproses.
  - **Validation Failures (400)**: Uji ketika payload tidak sesuai schema.
  - **Domain Failures (404/409/403)**: Uji saat resource tidak ditemukan atau konflik.
  - **Edge Cases**: Uji batasan nilai (misal string kosong, integer melebihi batas, data null).

## 5. Output Deliverable Checklist
Pastikan seluruh file yang dihasilkan telah mematuhi aturan di `.agents/rules/coding-style.md` (no `any`, explicit return types, structured error handling).
