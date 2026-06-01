---
name: UI Design Preferences — Glassmorphism & Professional
description: User wants professional, tech-forward UI with glassmorphism, pill shapes, retractable sidebar, bento grid, custom dropdowns, skeletons, and detailed error handling.
type: feedback
---

User strongly prefers a modern, professional, tech-forward UI aesthetic. Specific requirements:

- **Glassmorphism**: backdrop-blur + translucent backgrounds (rgba(17,24,39,0.65) with blur(20-24px))
- **Rounded pill shapes**: border-radius 20-28px on sidebar and topbar, 14-16px on cards and dropdowns
- **Retractable sidebar**: collapsed by default showing only icons, expands on hover with tooltips, detached from edges (positioned with margin/spacing)
- **Bento grid**: Profile and Settings pages use grid layouts (2-3 columns) with separate cards for different sections
- **Custom dropdowns**: NOT native `<select>` — custom SelectComponent with glassmorphism dropdown, animated arrow, checkmark for selected option
- **Skeleton loading**: Must be present on ALL screens — dashboard, jobs, applications, companies, profile, settings
- **Error states**: Every component must have: error message, retry button, toast notification
- **Toast notifications**: Slide-in from right, 4 types (success/error/warning/info), glassmorphism style
- **Button style**: Gradient background (blue to cyan), shadow, hover scale effect
- **Tables**: hover rows with subtle background change, rounded containers
- **CSS**: Custom scrollbar (thin, semi-transparent), selection color (blue)
- **Animated icons**: Prefers pure Angular SVG + CSS transitions over React-based icon libraries (shadcn, Framer Motion). Custom animated icon components with hover effects using `:host:hover` CSS transforms.
- **No React dependencies**: When adapting designs from React sources (e.g., shadcn registry, itshover.com), always rewrite as native Angular components — never import React/Framer Motion.

**Why:** User wants the app to look like a premium SaaS product, not a generic Bootstrap app. They explicitly said "redesign the UI professionally and elegantly, technologically." For icons, they rejected both shadcn (React-only) and Lucide (external lib) in favor of zero-dependency Angular puro.

