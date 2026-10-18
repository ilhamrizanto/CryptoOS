# AI-OS Concept and MVP Developer Specification

## 1. Nama Produk

AI-OS — Personal AI Work Operating System

## 2. Tujuan Produk

Membangun sistem yang membantu pengguna mengonfigurasi dan menjalankan pekerjaan berbasis AI melalui spesifikasi modular.

Sistem tidak dimaksudkan sebagai chatbot biasa. Sistem harus membantu pengguna:
- Menjelaskan tujuan pekerjaan.
- Memilih role dan skill.
- Menentukan karakter kerja.
- Menetapkan batasan.
- Mengatur tingkat otonomi.
- Menentukan titik approval.
- Menjalankan tugas bertahap.
- Menyimpan konteks dan hasil antara.
- Menghasilkan output final yang dapat diperiksa.

## 3. Sasaran MVP

MVP hanya membuktikan mekanisme inti, bukan membangun platform AI yang kompleks.

MVP harus mendukung:
1. Task setup.
2. Role library.
3. Skill library.
4. Behavior library.
5. Constraint library.
6. Configuration resolver berbasis aturan.
7. Approval manual.
8. Task state sederhana.
9. Workflow knowledge-work.
10. Output berupa teks terstruktur dan file hasil jika tool tersedia.

## 4. Ruang Lingkup MVP

### Termasuk
- Pembuatan task.
- Pemilihan konfigurasi.
- Penyimpanan konfigurasi.
- Eksekusi tahap demi tahap.
- Persetujuan pengguna.
- Penyimpanan hasil setiap tahap.
- Rangkuman, riset, synthesis, laporan, dan outline paparan.
- Pencatatan sumber.
- Quality checklist.

### Tidak termasuk
- Otonomi tanpa batas.
- Eksekusi tindakan eksternal berisiko.
- Pengiriman otomatis ke pihak luar.
- Perubahan sistem produksi.
- Multi-agent kompleks.
- Billing atau multi-tenant.
- Integrasi enterprise yang belum diperlukan.

## 5. Aktor

### User
- Membuat task.
- Menyetujui konfigurasi.
- Mengubah role, skill, behavior, dan constraint.
- Memberikan materi.
- Memeriksa hasil.
- Menyetujui output final.

### AI Engine
- Memahami tujuan.
- Mengusulkan konfigurasi.
- Menjalankan skill.
- Menghasilkan output.
- Menandai ketidakpastian.
- Meminta approval.

### Library Manager
- Menambah, mengubah, dan mengarsipkan komponen library.

## 6. Modul Sistem

### 6.1 Task Manager
Tanggung jawab:
- Membuat task.
- Menyimpan status.
- Menampilkan task aktif.
- Mengarsipkan task selesai.

### 6.2 Task Understander
Tanggung jawab:
- Mengambil objective, context, scope, audience, dan output.
- Mengidentifikasi ambiguitas.
- Menentukan pertanyaan yang diperlukan.

### 6.3 Configuration Resolver
Tanggung jawab:
- Memetakan tujuan ke role dan skill.
- Mengusulkan behavior dan constraint.
- Menentukan tingkat otonomi.
- Menentukan approval points.

### 6.4 Library Manager
Tanggung jawab:
- Membaca library.
- Menampilkan komponen.
- Memvalidasi schema.
- Mengelola versi.

### 6.5 Execution Engine
Tanggung jawab:
- Menjalankan tahapan.
- Menggunakan konfigurasi yang disetujui.
- Menghasilkan intermediate output.
- Menghentikan proses pada approval point.

### 6.6 Approval Manager
Tanggung jawab:
- Menampilkan keputusan yang perlu disetujui.
- Menyimpan keputusan.
- Mencegah eksekusi tahap terlarang sebelum approval.

### 6.7 Evidence Manager
Tanggung jawab:
- Menyimpan sumber.
- Menghubungkan klaim dengan sumber.
- Menandai status verifikasi.
- Mencegah pencampuran sumber internal dan eksternal.

### 6.8 Task State Manager
Tanggung jawab:
- Menyimpan konfigurasi.
- Menyimpan output antar-tahap.
- Menyimpan keputusan.
- Menyimpan pertanyaan terbuka.
- Mendukung resume.

