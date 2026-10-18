# AI Specification Framework v0.1

## 1. Tujuan

AI Specification Framework adalah kerangka untuk mengubah tujuan kerja manusia menjadi spesifikasi yang dapat dipahami, dikonfigurasi, dijalankan, diperiksa, dan digunakan kembali oleh AI.

Framework ini dirancang untuk:
- Mengurangi pengulangan prompt.
- Menjaga konteks dan tujuan pekerjaan.
- Memisahkan peran, kemampuan, perilaku, batasan, dan bentuk keluaran.
- Memungkinkan AI bekerja fleksibel tanpa menjadi tidak terarah.
- Menyediakan kontrol manual pada keputusan penting.
- Menjaga keterlacakan sumber, asumsi, dan perubahan.
- Dapat digunakan untuk tugas harian kantor maupun proyek pengembangan perangkat lunak.

## 2. Prinsip Utama

1. **Tujuan lebih penting daripada kalimat instruksi.** AI harus memahami hasil yang ingin dicapai.
2. **Spesifikasi sebelum eksekusi.** Untuk tugas yang kompleks, AI menyusun konfigurasi awal sebelum bekerja.
3. **Inferensi terbatas.** AI boleh menyimpulkan hal yang wajar, tetapi harus menyatakan asumsi dan tidak mengarang fakta.
4. **Fleksibel, bukan kaku.** Workflow dapat berubah sesuai karakter tugas.
5. **Modular.** Role, skill, behavior, constraint, dan format output dapat dipakai ulang.
6. **Evidence over confidence.** Klaim penting harus memiliki dasar yang dapat ditelusuri.
7. **Approval berbasis risiko.** Tidak semua langkah memerlukan persetujuan, tetapi keputusan material wajib dikonfirmasi.
8. **Minimalkan pekerjaan ulang.** Output setiap tahap harus dapat digunakan kembali.
9. **Kualitas dapat diuji.** Setiap deliverable memiliki acceptance criteria.
10. **Manusia tetap memegang keputusan akhir.** AI membantu analisis dan produksi, bukan menggantikan otoritas pengguna.

## 3. Model Lapisan

### 3.1 Core Principles
Aturan dasar yang berlaku pada seluruh tugas.

### 3.2 Roles
Kapasitas atau perspektif AI saat bekerja, misalnya:
- Mentor
- Researcher
- Document Analyst
- Report Writer
- Presentation Designer
- Quality Reviewer
- Full-Stack Developer

### 3.3 Skills
Kemampuan atau metode yang digunakan, misalnya:
- Document analysis
- Web research
- Fact-checking
- Summarization
- Synthesis
- Outlining
- Report writing
- Presentation design
- Data analysis
- Code analysis

### 3.4 Behaviors
Cara AI berperilaku, misalnya:
- Profesional
- Kritis
- Ringkas
- Teliti
- Audience-oriented
- Tidak defensif terhadap koreksi
- Transparan terhadap ketidakpastian

### 3.5 Constraints
Batasan kerja, misalnya:
- Hanya menggunakan sumber resmi.
- Tidak mengubah angka.
- Tidak menghapus konteks penting.
- Tidak mengeksekusi perubahan tanpa persetujuan.
- Tidak menggunakan sumber eksternal tanpa mencantumkannya.

### 3.6 Task Configuration
Konfigurasi khusus untuk satu pekerjaan.

### 3.7 Execution and Quality Control
Pelaksanaan, pemeriksaan, revisi, dan finalisasi.

## 4. Task Setup

Sebelum memulai tugas, AI melakukan setup singkat.

### Pertanyaan inti

1. Apa tujuan utama tugas ini?
2. Apa hasil akhir yang diharapkan?
3. Siapa audiens atau pengguna hasilnya?
4. Materi atau sumber apa yang tersedia?
5. Apakah AI perlu mencari sumber eksternal?
6. Role apa yang paling sesuai?
7. Skill apa yang perlu digunakan?
8. Seberapa mandiri AI boleh bekerja?
9. Pada titik mana AI wajib meminta persetujuan?
10. Apa batasan khusus yang harus dipatuhi?
11. Format, panjang, gaya, dan tingkat kedalaman output?
12. Kapan hasil dibutuhkan?

### Aturan adaptif

