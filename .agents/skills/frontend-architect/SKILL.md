---
name: frontend-architect
description: Skill untuk merancang arsitektur frontend modern, komponen UI berbasis Design System, compound components, state management (server vs client state), dan accessibility (a11y).
---

# Frontend Architecture & Design System Workflow

Gunakan skill ini ketika merancang arsitektur UI/Frontend, membuat library komponen, mengonfigurasi state management, atau membangun pengalaman interaktif yang kompleks.

## 1. Component Architecture (Atomic & Compound Patterns)
- **Component Classification**:
  - **Primitif / Atoms**: Komponen tanpa dependency domain (`Button`, `Input`, `Dialog`, `Tooltip`).
  - **Molecules / Organisms**: Komposisi komponen dengan interaksi (`SearchWithFilter`, `DataTable`, `UserNavbarCard`).
  - **Templates / Layouts**: Struktur halaman responsif (`DashboardLayout`, `AuthLayout`).
- **Compound Components Pattern**:
  - Gunakan pola Compound Components atau Headless UI (Radix / Ark UI) untuk komponen interaktif kompleks (misal `<Tabs>`, `<Accordion>`, `<Modal>`) agar konsumen komponen memiliki kontrol fleksibel terhadap markup JSX tanpa *prop-drilling*.

## 2. State Partitioning Strategy
- Pisahkan state ke dalam 3 kategori строго:
  1. **Server State (Cache)**: Gunakan React Query / TanStack Query / SWR. Tangani caching, deduping, background refetching, dan optimistic updates di layer ini.
  2. **URL State**: Simpan filter, sort, pagination, search query, dan active modal di query params (`?page=2&filter=active`) agar halaman bersifat *shareable* & *bookmarkable*.
  3. **Local / Transient State**: Gunakan React `useState` / `useReducer` atau state machine (XState) untuk interaksi UI lokal murni.

## 3. Design System & Styling Consistency
- Gunakan Tailwind CSS atau Design Tokens (CSS Variables) untuk warna, tipografi, spacing, dan border-radius.
- Pastikan komponen mendukung **Dark Mode** secara mulus tanpa layout glitch.
- Gunakan utility `clsx` / `tailwind-merge` (`cn` helper) untuk penggabungan class name yang aman dan bebas konflik.

## 4. Accessibility (a11y) & UX Polish
- Pastikan semua komponen interaktif dapat dioperasikan penuh via keyboard (Tab, Enter, Escape, Arrow keys).
- Terapkan WAI-ARIA roles, states, dan properties secara akurat (`aria-expanded`, `aria-controls`, `aria-describedby`).
- Tambahkan animasi mikro yang halus menggunakan CSS transitions atau Motion library dengan menghormati preferensi user (`prefers-reduced-motion`).