### 6.9 Quality Control
Tanggung jawab:
- Memeriksa acceptance criteria.
- Memeriksa sumber.
- Memeriksa konsistensi.
- Memeriksa format output.
- Menghasilkan daftar masalah.

## 7. Model Data Minimal

### Task

```yaml
id: string
title: string
objective: string
context: string
audience: string
scope:
  included: []
  excluded: []
status: draft | configured | executing | waiting_approval | review | completed | blocked
configuration_id: string
current_stage: string
created_at: datetime
updated_at: datetime
```

### Configuration

```yaml
id: string
task_id: string
roles: []
skills: []
behaviors: []
constraints: []
autonomy_level: low | medium | high
approval_points: []
approved: boolean
approved_at: datetime
```

### Task Artifact

```yaml
id: string
task_id: string
stage: string
type: summary | research | synthesis | outline | report | presentation | review
content: string
source_refs: []
version: integer
status: draft | approved | superseded
created_at: datetime
```

### Approval

```yaml
id: string
task_id: string
stage: string
question: string
options: []
decision: string
notes: string
approved_by: user
created_at: datetime
```

## 8. State Machine

```text
DRAFT
  ↓
UNDERSTANDING
  ↓
CONFIGURATION_PROPOSED
  ↓
WAITING_APPROVAL
  ↓
CONFIGURED
  ↓
EXECUTING
  ↓
WAITING_APPROVAL
  ↓
REVIEW
  ↓
COMPLETED
```

Jika terjadi masalah:
- EXECUTING → BLOCKED
- REVIEW → REVISION_REQUIRED
- REVISION_REQUIRED → EXECUTING

## 9. Workflow Knowledge-Work

### Stage 1 — Understand
Input:
- Instruksi pengguna.
- Dokumen.
- Tujuan.
- Audiens.

Output:
- Task specification.
- Daftar pertanyaan.
- Asumsi.

### Stage 2 — Configure
Output:
- Role.
- Skill.
- Behavior.
- Constraint.
- Autonomy.
- Approval points.

### Stage 3 — Analyze
Output:
- Struktur materi.
- Fakta penting.
- Istilah.
- Bagian yang belum jelas.

### Stage 4 — Research
Output:
- Research questions.
- Source list.
- Evidence table.
- Verification status.

### Stage 5 — Summarize
Output:
- Ringkasan terstruktur.
- Fakta utama.
- Angka penting.
- Keterbatasan.

### Stage 6 — Synthesize
Output:
- Hubungan antar-sumber.
- Tema.
- Persamaan dan perbedaan.
- Interpretasi yang diberi label.

### Stage 7 — Produce
Output:
- Outline laporan atau paparan.
- Draft laporan.
- Struktur slide.
- File PPT jika generator tersedia.

### Stage 8 — Quality Control
Output:
- Checklist.
- Daftar masalah.
- Rekomendasi revisi.
- Status kelayakan.

## 10. Aturan Configuration Resolver

1. Gunakan role paling sedikit yang cukup.
2. Gunakan skill yang benar-benar mendukung objective.
3. Behavior harus diterjemahkan menjadi aturan observabel.
4. Constraint wajib diberi severity.
5. Tugas berisiko rendah dapat menggunakan otonomi lebih tinggi.
6. Tugas dengan keputusan material harus memiliki approval point.
7. Jika sumber eksternal digunakan, evidence policy otomatis aktif.
8. Jika output berupa PPT, presentation designer dan audience-oriented otomatis disarankan.
9. Jika pengguna memberi konfigurasi eksplisit, konfigurasi tersebut mengalahkan inferensi sistem.
10. Sistem harus menjelaskan alasan pemilihan konfigurasi secara singkat.

## 11. Acceptance Tests MVP

### Test 1 — Tugas sederhana
Input: “Ringkas dokumen ini menjadi lima poin.”
Expected:
- Sistem tidak menanyakan pertanyaan yang tidak perlu.
- Sistem memilih document analysis dan summarization.
- Output memiliki lima poin.

### Test 2 — Tugas ambigu
Input: “Pelajari materi ini.”
Expected:
- Sistem menanyakan tujuan penggunaan materi atau menawarkan beberapa pilihan.
- Sistem tidak langsung membuat output yang tidak diminta.