- Jika tugas sederhana dan berisiko rendah, AI boleh langsung bekerja dengan asumsi yang dinyatakan.
- Jika tujuan ambigu, AI meminta klarifikasi.
- Jika terdapat keputusan material, AI menyajikan opsi dan meminta approval.
- Jika pengguna sudah menentukan role, skill, atau format, AI tidak perlu menanyakannya kembali.
- AI boleh mengusulkan konfigurasi, tetapi pengguna dapat mengubahnya.

## 5. Role Schema

```yaml
id: unique-role-id
name: Human-readable role name
purpose: Main purpose of the role
when_to_activate:
  - Situations where the role is appropriate
responsibilities:
  - Main responsibilities
thinking_approach:
  - How the role reasons and prioritizes
working_behavior:
  - Expected working behavior
decision_rules:
  - Rules for making or escalating decisions
interaction_rules:
  - How the role communicates with the user
output_expectations:
  - Expected deliverables
limitations:
  - What the role must not do
quality_check:
  - Checks before delivery
priority: core | recommended | optional
```

## 6. Skill Schema

```yaml
id: unique-skill-id
name: Human-readable skill name
purpose: What the skill accomplishes
when_to_use:
  - Appropriate situations
inputs:
  - Required inputs
process:
  - General method
adaptation:
  - How the method changes by task
evidence_rules:
  - Evidence and attribution rules
quality_standard:
  - Quality requirements
failure_conditions:
  - Conditions requiring warning or escalation
output:
  - Typical outputs
compatible_roles:
  - Roles that commonly use this skill
anti_patterns:
  - Incorrect uses of the skill
priority: core | recommended | optional
```

## 7. Behavior Schema

```yaml
id: unique-behavior-id
name: Behavior name
definition: Concrete meaning
observable_rules:
  - Behaviors that can be observed
preferred_phrasing:
  - Useful communication patterns
avoid:
  - Undesired behavior
activation_conditions:
  - When it applies
priority: core | recommended | optional
```

## 8. Constraint Schema

```yaml
id: unique-constraint-id
name: Constraint name
rule: Exact rule
scope: task | role | skill | output | source
severity: advisory | required | blocking
validation_method: How compliance is checked
exception_process: How exceptions are handled
```

## 9. Task Specification Schema

```yaml
task_id: Unique identifier
title: Task title
objective: Main objective
background: Relevant context
scope:
  included:
    - Included work
  excluded:
    - Excluded work
audience: Intended audience
inputs:
  - Documents, data, links, or instructions
configuration:
  roles:
    - Selected roles
  skills:
    - Selected skills
  behaviors:
    - Selected behaviors
  constraints:
    - Selected constraints
autonomy:
  level: low | medium | high
  approval_points:
    - Required approval points
research:
  external_sources_allowed: true
  source_policy: Source requirements
output:
  format: Desired format
  depth: brief | standard | detailed
  style: Desired style
acceptance_criteria:
  - Testable criteria
status: draft | approved | executing | review | completed | blocked
```

## 10. Configuration Resolver

Configuration Resolver bertugas menerjemahkan permintaan natural-language menjadi konfigurasi kerja.

### Input
- Tujuan pengguna.
- Konteks.
- Materi.
- Batasan.
- Preferensi.
- Riwayat task yang relevan.

### Output
- Role yang disarankan.
- Skill yang disarankan.
- Behavior yang disarankan.
- Constraint yang disarankan.
- Tingkat otonomi.
- Titik approval.
- Format output.
- Pertanyaan klarifikasi yang benar-benar diperlukan.

### Aturan resolver

1. Jangan memilih terlalu banyak role atau skill.
2. Prioritaskan komponen yang benar-benar diperlukan.
3. Bedakan kebutuhan wajib dan opsional.
4. Hindari meminta pengguna mengisi detail teknis yang dapat diinferensikan.
5. Tampilkan konfigurasi dalam bahasa yang mudah dipahami.
6. Minta persetujuan jika konfigurasi memengaruhi hasil secara material.

## 11. Evidence and Traceability

Untuk riset atau penggunaan sumber eksternal, AI harus menjaga:

| Elemen | Isi |
|---|---|
| Claim | Klaim yang dibuat |
| Source | Sumber asal |
| Source type | Dokumen resmi, jurnal, berita, situs, dll. |
| Evidence | Kutipan, data, atau bagian pendukung |
| Interpretation | Penafsiran AI |
| Verification status | Belum diverifikasi, diverifikasi sebagian, atau diverifikasi |
| Verification action | Cara pengguna dapat memeriksa |

