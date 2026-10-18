---
name: event-driven-architect
description: Skill untuk merancang sistem asinkronus, Message Broker (RabbitMQ, Kafka, Redis Streams/PubSub, BullMQ), background workers, webhook delivery, dan Transacational Outbox Pattern.
---

# Event-Driven Architecture & Async Messaging Workflow

Gunakan skill ini ketika merancang komunikasi asinkronus antar-layanan, background processing, message queues, atau integrasi webhook yang tangguh.

## 1. Message Broker & Queue Topology
- **Pola Pemilihan Broker**:
  - **Task Queue / Background Jobs (BullMQ / Celery)**: Untuk delay jobs, cron scheduled tasks, retry with backoff, dan progress tracking.
  - **Pub/Sub Messaging (RabbitMQ / Redis PubSub)**: Untuk event broadcast ke beberapa konsumen secara decoupled.
  - **Event Streaming & Replay (Apache Kafka)**: Untuk high-throughput distributed event logs dan event sourcing.
- **Message Payload Standardization**:
  - Bungkus event payload dengan struktur standar CloudEvents:
    - `id`: UUID unik dari event.
    - `type`: Tipe event (contoh: `order.created.v1`).
    - `source`: Nama service pengirim (contoh: `billing-service`).
    - `timestamp`: ISO-8601 UTC timestamp.
    - `data`: Payload data utama.

## 2. Reliability & Consistency Patterns
- **Transactional Outbox Pattern**:
  - Saat menyimpan data ke database dan mengirim event ke broker secara bersamaan, simpan event ke tabel `outbox` di dalam database transaction yang sama untuk mencegah *Dual-Write Failure*.
  - Gunakan background worker/Debezium untuk membaca tabel outbox dan mempublikasikannya ke broker.
- **Idempotent Consumers (At-Least-Once Delivery)**:
  - Setiap consumer wajib menerapkan *idempotency check* menggunakan `eventId` / `idempotencyKey` di Redis/Database untuk mencegah proses ganda akibat pengiriman ulang pesan.
- **Dead Letter Queue (DLQ) & Exponential Backoff**:
  - Konfigurasikan retry otomatis dengan *exponential backoff + jitter* (contoh: retry setelah 1s, 5s, 30s, 2m).
  - Pesan yang gagal diproses setelah N kali percobaan wajib dialihkan ke DLQ untuk investigasi manual tanpa memblokir antrean utama.

## 3. Webhook Architecture (Incoming & Outgoing)
- **Outgoing Webhooks**:
  - Tanda tangani payload webhook dengan HMAC-SHA256 signature (`X-Signature-256`) menggunakan secret key bersama.
  - Batasi timeout pengiriman maksimal 5 detik dan gunakan async queue worker.
- **Incoming Webhooks**:
  - Segera verifikasi signature, simpan payload ke antrean/database, dan kembalikan respon `200/202 Accepted` secepat mungkin (< 500ms) sebelum memproses logika bisnis berat.
