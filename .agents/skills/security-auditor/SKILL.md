---
name: security-auditor
description: Skill untuk mengaudit keamanan source code, dependency, dan konfigurasi arsitektur berdasarkan standar OWASP Top 10, CWE, secret leaks, dan kontrol akses (AuthN/AuthZ).
---

# Security Auditor & Vulnerability Remediation Workflow

Gunakan skill ini ketika pengguna meminta review keamanan, audit kerentanan kode, penetration testing checklist, atau mitigasi celah keamanan.

## 1. Static Security Analysis Matrix (OWASP Top 10)
Periksa kode terhadap 10 vektor serangan utama:

1. **Injection (SQL, NoSQL, OS Command, Template Injection)**:
   - Pastikan tidak ada penggabungan string langsung (`"SELECT * FROM users WHERE id = " + id`).
   - Cek penggunaan shell execution (`exec`, `eval`, `child_process.exec`) tanpa sanitasi ketat.
2. **Broken Authentication & Session Management**:
   - Periksa kelemahan algoritma JWT (misal menerima `none` algorithm, masa kedaluwarsa terlalu lama, ketiadaan refresh token rotation).
   - Pastikan hashing password menggunakan algoritma modern (Argon2id, bcrypt dengan salt dinamis).
3. **Sensitive Data Exposure & Secret Scanning**:
   - Cari kemungkinan hardcoded API keys, private keys, database credentials, atau token di source code / config files.
   - Pastikan data sensitif (PII, credit card, password) tidak bocor ke log file (`console.log` / structured logs).
4. **Broken Access Control (IDOR / Privilege Escalation)**:
   - Pastikan user A tidak dapat mengakses resource user B hanya dengan mengganti ID di URL (`/api/documents/:id`).
   - Validasi kepemilikan data (tenant isolation / user ownership check) langsung di database query atau domain layer.
5. **Security Misconfiguration & Missing Headers**:
   - Periksa konfigurasi CORS (`Access-Control-Allow-Origin: *` pada endpoint sensitif harus dicegah).
   - Pastikan HTTP security headers aktif (HSTS, CSP, X-Content-Type-Options, X-Frame-Options).
6. **Cross-Site Scripting (XSS) & CSRF**:
   - Periksa penggunaan `dangerouslySetInnerHTML`, `v-html`, atau binding HTML mentah.
   - Pastikan cookie sensitif menggunakan flag `HttpOnly`, `Secure`, dan `SameSite=Lax/Strict`.
7. **Rate Limiting & DoS Protection**:
   - Pastikan endpoint login, register, reset password, dan operasi CPU-intensive (export PDF, image processing) dilindungi oleh rate limiter.

## 2. Severity Scoring & Classification
Kelompokkan setiap temuan keamanan dengan standar CVSS / Severity Level:
- 🔴 **CRITICAL**: Remote Code Execution (RCE), SQL Injection langsung, Authentication Bypass total.
- 🟠 **HIGH**: Insecure Direct Object References (IDOR), kebocoran token rahasia, XSS tersimpan.
- 🟡 **MEDIUM**: Missing Rate Limiting, CSRF pada endpoint non-kritis, Weak CORS configuration.
- 🔵 **LOW / INFO**: Missing security headers, verbose error messages (stack trace leakage).

## 3. Remediation Report Format
Untuk setiap celah yang ditemukan, sajikan laporan dengan struktur:
1. **Title & Severity**: `[HIGH] IDOR on /api/v1/orders/:orderId endpoint`
2. **Vulnerable Code Snippet**: Tunjukkan baris kode yang bermasalah.
3. **Exploit Scenario (Proof-of-Concept)**: Bagaimana penyerang dapat mengeksploitasi celah tersebut.
4. **Remediation Patch (Fixed Code)**: Berikan kode perbaikan konkret yang siap disalin/di-merge.
