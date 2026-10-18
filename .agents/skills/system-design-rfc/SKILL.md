---
name: system-design-rfc
description: Skill untuk menyusun dokumen desain teknis (Technical RFC / Architecture Design Document), analisis trade-off sistem, kalkulasi kapasitas/throughput, dan diagram arsitektur terdistribusi.
---

# Technical RFC & System Design Workflow

Gunakan skill ini ketika merancang sistem berskala besar, memimpin inisiatif arsitektur baru, menyusun dokumen Request for Comments (RFC), atau melakukan analisis perbandingan teknologi.

## 1. Technical RFC Document Structure
Setiap dokumen desain teknis harus mengikuti struktur standar industri:

```markdown
# [RFC-XXX] [Judul Desain Sistem / Fitur]
- **Author**: [Nama/Role]
- **Status**: [PROPOSED / UNDER REVIEW / APPROVED / REJECTED]
- **Date**: [Tanggal]

## 1. Executive Summary & Problem Statement
- Latar belakang masalah bisnis/teknis yang ingin diselesaikan.
- Nilai tambah dan dampak dari solusi yang diajukan.

## 2. Goals & Non-Goals (Scope Boundary)
- **In-Scope (Goals)**: Apa yang AKAN dibangun oleh sistem ini.
- **Out-of-Scope (Non-Goals)**: Apa yang TIDAK dibangun atau ditunda untuk fase berikutnya.

## 3. High-Level Architecture & Data Flow
- Visualisasi diagram sistem menggunakan Mermaid (Service boundaries, Database, Cache, Message Queues).
- Penjelasan alur request dari user hingga persistence layer.

## 4. Detailed Component Design
- **API Contracts**: Endpoint spesifikasi, input/output payload schema.
- **Data Models & Schema**: Entity-Relationship Diagram (ERD), skema tabel database, strategi partitioning/sharding.
- **State Machine / Business Rules**: Logika transisi state penting.

## 5. Non-Functional Requirements (NFR) & Capacity Estimation
- **Throughput & Latency**: Estimasi Request Per Second (RPS), target p95/p99 latency.
- **Storage Estimation**: Perkiraan volume data per hari/bulan/tahun dan strategi retensi/archival.
- **Availability & Fault Tolerance**: Single Point of Failure (SPOF) mitigation, SLA target (99.9% / 99.99%).

## 6. Alternatives Considered & Trade-Offs (Pros vs Cons)
- Opsi alternatif yang dievaluasi (contoh: PostgreSQL vs MongoDB, REST vs gRPC).
- Rationale mengapa opsi terpilih adalah yang terbaik untuk skenario ini.

## 7. Migration, Rollout & Rollback Strategy
- Tahapan rollout (Phased Rollout / Canary Deployment / Feature Flag).
- Rollback trigger dan prosedur darurat jika terjadi kegagalan.
```

## 2. Architecture Trade-Off Principles
- Terapkan **CAP Theorem** dan **PACELC Theorem** secara sadar dalam memilih konsistensi vs ketersediaan sistem.
- Hindari *Premature Optimization*: utamakan kesederhanaan arsitektur (Modular Monolith) sebelum beralih ke Microservices yang kompleks.
