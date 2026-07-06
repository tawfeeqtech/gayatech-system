# Gayatech Design System Proposal

## 1. Design Principles

1. **Clarity over decoration** — every element should help the user understand financial data faster.
2. **Calm density** — generous whitespace, breathable cards, and thoughtful grouping reduce cognitive load.
3. **Consistent hierarchy** — type, color, spacing, and elevation work together across all modules.
4. **RTL-first** — the system is Arabic; all components must feel native in right-to-left layouts.
5. **Accessibility** — WCAG 2.1 AA targets for contrast, focus, and keyboard navigation.

## 2. Color Palette

### Brand / Primary

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary-50` | `#eff6ff` | Subtle backgrounds, hover rows |
| `--color-primary-100` | `#dbeafe` | Active nav item background |
| `--color-primary-500` | `#3b82f6` | Links, icon accents |
| `--color-primary-600` | `#2563eb` | Primary buttons, active indicators |
| `--color-primary-700` | `#1d4ed8` | Hover primary buttons |
| `--color-primary-900` | `#1e3a8a` | Headline accents |

> The existing blue palette is kept so the product remains recognizable, but it is applied more consistently.

### Neutral / Surfaces

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#f8fafc` | App background |
| `--color-surface` | `#ffffff` | Cards, topbar, sidebar surface |
| `--color-border` | `#e2e8f0` | Dividers, card borders, input borders |
| `--color-border-subtle` | `#f1f5f9` | Table row separators |
| `--color-text-primary` | `#0f172a` | Headings, primary text |
| `--color-text-secondary` | `#64748b` | Captions, meta text |
| `--color-text-muted` | `#94a3b8` | Placeholders, disabled text |

### Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#10b981` | Income, paid, active |
| `--color-success-bg` | `#ecfdf5` | Success soft badge bg |
| `--color-danger` | `#ef4444` | Expense, overdue, delete |
| `--color-danger-bg` | `#fef2f2` | Danger soft badge bg |
| `--color-warning` | `#f59e0b` | Partial, pending, warning |
| `--color-warning-bg` | `#fffbeb` | Warning soft badge bg |
| `--color-info` | `#3b82f6` | Transfer, info |
| `--color-info-bg` | `#eff6ff` | Info soft badge bg |

### Sidebar (new light theme)

| Token | Hex | Usage |
|-------|-----|-------|
| `--sidebar-bg` | `#ffffff` | Sidebar background |
| `--sidebar-border` | `#e2e8f0` | Right separator in RTL |
| `--sidebar-group` | `#94a3b8` | Section labels |
| `--sidebar-item` | `#475569` | Nav item text |
| `--sidebar-item-hover` | `#f1f5f9` | Hover background |
| `--sidebar-item-active` | `#eff6ff` | Active item background |
| `--sidebar-active-indicator` | `#2563eb` | 3px rounded accent bar |

## 3. Typography

- **Font family**: `Cairo, "Noto Kufi Arabic", system-ui, sans-serif` — inherited globally; no per-element font-family overrides.
- **Type scale**:

| Name | Size | Weight | Letter spacing | Usage |
|------|------|--------|----------------|-------|
| Page Title | 24px (1.5rem) | 700 | -0.01em | Top of every page |
| Section Title | 16px (1rem) | 600 | 0 | Card titles, section headers |
| Card Title | 15px (0.9375rem) | 600 | 0 | Card headers |
| Body | 14px (0.875rem) | 400 | 0 | Tables, forms, body copy |
| Caption | 12px (0.75rem) | 500 | 0.02em | Badges, meta, table headers |
| Stat Value | 28px (1.75rem) | 700 | -0.02em | KPI numbers |
| Stat Label | 13px (0.8125rem) | 500 | 0 | KPI labels |

## 4. Spacing System

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Icon gaps |
| `--space-2` | 8px | Inline spacing, badge padding |
| `--space-3` | 12px | Button padding-y, compact table rows |
| `--space-4` | 16px | Card padding internal, form row gutters |
| `--space-5` | 20px | Filter bar gaps |
| `--space-6` | 24px | Card gutters, section gaps |
| `--space-8` | 32px | Page outer padding |
| `--space-10` | 40px | Large section breaks |

## 5. Elevation / Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(15, 23, 42, 0.04)` | Buttons, inputs resting |
| `--shadow-md` | `0 4px 12px rgba(15, 23, 42, 0.05)` | Cards, dropdowns |
| `--shadow-lg` | `0 12px 24px rgba(15, 23, 42, 0.08)` | Modals, drawers |

