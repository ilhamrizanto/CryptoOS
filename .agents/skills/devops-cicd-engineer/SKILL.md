---
name: devops-cicd-engineer
description: Skill untuk merancang containerization (Docker multi-stage build), automasi CI/CD (GitHub Actions, GitLab CI), konfigurasi reverse proxy (Nginx), dan deployment infrastructure.
---

# DevOps, Containerization & CI/CD Workflow

Gunakan skill ini ketika membuat Dockerfile, konfigurasi docker-compose, pipeline CI/CD otomatis, konfigurasi web server/reverse proxy, atau automasi deployment.

## 1. Production-Grade Containerization (Docker)
- **Multi-Stage Builds**:
  - Stage 1 (`deps`): Instalasi dependensi untuk memaksimalkan Docker layer caching.
  - Stage 2 (`builder`): Build source code / compile bundle.
  - Stage 3 (`runner`): Gunakan minimal runtime image (Distroless / Alpine / Slim) tanpa development tools.
- **Security & Optimization**:
  - Jalankan container dengan **Non-Root User** (`USER node` atau `USER 1001`).
  - Sertakan file `.dockerignore` untuk mengecualikan `node_modules`, `.git`, file `.env`, dan log files.
  - Terapkan `HEALTHCHECK` instruction pada Dockerfile.

## 2. CI/CD Pipeline Architecture (GitHub Actions / GitLab CI)
- Pisahkan pipeline menjadi tahapan terisolasi:
  1. **Lint & Format Check**: Memverifikasi gaya kode dan static analysis.
  2. **Type Check**: Menjalankan TypeScript compiler (`tsc --noEmit`).
  3. **Automated Testing**: Menjalankan Unit & Integration tests dengan reporting hasil test.
  4. **Security Scan**: Menjalankan dependency vulnerability audit (`npm audit` / Trivy / Snyk).
  5. **Build & Artifact Upload**: Membangun image Docker dan push ke Container Registry (GHCR / ECR / Docker Hub) dengan tag semantik (`v1.2.3` dan commit SHA).
  6. **Deployment Trigger**: Continuous Deployment ke environment staging/production dengan rollback strategy.

## 3. Reverse Proxy & Infrastructure Config (Nginx / Cloud)
- Konfigurasikan Nginx dengan:
  - HTTP/2 / HTTP/3 support dan TLS/SSL termination.
  - Gzip / Brotli compression untuk file statis (`.js`, `.css`, `.svg`).
  - Rate limiting zone untuk mitigasi DDoS.
  - Reverse proxy headers: `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Real-IP`.
