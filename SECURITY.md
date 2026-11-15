# Security Policy

## Supported Versions

CryptoOS actively maintains and patches security issues on the following release branches:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## Reporting a Vulnerability

The CryptoOS development team takes the security of financial data, API keys, and quantitative infrastructure very seriously.

If you believe you have discovered a vulnerability, security bug, or potential data leak in CryptoOS:

1. **Do NOT publicly disclose the issue** in GitHub issues, discussions, Discord, or social media.
2. Please privately disclose the issue by sending an email with detailed reproduction steps to:
   - **Email:** `ilhamgb11@gmail.com` with the subject line `[CryptoOS] Security Report - [brief description]`.
3. Include the following details in your report:
   - Type of vulnerability (e.g., Auth bypass, SQL injection, API key exposure, CSRF, XSS).
   - Step-by-step instructions or Proof of Concept (PoC) script to reproduce the issue.
   - Affected endpoints, components, or files.
   - Recommended mitigations or patches (if available).

### Response Timelines
- **Initial Acknowledgement:** Within 24-48 hours.
- **Triage & Severity Assessment:** Within 72 hours.
- **Fix & Patch Deployment:** Critical vulnerabilities are addressed with highest priority.

---

## Secrets & API Key Hygiene

CryptoOS connects to external market data endpoints and authentication providers (Google OAuth, CoinGecko, TradingView, Binance). Maintainers and contributors must follow these strict practices:

- **Never commit `.env` files**: All secrets must reside in local `.env` files which are strictly excluded by `.gitignore`.
- **Database Safety**: The local SQLite database (`cryptoos.db`) contains personal journal entries, notes, and trade logs. Never check `.db`, `.db-wal`, or `.db-shm` files into version control.
- **Google Service Account Credentials**: Files matching `*-GAService.json` or `*service-account*.json` are strictly ignored by git.
- **CORS Restrictions**: Production deployments must enforce explicit origins and reject wildcard (`*`) access when credentials or session cookies are involved.
