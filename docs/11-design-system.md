# 11 — UI/UX Design System

Implemented in `apps/web/src/index.css` (Tailwind v4 `@theme`) and `apps/web/src/components/ui.tsx`.

## 1. Palette (spec §142)

| Token | Value | Use |
|---|---|---|
| `g-red` | `#ce1126` | primary actions, alerts, brand (Ghana red) |
| `g-gold` | `#fcd116` | highlights, status accents |
| `g-green` | `#006b3f` | success, public-health CTA |
| `g-navy` | `#12203a` | sidebar, headers, dark surfaces |
| white / `g-paper` | — | backgrounds, cards |

Ghanaian identity is used **subtly** — a thin flag stripe on the portal and restrained accent colors, never a decorative overload.

## 2. Typography & rhythm

System font stack; strong type hierarchy (page titles 2xl/3xl, card titles sm, labels xs uppercase where appropriate). Tabular numerals for clinical values.

## 3. Components

`Button` (primary/navy/green/outline/ghost/danger) · `Card` · `Badge` (6 tones) · `StatCard` · `Field/Input/Select/Textarea` · `Segmented` tabs · `Spinner` · `EmptyState` · `PageHeader` · `FlagStripe` · `DemoBanner` · `Toaster` · `SyncBadge`.

## 4. Principles (spec §141–142)

- **Clinical safety first** — never sacrifice safety for speed; 1–3 clicks to common actions.
- **Accessibility** — keyboard-navigable controls, focus rings, labels on every field, contrast-aware tones, error states never rely on colour alone (WCAG-oriented).
- **Low-bandwidth friendly** — no heavy assets; offline-first UI shows truthful sync state (§135).
- **Responsive** — portal + admin adapt desktop/tablet/mobile.
