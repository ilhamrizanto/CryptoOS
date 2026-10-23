# Contributing to CryptoOS

Thank you for your interest in contributing to **CryptoOS — Quantitative Trading Terminal & Intelligence Engine**!

CryptoOS is built with high standards of software craftsmanship, quantitative rigor, and institutional design aesthetics. Please read these guidelines before submitting issues or pull requests.

---

## Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please maintain a respectful, constructive, and professional environment.

---

## Architecture & Technology Stack

- **Monorepo Structure**: Managed via **NPM Workspaces** (`backend` and `frontend`).
- **Backend**: Node.js, Express, TypeScript, Better-SQLite3 / SQLite, Google Auth Library.
- **Frontend**: React 19, Vite, TypeScript, Lucide Icons, Vanilla CSS (Emil Kowalski Design Engineering & Cardless Pure Black OLED).
- **Design Standard**: Cardless Pure Black (`#000000`) OLED architecture. **Tailwind CSS is strictly avoided** in favor of curated CSS design tokens and high-performance scoped styles.

---

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/cryptoos.git
   cd cryptoos
   ```

2. **Install all dependencies (Root, Backend, and Frontend)**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Ensure `PORT=3001` and `CORS_ORIGIN=http://localhost:5173`.

4. **Launch Development Servers**:
   ```bash
   npm run dev
   ```
   - Frontend runs on: `http://localhost:5173`
   - Backend API runs on: `http://localhost:3001`

---

## Git Workflow & Branching Strategy

We follow a structured Git feature branch workflow:

1. **Branch Naming**:
   - `feature/short-description` — New features or quantitative modules.
   - `fix/short-description` — Bug fixes or UI corrections.
   - `perf/short-description` — Performance optimizations or database indexing.
   - `docs/short-description` — Documentation updates.

2. **Commit Message Format (Conventional Commits)**:
   Use clear, conventional commit prefixes:
   - `feat(calculator): add half-kelly criterion slider and visual buffer gauge`
   - `fix(pipeline): resolve floating glass HUD centering`
   - `perf(token-icon): implement multi-cdn waterfall with in-memory caching`
   - `docs(readme): add architecture diagrams and api reference`
   - `refactor(journal): convert table layout into cardless terminal standard`

---

## Coding Standards

### 1. TypeScript & Type Safety
- **Strict Typing**: Avoid `any` wherever possible. Define explicit interfaces in `types/` for shared domain models (`trade.types.ts`, `market.types.ts`, etc.).
- **Zero Compilation Errors**: Always run `npm run lint` and `npx tsc --noEmit` before committing.

### 2. UI Polish & Aesthetics
- **Color Discipline**: Adhere strictly to the institutional design palette:
  - Background: Pure Black `#000000`.
  - Gold Accent: `#D4AF37` / `var(--color-accent-primary)`.
  - Bullish Emerald: `#10B981` / `var(--color-bullish)`.
  - Bearish Rose: `#F43F5E` / `var(--color-bearish)`.
- **Cardless Architecture**: Do not use heavy bordered container boxes with side edges (`border-left: none`, `border-right: none`). Use clean hairline top/bottom dividers (`1px solid rgba(255, 255, 255, 0.08)`).
- **Responsive & Micro-Interactions**: Interactive elements must feature tactile hover states, smooth transitions (`150ms cubic-bezier(0.23, 1, 0.32, 1)`), and unambiguous visual feedback.

---

## Submitting Pull Requests

1. **Verify Code Quality**:
   ```bash
   npm run build
   npx tsc --noEmit
   ```
2. **Push to Your Branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Open Pull Request**:
   - Provide a clear description using our [Pull Request Template](.github/pull_request_template.md).
   - Attach visual screenshots or screen recordings showing your changes on the browser terminal.
   - Ensure the CI automated checks pass.

Thank you for helping make CryptoOS the standard for personal quantitative crypto workstations!
