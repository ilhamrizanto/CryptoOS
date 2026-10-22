# Design Engineering & Interaction Polish Rules (CryptoOS)
# Based on Emil Kowalski's Design Engineering & UI Motion Philosophy

This rule applies to all UI development, CSS architecture, component creation, and visual interactions across the CryptoOS application.

---

## 1. Core Philosophy: Craft & Taste

1. **Taste is Trained, Not Innate**:
   - Every UI interaction must feel intentional, responsive, and grounded in physical intuition.
   - Avoid generic, sluggish, or flashy animations. Strive for invisible correctness—software that feels so right the user doesn't even consciously question it.
2. **Beauty & Micro-Polish is Leverage**:
   - Clean hairline borders, subtle active states, high-contrast typography, and snappy feedback elevate a product from an amateur MVP into an institutional workstation.

---

## 2. The Animation Decision Framework

Before writing ANY animation or transition, answer these 4 questions in order:

### A. Should this animate at all? (Frequency Check)
| Interaction Frequency | Animation Rule |
| :--- | :--- |
| **High (100+ times/day)** (Hotkey navigation, lot input, order execution, command palette, tabs) | **NO animation (0ms / instant)**. Animation slows down high-frequency power users. |
| **Medium (Tens of times/day)** (Dropdowns, selects, table row hovers, filters) | **Micro-duration (<150ms)** or subtle instant state change. |
| **Occasional** (Modals, confirm drawers, toast alerts, settings dialogs) | **Standard animation (180ms – 250ms)** with custom easing. |
| **Rare** (Sync completion, milestone banners, onboarding) | Standard animation with subtle delight (e.g. checkmark bounce, gold glow). |

### B. What is the Purpose?
Every animation must have a purpose:
- **Feedback**: A button scales to `0.97` on press to confirm the system registered the click.
- **Spatial Continuity**: Toasts slide in from the top/right and dismiss in the same direction.
- **Prevent Jarring Changes**: An overlay fades in smoothly instead of flashing harshly.
- *If the only justification is "it looks cool", DO NOT animate.*

### C. Which Easing Curve to Use?
**NEVER use `ease-in` for UI animations**—it starts slowly and makes the UI feel sluggish.
**NEVER rely on browser-default weak `ease`**. Always use our custom tokens:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);       /* Standard for entrances, modals, feedback */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* For continuous on-screen movement/morphs */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* For bottom sheets & drawer slides */
```

### D. What Duration?
| UI Element | Target Duration | Easing |
| :--- | :--- | :--- |
| Button active press feedback | 100ms – 140ms | `var(--ease-out)` |
| Tooltip / Popover entrance | 120ms – 180ms | `var(--ease-out)` |
| Select / Dropdown open | 150ms – 220ms | `var(--ease-out)` |
| Modal Dialog entrance | 200ms – 260ms | `var(--ease-out)` |
| Toast notification slide | 180ms – 240ms | `var(--ease-out)` |
| Spinner rotation | 750ms linear | `linear infinite` |

*Golden Rule: UI animations should NEVER exceed 300ms.*

---

## 3. Strict Prohibitions & Anti-Patterns

1. **NEVER use `transition: all`**:
   - `transition: all` triggers browser layout reflow on unintended properties (width, height, margin, padding).
   - Always declare explicit properties:
     `transition: background-color var(--transition-fast), border-color var(--transition-fast), transform 120ms var(--ease-out);`
2. **NEVER animate from `scale(0)`**:
   - Nothing in reality appears from nothingness. Animating from `scale(0)` looks cheap.
   - Always enter from `scale(0.95)` to `scale(0.97)` paired with `opacity: 0`.
3. **NEVER leave buttons without an `:active` state**:
   - All clickable buttons and interactive chips must have:
     `:active:not(:disabled) { transform: scale(0.97); }`
4. **Popovers must be origin-aware**:
   - Do not use `transform-origin: center` for dropdowns or popovers. Scale from trigger location (`transform-origin: top` or `var(--transform-origin)`).

---

## 4. Mobile & Touch Polish

1. **Remove Tap Delay**:
   - Add `touch-action: manipulation;` on interactive elements to eliminate the 300ms mobile tap delay.
2. **Remove Webkit Tap Flash**:
   - Set `-webkit-tap-highlight-color: transparent;` globally.
3. **Prevent Accidental Text Selection**:
   - Add `user-select: none;` on buttons and tab chips so rapid tapping does not highlight text.

---

## 5. Review Format

When critiquing or refactoring UI motion/interactions, always summarize changes using a structured markdown table:

| Before | After | Why (Emil Kowalski Principle) |
| :--- | :--- | :--- |
| `transition: all 300ms` | `transition: transform 120ms var(--ease-out)` | Specific properties avoid layout recalculation |
| `transform: scale(0)` | `transform: scale(0.96); opacity: 0` | Objects don't appear from 0 in physical world |
| No `:active` on button | `:active { transform: scale(0.97); }` | Tactile confirmation that the click registered |