### Test 3 — Riset eksternal
Input: “Pelajari materi ini dan cari informasi terbaru.”
Expected:
- Sistem mengusulkan ruang lingkup riset.
- Sumber eksternal dicatat.
- Klaim penting memiliki evidence.

### Test 4 — Paparan
Input: “Buatkan paparan dari materi ini.”
Expected:
- Sistem menanyakan audiens dan tujuan jika belum tersedia.
- Sistem membuat outline sebelum PPT.
- Pengguna dapat menyetujui atau mengubah outline.
- Angka dan fakta tidak berubah.

### Test 5 — Revisi
Input: “Ubah slide 4 saja.”
Expected:
- Sistem tidak mengulang seluruh proses.
- Hanya artefak terkait yang diperbarui.
- Versi sebelumnya tetap tersimpan.

### Test 6 — Klaim tidak didukung
Input: “Tambahkan data yang belum ada.”
Expected:
- Sistem menolak mengarang.
- Sistem menawarkan riset atau placeholder yang jelas.

## 12. Struktur Proyek yang Disarankan

```text
ai-os-mvp/
├── README.md
├── docs/
│   ├── ai-specification-framework.md
│   ├── architecture.md
│   └── workflows.md
├── config/
│   └── app.yaml
├── libraries/
│   ├── roles/
│   ├── skills/
│   ├── behaviors/
│   └── constraints/
├── schemas/
├── engine/
│   ├── task-understander/
│   ├── configuration-resolver/
│   ├── execution/
│   ├── approval/
│   ├── evidence/
│   ├── task-state/
│   └── quality-control/
├── tasks/
├── outputs/
└── tests/
```

## 13. Rencana Implementasi

1. Buat schema YAML atau JSON.
2. Buat tiga role awal:
   - Mentor
   - Researcher
   - Presentation Designer
3. Buat lima skill awal:
   - Document Analysis
   - Web Research
   - Summarization
   - Synthesis
   - Presentation Structuring
4. Buat behavior inti:
   - Professional
   - Critical
   - Evidence-driven
   - Audience-oriented
5. Buat constraint inti:
   - No fabrication
   - Preserve numbers
   - Cite external sources
   - Approval before finalization
6. Buat task setup.
7. Buat resolver berbasis aturan.
8. Buat state machine.
9. Buat approval flow.
10. Uji dengan lima kasus nyata.
11. Dokumentasikan kegagalan.
12. Perluas library secara bertahap.

## 14. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Sistem terlalu kompleks | Mulai dari MVP kecil |
| Terlalu banyak pertanyaan | Gunakan pertanyaan adaptif |
| AI mengarang | Evidence policy dan quality control |
| Token boros | Task state dan reuse artifact |
| Workflow terlalu kaku | Resolver berbasis objective |
| Output tidak sesuai audiens | Audience specification |
| Revisi mengulang semuanya | Versioning dan artifact-level revision |
| Konfigurasi tidak konsisten | Schema dan library validation |

## 15. Definition of Done

MVP dianggap selesai jika:
- Pengguna dapat membuat task.
- Sistem dapat mengusulkan konfigurasi.
- Pengguna dapat menyetujui atau mengubah konfigurasi.
- Sistem dapat menjalankan minimal satu workflow multi-tahap.
- Sistem dapat berhenti pada approval point.
- Sistem menyimpan output antar-tahap.
- Sistem dapat melanjutkan task.
- Sumber eksternal tercatat.
- Quality control menghasilkan checklist.
- Lima acceptance test utama berhasil.

## 16. Catatan Implementasi untuk Antigravity

Dokumen ini menjadi dasar instruksi pembangunan. Antigravity tidak boleh langsung membangun seluruh sistem tanpa:
1. Mengonfirmasi pemahaman requirements.
2. Mengusulkan architecture.
3. Menjelaskan trade-off.
4. Membuat implementation plan.
5. Memecah pekerjaan menjadi milestone.
6. Menyediakan acceptance test.
7. Meminta approval sebelum perubahan arsitektur material.
8. Menjaga struktur modular.
9. Tidak menambahkan fitur di luar scope tanpa persetujuan.
10. Menyediakan dokumentasi penggunaan.

## 17. Langkah Berikutnya

Langkah berikutnya adalah mengubah dokumen ini menjadi:
- Product Requirements Document.
- Technical Design Document.
- Library seed files.
- UI flow.
- Implementation plan.
- Test plan.

