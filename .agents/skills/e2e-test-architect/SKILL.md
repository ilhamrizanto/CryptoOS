---
name: e2e-test-architect
description: Skill untuk merancang automasi pengujian End-to-End (Playwright / Cypress), Page Object Model (POM), pengujian API integration, visual regression, dan penanganan tes yang deterministik (anti-flaky).
---

# E2E Test & Browser Automation Workflow

Gunakan skill ini ketika membuat automated UI tests, skenario End-to-End (E2E), Page Object Model (POM), atau memverifikasi alur pengguna kritis menggunakan Playwright / Cypress.

## 1. Page Object Model (POM) Architecture
- **Struktur Folder Terisolasi**:
  ```text
  tests/e2e/
  ├── pages/             # Page Object Models (Selectors & User Interactions)
  │   ├── LoginPage.ts
  │   ├── DashboardPage.ts
  │   └── CheckoutPage.ts
  ├── fixtures/          # Test data, auth state storage, mocked network requests
  └── specs/             # Actual test scenarios
      ├── auth.spec.ts
      └── checkout.spec.ts
  ```
- **Prinsip POM**:
  - Semua CSS/XPath selector dan aksi navigasi berada di dalam class Page Object.
  - File test `*.spec.ts` hanya berisi alur bisnis deskriptif dan assertion (`expect(page).toHaveURL(...)`).

## 2. Resilient & Deterministic Locators (Anti-Flaky Tests)
- **Locator Priority Hierarchy**:
  1. `page.getByRole('button', { name: 'Submit' })` *(Paling direkomendasikan karena menguji a11y)*.
  2. `page.getByLabel('Email Address')`
  3. `page.getByPlaceholder('Enter your email')`
  4. `page.getByTestId('submit-btn')` *(Gunakan `data-testid` jika tidak ada teks/role yang stabil)*.
  - ❌ **Dilarang**: Menggunakan XPath rapuh (`/div[2]/div/span[1]`) atau class name dinamis generated CSS (`.css-1a2b3c`).
- **Eliminasi Flakiness**:
  - Dilarang keras menggunakan `page.waitForTimeout(5000)` (hardcoded sleep).
  - Selalu gunakan *Auto-waiting assertions* bawaan framework (`await expect(locator).toBeVisible()`, `await expect(locator).toHaveText(...)`).

## 3. Auth Storage State & Fast Setup
- Jangan mengulangi pengisian form login manual di setiap test case.
- Gunakan fitur `storageState` (Playwright) untuk login satu kali di global setup, lalu gunakan state cookie/token tersebut di seluruh test suite lainnya.

## 4. Visual Regression & Cross-Browser Testing
- Tangkap snapshot screenshot untuk komponen visual sensitif (`await expect(page).toHaveScreenshot('dashboard.png')`).
- Konfigurasikan pengujian untuk berjalan di Chromium, Firefox, dan WebKit (Mobile Safari emulation).
