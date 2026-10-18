---
name: db-migration-architect
description: Skill untuk merancang migrasi skema database (SQL / NoSQL / ORM), memastikan zero-downtime migration, analisis indexing, pembuatan rollback script, dan mitigasi risiko table locking pada produksi.
---

# Database Migration & Schema Architecture Workflow

Gunakan skill ini ketika pengguna ingin mengubah skema database, membuat migrasi baru, menambahkan indeks, atau merestrukturisasi tabel database produksi.

## 1. Safety Impact Analysis (Pre-Migration Checklist)
Sebelum menulis script migrasi, analisis dampak perubahan terhadap database yang sedang berjalan:
- **Destructive Operations Check**: Apakah ada operasi `DROP COLUMN`, `DROP TABLE`, atau `RENAME COLUMN`?
  - *Mitigasi Zero-Downtime*: Terapkan **Expand-and-Contract Pattern (Parallel Run)**:
    1. *Expand*: Tambahkan kolom baru tanpa menghapus kolom lama.
    2. *Dual-Write*: Update aplikasi untuk menulis ke kedua kolom.
    3. *Backfill*: Migrasikan data historis dari kolom lama ke kolom baru.
    4. *Contract*: Hapus kolom lama pada rilis aplikasi berikutnya setelah tidak ada dependensi tersisa.
- **Table Lock Risk**: Apakah penambahan indeks atau kolom `NOT NULL` dengan nilai default akan mengunci tabel besar?
  - Pada PostgreSQL: Gunakan `CREATE INDEX CONCURRENTLY` dan `ALTER TABLE ADD COLUMN ... DEFAULT ...` dengan syntax aman.
  - Pada MySQL: Gunakan strategi `ALGORITHM=INPLACE, LOCK=NONE` jika didukung.

## 2. Migration Script Generation (Dual-Way: Up & Down)
- Tulis script **UP** (migrasi maju) dan script **DOWN** (rollback) yang simetris dan aman.
- Gunakan schema types yang tepat (contoh: gunakan `TIMESTAMPTZ` alih-alih `TIMESTAMP` mentah; gunakan `BIGINT` untuk ID auto-increment skala besar).
- Terapkan konvensi penamaan seragam: `snake_case` untuk nama tabel dan kolom; `idx_<table>_<columns>` untuk nama index; `fk_<table>_<referenced_table>` untuk foreign keys.

## 3. Query & Index Optimization Review
- Tentukan index yang relevan untuk kolom pencarian/filter:
  - Gunakan **Composite Index** jika query sering memfilter beberapa kolom sekaligus (perhatikan urutan kolom: *equality columns first, range columns second*).
  - Evaluasi kebutuhan **Partial/Filtered Index** jika data memiliki kardinalitas timpang (misal: hanya mengindeks record dengan status `status = 'ACTIVE'`).

## 4. Rollback & Disaster Recovery Plan
Sediakan dokumen singkat berisi:
1. Perkiraan waktu eksekusi migrasi.
2. Langkah verifikasi pasca-migrasi (verifikasi row count, constraint validity).
3. Langkah eksekusi rollback instan jika terjadi insiden di produksi.
