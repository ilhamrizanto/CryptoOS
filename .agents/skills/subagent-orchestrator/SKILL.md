---
name: subagent-orchestrator
description: Skill untuk memecah masalah berskala besar menjadi tugas-tugas terisolasi dan mendelegasikannya ke Subagents secara paralel guna menjaga kebersihan konteks memori dan efisiensi eksekusi.
---

# Subagent Orchestration & Parallel Delegation Workflow

Gunakan skill ini ketika menghadapi tugas besar/kompleks yang mencakup multi-domain (Frontend + Backend + DB), audit codebase besar, atau pengujian browser otomatis.

## 1. Task Decomposition (Pemisahan Tanggung Jawab)
Identifikasi batas isolasi pekerjaan sebelum mendelegasikan ke subagent:
- **Prinsip Clean Boundary**: Setiap subagent harus memiliki input yang jelas (misal: API contract atau daftar file target) dan output yang terdefinisi (misal: file terbuat atau laporan audit).
- **Domain Separation**:
  - *Subagent DB & Schema*: Menangani skema SQL, migrasi, dan seed data.
  - *Subagent Backend API*: Menangani route handlers, DTO validation, dan domain logic.
  - *Subagent Frontend Components*: Menangani UI markup, CSS, dan client state.
  - *Subagent Browser Automation*: Menjalankan testing browser interaktif dan validasi visual.

## 2. Delegation Prompt Contract (Instruksi Mandiri)
Setiap kali menginisialisasi subagent, berikan instruksi lengkap yang mandiri (*self-contained*):
1. **Clear Objective**: Apa tujuan akhir yang harus dicapai.
2. **Context & Constraints**: File apa saja yang boleh diakses/diedit dan aturan apa yang wajib dipatuhi (`.agents/rules/coding-style.md`).
3. **Deliverable Requirement**: Format laporan akhir apa yang wajib dikembalikan ke agen utama.

## 3. Integration & Synthesis Review
Setelah subagent mengembalikan laporannya:
- Agen utama memverifikasi integritas hasil kerja (menjalankan linter/test suite global).
- Mengintegrasikan hasil kerja subagent ke dokumen implementasi dan menyampaikannya ke pengguna.