## 6. Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | 6px |
| `--radius-md` | 10px |
| `--radius-lg` | 14px |
| `--radius-xl` | 18px |
| `--radius-full` | 9999px |

## 7. Component Specifications

### 7.1 Layout Shell

- **Sidebar**
  - Width: `260px` fixed.
  - Surface: white with right border in RTL.
  - Logo area: 64px height, brand name in `font-weight: 700`.
  - Groups: uppercase 11px label, `color: #94a3b8`, `margin: 16px 0 8px`.
  - Items: 14px, `padding: 10px 16px`, hover `bg-slate-100`.
  - Active item: `bg-blue-50`, right blue indicator bar (4px radius), bold text.
  - Icons: 18px, `color` matches text.

- **Topbar**
  - Height: 64px, white, bottom border.
  - Left side (in RTL): breadcrumbs + page title.
  - Right side: global search (decorative/stub), notifications bell, user dropdown.
  - Sticky top, z-index below sidebar.

- **Page container**
  - `padding: 32px` on desktop, `24px` on tablet, `16px` on mobile.
  - Background: `--color-bg`.
  - Max content width is fluid; reports pages may optionally cap at `1440px`.

### 7.2 Page Header

Reusable `PageHeader` component:

- Optional back button.
- Title (page title) + optional subtitle.
- Right-side action slot.
- Breadcrumb text in `caption` style.
- Margin bottom: 24px.

### 7.3 Cards

- **SectionCard**: white background, `shadow-md`, `radius-lg`, `padding: 24px`.
- **StatCard**: horizontal layout, soft icon container (40px rounded), label above value, optional trend chip.
- **Inner tables** inside cards have no card border around them.

### 7.4 Tables

- Header cell: 12px uppercase, `color: #64748b`, font-weight 600, background `#f8fafc`.
- Row height: 56px.
- Hover row: `bg-slate-50`.
- Empty state uses the shared `EmptyState` component.
- Pagination bar floats right in RTL.
- Action column uses ghost icon buttons (`type="text"`) with 32px touch target.

### 7.5 Badges / Status

Replace `Tag` usage with a pill component:

- Height: 24px.
- Border radius: full.
- Dot + label.
- Soft background matching semantic color.
- Variants: `success`, `danger`, `warning`, `info`, `default`.

### 7.6 Buttons

| Variant | Style |
|---------|-------|
| Primary | `bg-primary-600`, white text, hover `bg-primary-700`, radius-md |
| Secondary | White, border `--color-border`, hover `bg-slate-50` |
| Ghost | Transparent, hover `bg-slate-100` |
| Danger | `bg-danger`, white text |
| Icon button | 32px square, ghost |

### 7.7 Forms

- Labels: 13px, `font-weight: 600`, `color: --color-text-primary`.
- Inputs: height 40px, radius-md, border `--color-border`, focus ring `primary-500`.
- Sections: use `SectionCard` with a title; group related fields inside a `Row`.
- Helper text: 12px `--color-text-secondary`.
- Validation: standard Ant Design red; keep but ensure messages are clear.

### 7.8 Modals / Confirmations

- ConfirmDialog uses Ant Design `Modal` footer buttons (`okButtonProps`, `cancelButtonProps`) instead of native buttons.
- Width: 400px.
- Icon ring background matching type.

### 7.9 Empty State

- Illustration icon (SVG) instead of emoji.
- Title 16px semibold.
- Description 14px muted.
- Optional primary action button.

## 8. Token Delivery

All tokens are delivered through:

1. `client/src/design-tokens.js` — object exported for `ConfigProvider` and runtime usage.
2. `client/src/index.css` — CSS custom properties (variables) and global overrides.
3. `client/tailwind.config.js` — extended colors reference existing Tailwind palette (slate, blue, emerald, rose, amber).

No CSS-in-JS is introduced; the existing Tailwind + Ant Design pattern is preserved.

## 9. Migration Rules

- Do not rename or delete route files.
- Inline `style={{ fontFamily: 'Cairo, sans-serif' }}` is removed; font is inherited.
- Hard-coded hex colors are replaced by design-token references.
- Existing `DataTable` props remain backward-compatible.
- New primitives are additive; old pages continue to render until updated.
