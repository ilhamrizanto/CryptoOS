---
name: senior-pr-reviewer
description: Skill untuk melakukan code review komprehensif berstandar Staff/Principal Engineer pada Pull Request (PR) atau diff kode, menilai arsitektur, kepatuhan rules, keamanan, performa, test coverage, dan memberikan feedback terstruktur.
---

# Senior PR Reviewer Workflow (Staff/Principal Engineer Standard)

Gunakan skill ini ketika pengguna meminta review kode, audit Pull Request, evaluasi diff perubahan file, atau validasi kesiapan merge ke branch utama (`main`/`production`).

## 1. Multi-Dimensional Review Framework
Evaluasi kode berdasarkan 6 pilar kualitas:

1. **Architecture & Design Integrity**:
   - Apakah kode mematuhi batas layer (SoC) yang diatur di `.agents/rules/coding-style.md`?
   - Apakah ada pelanggaran Dependency Inversion atau coupling yang terlalu ketat?
2. **Correctness & Edge Cases**:
   - Apakah ada celah logika bisnis, off-by-one errors, atau race conditions pada operasi asinkronus?
   - Apakah penanganan nilai `null`, `undefined`, atau empty state sudah komprehensif?
3. **Security & Data Privacy**:
   - Apakah ada input yang belum divalidasi dengan Zod/schema validator?
   - Apakah ada potensi kebocoran data sensitif ke log atau response API?
4. **Performance & Scalability**:
   - Apakah ada N+1 database queries atau memory leaks (uncleaned event listeners/timers)?
   - Apakah ada operasi CPU-bound yang memblokir main event loop?
5. **Type Safety & Maintainability**:
   - Apakah ada penggunaan `any` tersembunyi atau type casting yang tidak aman (`as Type`)?
   - Apakah kode self-documenting dan mudah dipahami oleh engineer lain?
6. **Test Coverage & Quality**:
   - Apakah skenario kegagalan (*error path*) dan edge cases diuji, bukan hanya *happy path*?
   - Apakah unit/integration tests bersifat deterministik dan tidak *flaky*?

## 2. Structured Feedback Taxonomy (Conventional Comments)
Saat memberikan komentar pada baris kode tertentu, gunakan label standar industri untuk membedakan tingkat urgensi:
- **`🔴 [BLOCKER]`**: Masalah kritis yang WAJIB diperbaiki sebelum PR di-merge (misal: celah keamanan, bug fatal, data corruption risk).
- **`🟠 [MAJOR]`**: Masalah arsitektur atau performa signifikan yang sangat direkomendasikan untuk diperbaiki sekarang.
- **`🟡 [MINOR]`**: Perbaikan kecil, penamaan variabel, atau pembersihan kode yang tidak memblokir fungsionalitas.
- **`💡 [NITPICK]`**: Preferensi gaya penulisan minor (opsional untuk diubah).
- **`👏 [PRAISE]`**: Apresiasi untuk implementasi kode yang elegan atau arsitektur yang sangat baik.

## 3. Executive Review Summary Format
Sajikan review dalam format eksekutif:
```markdown
# 📋 Pull Request Review Summary

## 🚦 Merge Verdict: [APPROVED / REQUEST CHANGES / NEEDS DISCUSSION]
**Overall Quality Score**: X/10

### 🌟 Strengths & Highlights
- Ringkasan hal-hal yang sudah sangat baik pada PR ini.

### ⚠️ Key Findings & Action Items
- Ringkasan poin-poin yang wajib diperbaiki sebelum merge.

### 🔍 Detailed Code Feedback
- Komentar spesifik per file dan per baris dengan label taksonomi di atas + usulan kode perbaikan konkret.
```
