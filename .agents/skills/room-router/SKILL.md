---
name: room-router
description: Dynamic dispatcher that routes user tasks across 6 specialized skill rooms (Architecture, Frontend/UI, Testing/QA, Document Engine, SaaS Automations, or Custom Skills). Automatically adapts to newly added or modified skills in the workspace.
---

# 🧭 Room Router: Universal Agentic Dispatcher

The Room Router is an intelligent dispatch layer that partitions 878+ skills into 6 domain-specific "Rooms". It ensures high precision, zero token bloat, and maximum adaptability to ongoing changes in `.agents/`.

---

## 🏛️ The 6 Domain Rooms

| Room | Domain & Scope | Top Skills Included | On-Demand Location |
| :--- | :--- | :--- | :--- |
| **Room 1** | **Core Architecture & Backend** | `api-scaffold`, `db-migration-architect`, `devops-cicd-engineer`, `event-driven-architect`, `legacy-refactor-pro`, `senior-pr-reviewer`, `system-design-rfc` | Active in `.agents/skills/` |
| **Room 2** | **Frontend, UI & Creative Vibes** | `frontend-architect`, `artifacts-builder`, `canvas-design`, `theme-factory`, `brand-guidelines`, `image-enhancer`, `slack-gif-creator` | Active in `.agents/skills/` |
| **Room 3** | **Testing, Quality & Reliability** | `e2e-test-architect`, `webapp-testing` (Playwright), `observability-sre`, `performance-profiler`, `security-auditor` | Active in `.agents/skills/` |
| **Room 4** | **Document Engine & Productivity** | `docx`, `pdf`, `pptx`, `xlsx`, `changelog-generator`, `invoice-organizer`, `content-research-writer`, `meeting-insights-analyzer`, `code-explainer` | Active in `.agents/skills/` |
| **Room 5** | **1000+ SaaS Automations** | 832 individual app integrations (Slack, Notion, Gmail, GitHub, Discord, Airtable, Jira, etc.) + `connect-apps` router | `.agents/skills/saas-automations/<app>-automation/` |
| **Room 6** | **Custom & Dynamic Workspace Skills** | Any new skill folder created by you or your team in `.agents/skills/` | Automatically discovered & routed |

---

## 🚀 Execution & Routing Protocol

When receiving a user task:

1. **Identify the Target Room**:
   - Building APIs, database migrations, CI/CD, or refactoring? → **Activate Room 1**.
   - Designing UI, tweaking colors, Tailwind/React components? → **Activate Room 2**.
   - Testing web UI, debugging regressions, profiling performance? → **Activate Room 3**.
   - Parsing PDFs, editing Excel/Word, generating changelogs? → **Activate Room 4**.
   - Connecting to external cloud apps (Slack, Gmail, Notion, etc.)? → **Activate Room 5**.
   - Working with a project-specific custom workflow? → **Activate Room 6**.

2. **Accessing Room 5 (SaaS Automations) On-Demand**:
   - The 832 SaaS automation skills are stored in `saas-automations/` to keep your base prompt light.
   - When the user mentions an external service (e.g., "Kirim pesan ke Slack"):
     1. Check if the app exists in [rooms-catalog.json](./references/rooms-catalog.json).
     2. Read the SOP directly from `.agents/skills/saas-automations/<app>-automation/SKILL.md`.
     3. Follow the execution steps defined in that skill.

3. **Dynamic Flexibility (Adapting to Changes in `.agents`)**:
   - **New Skill Added?** If a new folder is added to `.agents/skills/`, it is immediately accessible under **Room 6** without breaking any existing rooms.
   - **Re-indexing:** To re-sort and categorize all skills at any time, run:
     ```bash
     node .agents/scripts/sync-rooms.js
     ```
     This regenerates both [rooms-catalog.json](./references/rooms-catalog.json) and [rooms-catalog.md](./references/rooms-catalog.md) in under 1 second.
