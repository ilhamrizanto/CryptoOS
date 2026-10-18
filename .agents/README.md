# 🌟 Universal Agentic Starter Kit: Template Duplikasi Proyek

> **Pusat Template Kustomisasi**: Folder `.agents/` di dalam repositori ini adalah paket siap duplikasi (*turnkey kit*) untuk proyek apa pun yang akan Anda bangun di masa depan.

---

## 📁 Struktur Direktori `.agents/`

```text
.agents/
├── rules/
│   └── coding-style.md             # Konstitusi Senior Fullstack + Meta-Rule Pragmatisme/Adaptabilitas
├── skills/
│   ├── api-scaffold/               # Scaffolding Clean Architecture (Zod -> Controller -> Service -> Repo -> Test)
│   ├── code-explainer/             # Pembongkar kode mendalam, analogi, & visual alur (Mermaid)
│   ├── db-migration-architect/     # Zero-downtime DB migration, Expand-Contract, & Indexing
│   ├── devops-cicd-engineer/       # Docker multi-stage, GitHub Actions CI/CD, Nginx reverse proxy
│   ├── e2e-test-architect/         # Playwright / Cypress POM, anti-flaky locators, & visual regression
│   ├── event-driven-architect/     # Message Queues (Kafka/RabbitMQ/BullMQ), Outbox Pattern, Webhooks
│   ├── frontend-architect/         # Compound Components, Headless UI, URL/Server/Local state, a11y
│   ├── legacy-refactor-pro/        # Refactoring aman kode legacy, Design Patterns (Adapter/Strategy/Facade)
│   ├── observability-sre/          # OpenTelemetry tracing, RED/USE metrics, healthchecks, RCA Post-Mortem
│   ├── performance-profiler/       # Profiling N+1 queries, Core Web Vitals, memory leaks, multi-tier cache
│   ├── security-auditor/           # OWASP Top 10 security audit, IDOR, SQLi/XSS, Secret Scanner
│   ├── senior-pr-reviewer/         # Code review Staff Engineer (skor kualitas, blocker taxonomy, feedback)
│   ├── system-design-rfc/          # Dokumen Desain Teknis (RFC), kalkulasi throughput & CAP trade-off
│   ├── room-router/                # 🧭 Dynamic Dispatcher: Routing 6 Domain Rooms (Zero context bloat)
│   │   └── references/             # Katalog rooms-catalog.json & rooms-catalog.md
│   └── saas-automations/           # 🌐 832 Modul Otomasi SaaS (Slack, Gmail, Notion, GitHub, dll.)
├── hooks.json                      # Konfigurasi 4-Stage Lifecycle Hooks (PreInvocation, PreTool, PostTool, Stop)
├── scripts/
│   ├── sync-rooms.js               # 🔄 Dynamic Re-indexer: Otomatis sinkronisasi saat komponen .agents berubah
│   ├── pre-invocation-guard.js     # Pengingat kualitas kode sebelum AI berpikir
│   ├── security-gate.js            # Safety Gate non-blocking untuk perlindungan OS & file privat
│   ├── post-tool-pipeline.js       # Auto-cleaner format multi-bahasa & audit telemetry logging
│   └── stop-gatekeeper.js          # Quality gatekeeper sebelum percakapan selesai
├── mcp_config.example.json         # Universal Multi-Tool MCP Registry (GitHub, Postgres, SQLite, Puppeteer, Thinking)
└── README.md                       # Panduan ini
```

---

## 🚀 Cara Duplikasi ke Proyek Baru atau Proyek Lama

Kapan pun Anda membuat atau mengerjakan proyek baru di folder lain (misal: `D:\Projects\MyNewApp`):

1. **Salin Folder**:
   Cukup copy folder `.agents/` dari proyek `Learning` ini ke folder root proyek baru Anda:
   ```powershell
   # Contoh via PowerShell:
   Copy-Item -Recurse -Path "C:\Users\TECNO\Desktop\Project\Learning\.agents" -Destination "D:\Projects\MyNewApp\.agents"
   ```

2. **Aktifkan MCP (Jika Dibutuhkan)**:
   - Salin file `.agents/mcp_config.example.json` ke folder config global Anda di:
     `C:\Users\TECNO\.gemini\config\mcp_config.json`
   - Atau simpan sebagai plugin/workspace MCP sesuai kebutuhan.

3. **Selesai & Siap Pakai**:
   Antigravity akan secara otomatis mengenali seluruh **Rules**, **878 Skills** (14 Core Engineering Skills + 864 Universal Community & Automation Skills), **Hooks**, dan konfigurasi MCP di proyek baru tersebut!

---

## 🛡️ Filosofi Adaptif & Anti-Kaku

Sistem template ini menganut **Prinsip Pragmatisme (Meta-Rule #0)**:
- Aturan dan hooks dirancang sebagai **panduan kualitas mutu tinggi**, bukan belenggu yang kaku.
- Jika ada kondisi khusus, library baru, arsitektur unik, atau kebutuhan mendesak di proyek masa depan, AI didorong untuk beradaptasi, berimprovisasi, dan memberikan solusi terbaik yang transparan dan fungsional.