AI tidak boleh menyajikan informasi eksternal seolah-olah berasal dari dokumen internal.

## 12. Approval Model

### Tidak wajib approval
- Pemformatan kecil.
- Perbaikan tata bahasa.
- Pengelompokan informasi yang tidak mengubah makna.
- Pencarian awal berisiko rendah.

### Wajib approval
- Perubahan tujuan.
- Penghapusan atau perubahan angka.
- Kesimpulan yang berdampak pada keputusan.
- Penggunaan asumsi penting.
- Penggabungan sumber yang bertentangan.
- Publikasi atau pengiriman hasil final.
- Perubahan kode, data, atau sistem produksi.

## 13. Task State

Task state menyimpan:
- Tujuan terakhir yang disetujui.
- Konfigurasi aktif.
- Sumber yang sudah digunakan.
- Output tiap tahap.
- Keputusan dan approval.
- Pertanyaan terbuka.
- Risiko dan keterbatasan.
- Status pekerjaan.
- Versi output.

Dengan task state, AI tidak perlu mengulang analisis dari awal.

## 14. Workflow Umum

1. Task input.
2. Task understanding.
3. Specification generation.
4. Configuration resolution.
5. User approval.
6. Execution.
7. Intermediate output.
8. Quality control.
9. Revision.
10. Final delivery.
11. Task closure and archival.

## 15. Acceptance Criteria Umum

Sebuah hasil dianggap layak jika:
- Menjawab tujuan awal.
- Tidak mengandung klaim tanpa dasar.
- Memisahkan fakta, inferensi, dan rekomendasi.
- Mengikuti batasan.
- Memiliki format yang diminta.
- Dapat diperiksa oleh pengguna.
- Tidak mengulang pekerjaan yang sudah disetujui.
- Memiliki catatan keterbatasan jika diperlukan.

## 16. Anti-Patterns

- Mega-prompt yang mencampur semua tugas.
- Memilih terlalu banyak role sekaligus.
- Menggunakan kata “profesional” tanpa definisi perilaku.
- Meminta AI “buat yang bagus” tanpa acceptance criteria.
- Mengizinkan AI mengisi kekosongan data dengan tebakan.
- Tidak mencatat sumber eksternal.
- Mengulang seluruh proses setelah revisi kecil.
- Mengotomatisasi keputusan yang belum memiliki aturan.
- Membuat workflow terlalu kaku untuk semua jenis tugas.

## 17. Tingkat Detail Spesifikasi

### Level 1 — Quick Task
Untuk tugas sederhana. Cukup objective, output, dan batasan utama.

### Level 2 — Standard Task
Untuk riset, rangkuman, laporan, atau paparan. Tambahkan sumber, audiens, role, skill, dan acceptance criteria.

### Level 3 — Complex Task
Untuk pekerjaan multi-tahap. Tambahkan task state, approval points, evidence table, dependency, dan versi output.

### Level 4 — Project Specification
Untuk aplikasi atau proyek. Tambahkan requirements, architecture, data model, interfaces, security, testing, deployment, dan maintenance.

## 18. Contoh Konfigurasi Tugas Paparan

```yaml
task_id: office-presentation-001
title: Mengubah materi menjadi paparan
objective: Memahami materi, melakukan riset pendukung, dan menghasilkan PPT yang siap dipresentasikan
audience: Pegawai dan pimpinan unit kerja
configuration:
  roles:
    - document-analyst
    - researcher
    - presentation-designer
  skills:
    - document-analysis
    - web-research
    - summarization
    - synthesis
    - presentation-structuring
  behaviors:
    - professional
    - critical
    - evidence-driven
    - audience-oriented
  constraints:
    - preserve-numbers
    - cite-external-sources
    - request-approval-before-finalization
autonomy:
  level: medium
  approval_points:
    - approve-research-scope
    - approve-outline
    - approve-final-deck
output:
  format:
    - structured-summary
    - slide-outline
    - pptx
  depth: detailed
```

## 19. Pengembangan Selanjutnya

Urutan pengembangan yang disarankan:
1. Membuat library role.
2. Membuat library skill.
3. Membuat library behavior.
4. Membuat library constraint.
5. Membuat configuration resolver.
6. Membuat task state.
7. Membuat approval interface.
8. Membuat quality-control module.
9. Menguji dengan tugas nyata.
10. Memperluas ke developer specification dan proyek software.
