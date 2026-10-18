---
name: legacy-refactor-pro
description: Skill untuk merestrukturisasi dan me-refactor kode legacy/spaghetti secara aman tanpa breaking change, menerapkan Design Patterns (Adapter, Facade, Strategy), dan penguraian Technical Debt bertahap.
---

# Legacy Code Refactoring & Technical Debt Remediation Workflow

Gunakan skill ini ketika menghadapi kode monolitik warisan (*legacy*), fungsi raksasa (500+ baris), *god classes*, dependency kusut, atau saat ingin merapikan kode lama tanpa merusak fungsi yang sudah berjalan di produksi.

## 1. Safety-Net First (Characterization Tests)
Sebelum mengubah baris kode apa pun pada fungsi legacy:
1. **Jangan refactor tanpa test**: Tulis **Characterization Tests** (Golden Master Tests) untuk mengunci perilaku sistem saat ini (bahkan jika ada *buggy behavior* yang sudah menjadi ekspektasi klien).
2. Verifikasi test lolos 100% pada kode lama sebagai batas aman (*baseline*).

## 2. Refactoring Patterns & Strategies
- **Strangler Fig Pattern**:
  - Bangun modul baru berdampingan dengan modul legacy.
  - Alihkan lalu lintas panggilan secara bertahap dari modul lama ke modul baru hingga modul lama kosong dan dapat dihapus dengan aman.
- **Extract Method / Class**:
  - Pecah fungsi raksasa menjadi fungsi-fungsi kecil murni dengan tanggung jawab tunggal.
  - Pisahkan I/O operations (database/network) dari domain computational logic.
- **Design Pattern Replacements**:
  - Ganti `switch-case` / `if-else` bertingkat yang panjang dengan **Strategy Pattern** atau **Command Pattern**.
  - Bungkus library pihak ketiga yang sudah usang dengan **Adapter Pattern** agar mudah diganti di kemudian hari.
  - Sederhanakan antarmuka sub-sistem yang rumit dengan **Facade Pattern**.

## 3. Step-by-Step Micro-Commit Process
- Lakukan refactoring dalam langkah-langkah kecil (*micro-steps*):
  1. *Rename* variabel & parameter agar lebih representatif.
  2. *Extract helper functions* tanpa mengubah alur logika.
  3. *Introduce interfaces / abstractions*.
  4. *Substitute implementation*.
- Jalankan test suite di setiap mikro-langkah untuk memastikan tidak ada regresi.

## 4. Technical Debt Paydown Report
Dokumentasikan perubahan yang dilakukan:
- **Before vs After Metrics**: Kompleksitas siklomatis (*Cyclomatic Complexity*), duplikasi baris kode, dan kecepatan eksekusi.
- **Risk Assessment**: Area yang belum tersentuh dan memerlukan fase refactoring lanjutan.
