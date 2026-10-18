---
name: observability-sre
description: Skill untuk merancang sistem pemantauan (Observability), OpenTelemetry distributed tracing, integrasi structured logging, metrik Prometheus/Grafana, healthcheck, dan dokumen Root Cause Analysis (RCA / Post-Mortem).
---

# Observability & Site Reliability Engineering (SRE) Workflow

Gunakan skill ini ketika merancang monitoring, distributed tracing, alerting, healthcheck endpoints, atau menganalisis insiden produksi (Post-Mortem).

## 1. The Three Pillars of Observability
Pastikan aplikasi menerapkan 3 pilar utama secara terintegrasi:

1. **Structured Logs (JSON)**:
   - Wajib menyertakan context fields: `timestamp`, `level`, `message`, `service`, `environment`, `traceId`, `spanId`, `userId`, `durationMs`.
   - Pisahkan log level secara disiplin:
     - `ERROR`: Membutuhkan perhatian/intervensi engineer.
     - `WARN`: Kondisi tidak biasa namun sistem masih bisa recover (misal: retry terjadi).
     - `INFO`: Milestone penting bisnis/alur (misal: order created, user registered).
     - `DEBUG`: Detail diagnosa internal yang dinonaktifkan di produksi normal.
2. **Metrics (The RED & USE Methods)**:
   - Terapkan **RED Method** untuk Service/API:
     - **Rate**: Request per second (RPS).
     - **Errors**: Error rate (HTTP 5xx count / total request).
     - **Duration**: Latensi distribusi (Histogram p50, p95, p99).
   - Terapkan **USE Method** untuk Resources (CPU, Memory, Disk, DB Connection Pool):
     - **Utilization**, **Saturation**, **Errors**.
3. **Distributed Tracing (OpenTelemetry)**:
   - Teruskan `traceparent` W3C header antar service HTTP dan Message Queues.
   - Buat custom span untuk operasi database yang lambat atau panggilan API pihak ketiga eksternal.

## 2. Healthcheck Endpoint Standards
Buat 2 endpoint standar Kubernetes/Load Balancer:
- `/healthz/live` (Liveness Probe): Memastikan proses Node/Go/Python masih hidup (kembalikan `200 OK` sederhana).
- `/healthz/ready` (Readiness Probe): Memeriksa koneksi aktif ke dependensi krusial (Database ping, Redis ping, Message Queue connection). Jika salah satu putus, kembalikan `503 Service Unavailable` agar load balancer tidak mengirimkan traffic ke instance ini.

## 3. Incident Post-Mortem / Root Cause Analysis (RCA) Format
Jika terjadi insiden sistem, gunakan template blameless post-mortem berikut:
```markdown
# 🚨 Incident Post-Mortem: [Nama Insiden]
- **Tanggal & Waktu**: [Timestamp UTC]
- **Durasi Downtime**: [X jam Y menit]
- **Severity**: [SEV-1 / SEV-2 / SEV-3]
- **Lead Investigator**: [Nama]

## 1. Executive Summary & Dampak
- Ringkasan apa yang terjadi dan berapa jumlah pengguna/transaksi yang terdampak.

## 2. Timeline Kejadian (UTC)
- `14:00` - Release deployment v2.1.0 dijalankan.
- `14:05` - Alert CPU spike dan error 500 meningkat pada billing service.
- `14:15` - Tim on-call memulai investigasi.
- `14:30` - Rollback ke v2.0.9 berhasil dieksekusi. Sistem kembali normal.

## 3. Root Cause Analysis (5-Whys Method)
- Penjelasan teknis akar masalah secara mendalam mengapa insiden bisa terjadi.

## 4. Action Items & Preventive Measures
- [ ] [P0] Perbaiki query database penyebab table lock (Owner: Alice, Due: Tomorrow).
- [ ] [P1] Tambahkan automated integration test untuk skenario concurrent transactions (Owner: Bob, Due: End of week).
- [ ] [P2] Perketat alert threshold pada database connection pool (Owner: Charlie, Due: Next sprint).
```