**How to apply:** When creating or updating UI components, always use glassmorphism styling, rounded shapes, and the dark theme tokens from tailwind.config.js (#0a0f1e bg, #2563eb primary, #38bdf8 accent). Never use flat/dated UI patterns.

**Additional layout preferences (2026-06-01):**
- **Detail pages should use full width** — remove `max-w-*` constraints. User explicitly said "pode deixar ele ocupar toda a pagina, as margens estão muito grandes"
- **List views should offer grid toggle** — user wants list/grid view switcher on collection pages (e.g., jobs list). Grid cards should be compact with score accent bar on top, badges at bottom.
- **Accent bar per score** — on job cards, a 4px left bar colored by score (green >=80, yellow >=60, orange >=40, red <40) gives instant visual hierarchy
- **Bento grid for detail pages** — 2-column layout: left = structured info (score, status, platform, salary as label-value rows), right = free-text description. Responsive: stacks on mobile.
- **Persist UI preferences** — View mode toggles (list/grid), filter states, and similar UI preferences must persist in localStorage so they survive navigation and page reloads. User explicitly asked "quero q a opção de lista/grid fique salvo".

**Light mode design (2026-06-01):**
- **No pure white** — user explicitly said "quero evitar branco puro, vamos usar outras cores, algo q tbm de contrastes e boa visibilidade"
- **Palette base: Tailwind slate scale** — slate-50 (#f8fafc) for bg-main, slate-100 (#f1f5f9) for bg-surface-alt, white (#ffffff) only for cards with slate-200 (#e2e8f0) borders
- **CSS variables system** — All colors defined as CSS custom properties (--bg-main, --bg-surface, --bg-border, --text-primary, --text-secondary, --text-muted, --glass-bg, --glass-border, --card-bg, --card-border, etc.) toggled via `.dark` / `.light` classes on `<html>`
- **Glassmorphism utility classes** — `.glass` (translucent, blur), `.glass-strong` (opaque, blur), `.glass-card` (solid bg + border) — replace inline `style="background: rgba(17,24,39,...)"`  with theme-aware classes
- **Component overrides in styles.css** — `.light .bg-dark-surface`, `.light .text-white`, `.light .border-dark-border`, `.light .input-field` etc. override hardcoded dark-theme classes across all components
- **Goal**: contrast and good visibility without harsh white — soft, professional look
- **Why:** User tested light mode and saw components stuck in dark mode (cards, sidebar, topbar, inputs all had hardcoded dark colors). The CSS variable + override approach was chosen because it's the most maintainable — one file controls the entire theme without touching individual components.
- **Inline styles are the enemy** — `style="background: rgba(17,24,39,0.6)"` cannot be overridden by CSS class selectors. The fix is replacing these with CSS classes (`.glass`, `.glass-strong`) that use `var()` references. Components that had this: topbar, sidebar, bottom nav, notification center, select dropdown, sidebar tooltip.
- **SelectComponent rewritten** — Changed from hardcoded dark inline styles to CSS-variable-based styling with `styles: [...]` block using `var(--input-bg)`, `var(--text-primary)`, etc.
- **Still needs work**: Chart.js colors hardcoded (tooltip, grid, ticks), `border-white/5` in ~20 places, `bg-white/[0.03]` static backgrounds

**Component standardization (2026-06-01):**
- User requested componentizing inputs and buttons for consistency: "vamos componentizar os inputs e os botões"
- `InputComponent` created at `shared/components/input/input.component.ts` — standalone, ControlValueAccessor, uses CSS variables, supports icon/suffix, proper focus/disabled states
- `ButtonComponent` created at `shared/components/button/button.component.ts` — supports variants (primary, secondary, ghost), sizes, loading state, icon slot
- **CSS base classes in styles.css** — `.btn-primary` (gradient, shadow, hover), `.btn-secondary` (theme-aware vars), `.input-field` — defined globally so any component can use them without importing ButtonComponent/InputComponent
- **Critical pattern**: Components that use `class="btn-primary"` WITHOUT importing `ButtonComponent` rely on the global CSS definitions in styles.css. If you add a new button class, define it BOTH in the component AND in styles.css globally.

**Angular icon component host style workaround (2026-06-01):**
- Angular icon components (e.g., SearchIconComponent) often use `host: { style: 'display: inline-flex; ...' }` which generates inline styles
- Inline styles have CSS specificity 1000, beating any Tailwind class (`absolute`, `left-3`, etc.)
- **Wrapper div did NOT work** — tried `<div class="absolute left-3 ..."><app-search-icon /></div>` but the icon's host inline style still broke layout
- **Solution: use inline SVG directly in template** — replace `<app-search-icon>` with raw `<svg>` element that carries the positioning classes. No Angular component wrapper needed.
- This pattern applies to ALL icon components used inside absolutely-positioned containers (inputs, buttons, modals)
- Example: `<svg class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" ...>...</svg>`

**Mobile navigation (2026-06-01):**
- **Bottom nav is primary on mobile** — 5 items: Dashboard, Candidaturas, Empresas, **Vagas (index 3)**, Perfil
- **Vagas is the highlighted center item** — larger icon (24px vs 22px), elevated with `translateY(-4px)`, glow shadow when active
- **Sidebar is desktop-only** — hidden on mobile via `hidden md:block`
- **No hamburger menu needed** — bottom nav covers all navigation
- **Bottom nav styling**: `border-radius: 24px`, `margin: 12px`, floating glassmorphism, safe-area padding
- **Settings merged into Profile** — no separate /settings route, all config lives in profile page

**PrimeNG components (2026-06-01):**
- Use `FileUploadModule` from `primeng/fileupload` for uploads. Template tag: `<p-fileupload>`. NOT `<p-upload>` or `<p-uploadfile>`.
- For custom upload logic: `[customUpload]="true"` + `(uploadHandler)="onUpload($event)"`. Event gives `{ files: File[] }`.
- For basic mode (no drag-drop): `mode="basic"`, `chooseLabel`, `chooseIcon`. Style with `styleClass="p-button-outlined"` or `"p-button-secondary"`.
- Always include `name="prop"` (required by PrimeNG API) and `accept=".pdf"` for type restriction.
- `providePrimeNG()` should be in app.config.ts providers for full PrimeNG theming.

**`.card` class (2026-06-01):**
- Must be defined in global `styles.css` — the companies page had empty invisible cards because `.card` had no CSS definition.
- Pattern: `background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 1rem; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);`

**Glass utility classes (2026-06-01):**
- `.glass` — translucent with blur (topbar, filters)
- `.glass-strong` — opaque with blur (sidebar, bottom nav, dropdowns)
- `.glass-card` — solid bg + border
- These replace ALL inline `style="background: rgba(17,24,39,...)"` — inline styles cannot be overridden by CSS class selectors in light mode.
