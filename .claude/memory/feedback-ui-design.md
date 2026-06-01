---
name: UI Design Preferences — Glassmorphism, Font & Organic Elegance
description: User wants professional, tech-forward UI with glassmorphism, pill shapes, bento grid, custom dropdowns, skeletons, and "Organic Elegance" design system (MonFinTrack). Full spec at docs/design-system-rules.md with 4 themes.
type: feedback
---

User strongly prefers a modern, professional, tech-forward UI aesthetic. Specific requirements:

- **Typography & Font Standardization (2026-06-01)**: The system typography is fully unified and standardized to use the ultra-modern geometric font **Outfit** (imported via Google Fonts in `index.html` with weights from 300 to 900). Both `sans` and `serif` families are mapped to `'Outfit'` in `tailwind.config.js`. This creates a clean, cohesive, tech-forward aesthetic throughout the entire system and prevents typographical inconsistency.
- **Page Headers Standardization (2026-06-01)**: Page headers on all core views (Dashboard, Jobs List, Applications, Companies, Profile, Settings) are strictly standardized to use a unified scale, rhythm, and animated entry:
  `class="text-3xl md:text-4xl font-serif font-bold text-white mb-6 md:mb-8 animate-fade-in-up"`
  (The margin `mb-6 md:mb-8` respects the 8-point grid rhythm, and `font-serif` maps directly to Outfit for modern weight).
- **Glassmorphism / Deep Transparency & Frosted Dropdowns (2026-06-01)**: To make the glassmorphism effect exceptionally prominent and premium, the glass variables `--glass-bg` (reduced to `0.45` opacity in all themes), `--sidebar-bg` (`0.55` in Light/Capycro, `0.65` in Dark) and `--topbar-bg` (`0.5` in Light/Capycro, `0.55` in Dark) have been made highly translucent. Deep desaturating blurs of **`blur(32px) saturate(2.1)`** (and **`blur(36px) saturate(2.1)`** on `.glass-strong`) are applied across layout structures (sidebar, topbar, bottom nav). The disabling of glass effects (`backdrop-filter: none !important` and flat solid backgrounds) is strictly isolated to the `.high-contrast` WCAG AAA theme.
  - **Dropdown Frosted Glass Density:** To prevent overlapping texts and background bleed-through in dropdowns (making options unreadable), custom dropdowns use a denser frosted glass style: `background: color-mix(in srgb, var(--bg-surface) 90%, transparent)` with `blur(20px) saturate(1.4)`. This creates a beautiful frosted look while blocking all background text and visual clutter.
- **Contrast & Readability on Light/Capycro Themes (2026-06-01)**: Tailwind classes using opacities for white text (such as `text-white/80`, `text-white/70`, `text-white/90`) are globally remapped in `styles.css` under the `:is(.light, .capycro, .high-contrast)` selector to use `var(--text-primary)` (or `--text-muted` for `text-white/60`), ensuring optimal contrast and readability for job descriptions and candidate notes. Similarly, light-colored semantic text and background tags (like `text-green-400`, `text-red-400`, `bg-green-500/10`, `border-red-500/20`) are remapped to use `var(--success-color)` or `var(--error-color)` dynamically.
- **Rounded pill shapes**: border-radius 20-28px on sidebar and topbar, 14-16px on cards and dropdowns
- **Retractable sidebar**: collapsed by default showing only icons, expands on hover with tooltips, detached from edges (positioned with margin/spacing)
- **Bento grid**: Profile and Settings pages use grid layouts (2-3 columns) with separate cards for different sections
- **Custom dropdowns & Theme-aware Selects (2026-06-01)**: Custom `SelectComponent` (`app-select`) has been fully redesigned with glassmorphic dropdowns (`background: color-mix(in srgb, var(--bg-surface) 90%, transparent)`, `border: var(--glass-border)`, `backdrop-filter: blur(20px)` and `box-shadow: var(--glass-shadow)`). Selection indicators and trigger borders are completely dynamic, utilizing `rgba(var(--primary-color-rgb), 0.1)` and `var(--primary-color)` instead of hardcoded blue. On native `<select>` elements, `select.input-field option` is globally styled in `styles.css` to inherit `var(--bg-surface)` and `var(--text-primary)` to prevent browser-native dark elements from rendering on light/Capycro pages.
- **Skeleton loading**: Must be present on ALL screens — dashboard, jobs, applications, companies, profile, settings
- **Error states**: Every component must have: error message, retry button, toast notification
- **Toast notifications**: Slide-in from right, 4 types (success/error/warning/info), glassmorphism style
- **Button style (2026-06-01)**: Banned any gradients on buttons to avoid visual noise. Main button `.btn-primary` is a solid background using the theme's active primary color (`var(--primary-color)`), pill-shaped (`9999px` rounded) for elegance, with shadows and hover scale/translateY physical shift (`translateY(-2px) scale(1.02)`) using elastic spring transition physics (`var(--transition-spring)`), brightened up by a brightness filter.
- **Theme Selection Cards dynamic outlines (2026-06-01)**: Theme selection cards in the Appearance bento use dynamic borders and shadows based on their *own* specific theme's colors (`[style.--theme-primary]="getThemeSwatch(theme.id)[2]"`) instead of the globally active theme's primary color, enhancing the "Organic Elegance" SaaS aesthetic. Styled globally in `styles.css` using native CSS variables and modern `color-mix` functions.
- **Suggested Tags Pills (2026-06-01)**: To improve usability and prevent spelling mistakes (which disrupt the literal substring keyword matcher), the profile screen renders lightweight clickable pills/badges below keywords, target roles, and preferred locations to instantly append popular industry-standard tags.
- **Badges, Status Chips (StatusChipComponent) and Score Badges (ScoreBadgeComponent) (2026-06-01)**: Blocky solid backgrounds with hardcoded `text-white` are completely forbidden (as they are illegible on light/capycro themes and Coleção hovers). Instead, ALL badges (including job statuses like "Nova", "Visualizada" and "Candidatou", and percentage scores like "80%") must use a premium, semi-translucent "outline-filled" style: subtle background with low opacity (e.g., `bg-primary/15`, `bg-accent/15`, `bg-success/15`, and `.bg-primary/20` which is also dynamically mapped), matching thin colored border (`border-primary/20`, `border-success/20`), and dynamic semantic text color (`text-primary`, `text-accent`, `text-success`, etc.). This guarantees 100% visibility, optimal WCAG readability, and a beautiful hover blend in all 4 themes.
- **Logo text and Absolute White (2026-06-01)**: The sidebar logo container uses `.logo-gradient` (solid primary background) and `.logo-shadow`. Inside, absolutely-positioned icons that need to stay white on dark background in all themes (like the plug icon) use `.text-white-absolute` (to prevent being remapped to dark primary text in light/capycro themes). The typography next to it ("JobHunter") uses standard `text-white` so it adapts to dark/light/capycro context dynamically.
- **Tables**: hover rows with subtle background change, rounded containers
- **CSS**: Custom scrollbar (thin, semi-transparent), selection color (blue)
- **Animated icons**: Prefers pure Angular SVG + CSS transitions over React-based icon libraries (shadcn, Framer Motion). Custom animated icon components with hover effects using `:host:hover` CSS transforms.
- **No React dependencies**: When adapting designs from React sources (e.g., itshover.com), always rewrite as native Angular components — never import React/Framer Motion.

**Why:** User wants the app to look like a premium SaaS product, not a generic Bootstrap app. They explicitly said "redesign the UI professionally and elegantly, technologically." For icons, they rejected both shadcn (React-only) and Lucide (external lib) in favor of zero-dependency Angular puro.

**How to apply:** When creating or updating UI components, always use glassmorphism styling, rounded shapes, and the theme tokens from tailwind.config.js (#0a0f1e bg, #2563eb primary, #38bdf8 accent). Never use flat/dated UI patterns.

**Modals and overlays (2026-06-01):**
- ALWAYS use theme-aware CSS classes for modal backgrounds: `bg-dark-surface` for the modal card, `bg-dark-bg` for inputs/selects, `border-dark-border` for borders
- NEVER use `glass-v2` on modals — it renders as gray/inverted on light/Capycro themes
- Use `bg-black/60 backdrop-blur-md` for the overlay backdrop (not `bg-black/50`)
- Add `shadow-2xl` on the modal card for depth
- Inputs/selects inside modals must use `bg-dark-bg` (not `bg-dark-surface`) with `focus:border-primary focus:outline-none`
- Buttons: `hover:bg-white/5` for cancel, `bg-red-500/20 border border-red-500/20` for destructive actions
- **Why:** User caught that the reject modal was rendering with a light gray background on the light theme because it used `glass-v2` which inverts on light themes. The fix was switching to `bg-dark-surface`/`bg-dark-bg` which are theme-overridden.
- **How to apply:** Every new modal/dialog should follow this pattern. Check existing modals if they use `glass-v2` and fix them.

**Delete/batch selection UX (2026-06-01):**
- Selected cards need strong visual indicators: colored border, subtle colored background, shadow
- Batch action bar should have a tinted background matching the action color (red for delete)
- Smart filters (score threshold, age, non-favorites) REPLACE the selection — if you select non-favorites then select by score, the score filter clears the non-favorites selection
- "Excluir" badge on selected cards provides instant visual feedback
- **Why:** User wanted clear visual feedback that a job is selected for deletion, and wanted convenient batch selection beyond just "select all"

**4-theme system status (2026-06-01):**
- Design system spec defines 4 themes: Blue Fintech (light), Dark (tech), Capycro (organic), High Contrast (WCAG AAA)
- **All themes are fully implemented** in ThemeService (string enum) with local storage persistence and dynamic styles overrides.
- Overrides globais no `styles.css` foram convertidos para `:is(.light, .capycro, .high-contrast)` utilizando variáveis de CSS nativas e `color-mix`, resolvendo o suporte simultâneo a todos os 4 temas cromáticos.
- Barra de navegação móvel inferior (`mobile-bottom-nav.component.ts`) convertida de cores hardcoded para usar as CSS variables `var(--primary-color)` e `var(--primary-color-rgb)` de forma 100% dinâmica.
- Logotipo no sidebar e sua respectiva sombra feitos totalmente dinâmicos e responsivos a todos os 4 temas (usando as novas classes globais `.logo-gradient` e `.logo-shadow`).
- Efeito de Glassmorphism (desfoque e transparência) mantido impecável nos temas Light e Capycro, sendo desativado apenas no Alto Contraste por razões de acessibilidade WCAG AAA.

**Additional layout preferences (2026-06-01):**
- **Detail pages should use full width** — remove `max-w-*` constraints. User explicitly said "pode deixar ele ocupar toda a pagina, as margens estão muito grandes"
- **List views should offer grid toggle** — user wants list/grid view switcher on collection pages (e.g., jobs list). Grid cards should be compact with score accent bar on top, badges at bottom.
- **Accent bar per score** — on job cards, a 4px left bar colored by score (green >=80, yellow >=60, orange >=40, red <40) gives instant visual hierarchy
- **Bento grid for detail pages** — 2-column layout: left = structured info (score, status, platform, salary as label-value rows), right = free-text description. Responsive: stacks on mobile.
- **Persist UI preferences** — View mode toggles (list/grid), filter states, and similar UI preferences must persist in localStorage so they survive navigation and page reloads. User explicitly asked "quero q a opção de lista/grid fique salvo".

**Light mode design (2026-06-01):**
- **No pure white** — user explicitly said "quero evitar branco puro, vamos usar outras cores, algo q tbm de contrastes e boa visibilidade"
- **Palette base: Tailwind slate scale** — slate-50 (#f8fafc) for bg-main, slate-100 (#f1f5f9) for bg-surface-alt, white (#ffffff) only for cards with slate-200 (#e2e8f0) borders
- **CSS variables system** — All colors defined as CSS custom properties (--bg-main, --bg-surface, --bg-border, --text-primary, --text-secondary, --text-muted, --glass-bg, --glass-border, --card-bg, --card-border, etc.) toggled via `.dark` / `.light` / `.capycro` / `.high-contrast` classes on `<html>`
- **Glassmorphism utility classes** — `.glass` (translucent, blur), `.glass-strong` (opaque, blur), `.glass-card` (solid bg + border) — replace inline `style="background: rgba(17,24,39,...)"`  with theme-aware classes
- **Component overrides in styles.css** — `.light .bg-dark-surface`, `.light .text-white`, `.light .border-dark-border`, `.light .input-field` etc. override hardcoded dark-theme classes across all components
- **Goal**: contrast and good visibility without harsh white — soft, professional look
- **Why:** User tested light mode and saw components stuck in dark mode (cards, sidebar, topbar, inputs all had hardcoded dark colors). The CSS variable + override approach was chosen because it's the most maintainable — one file controls the entire theme without touching individual components.
- **Inline styles are the enemy** — `style="background: rgba(17,24,39,0.6)"` cannot be overridden by CSS class selectors. The fix is replacing these with CSS classes (`.glass`, `.glass-strong`) that use `var()` references. Components that had this: topbar, sidebar, bottom nav, notification center, select dropdown, sidebar tooltip.
- **SelectComponent rewritten** — Changed from hardcoded dark inline styles to CSS-variable-based styling with `styles: [...]` block using `var(--input-bg)`, `var(--text-primary)`, etc.
- **Design system compliance gaps identified (2026-06-01)**:
  - [RESOLVIDO] **Páginas de Candidaturas (`applications.component.ts`) e Empresas Fixas (`companies.component.ts`)** atualizadas com total suporte ao design system:
    - Ambient Blobs decorativos e fluidos incorporados ao fundo de cada página.
    - Títulos estilizados em Playfair Display (`font-serif`, remapeado para Outfit) com animação de subida suave (`animate-fade-in-up`).
    - Uso extensivo da classe `.organic-card` (24px de radius + transições físicas elásticas + elevação de hover) para formulários, cartões móveis e loading skeletons.
    - Tabelas de alta densidade no desktop configuradas de forma limpa e geométrica com cantos retos de 2px (`rounded-sm`).
    - Carregamento orquestrado/sequencial (*staggering* de `stagger-1` até `stagger-6`) integrado de forma dinâmica nos loops de dados e skeletons.
  - [RESOLVIDO] **Fontes e Padronização Tipográfica**: Importamos o Google Fonts **Outfit** (pesos 300 a 900) no `index.html` e unificamos a tipografia do sistema no `tailwind.config.js` mapeando ambas as famílias `sans` e `serif` para 'Outfit'. Isso garante um visual uniforme, ultra-moderno e elegante em todo o JobHunter sem misturas tipográficas incoerentes.
  - **No grain/noise texture**: Doc requires noise overlay at 1% opacity on background — not implemented
  - [RESOLVIDO] **No transition CSS vars**: `--transition-smooth` e `--transition-spring` definidos no `:root` do styles.css e integrados em todos os botões e cartões para movimentos elásticos com mola físicos.
  - [RESOLVIDO] **Many hardcoded inline styles**: Substituídos por classes do Tailwind dinâmicas de tema e classes globais de cores no styles.css (incluindo topbar, sidebar, bottom nav, robô status e botões de cabeçalho).
  - [RESOLVIDO] **Aparência dos Dropdowns**: Customizamos os dropdowns do `SelectComponent` com desfoque de 16px e transparência de vidro (`var(--glass-bg)`), tornando-os dinâmicos nos 4 temas (incluindo o Capycro).
  - [RESOLVIDO] **Dropdown de Status nas Candidaturas (2026-06-01)**: Substituímos o `<select>` nativo na listagem de candidaturas pelo componente customizado `SelectComponent` (`app-select`), utilizando opções ricas com ícones visuais (`SelectOption[]`) e mantendo coerência visual de vidrificação em todos os temas.
  - [RESOLVIDO] **Prevenção de Race Conditions e Vazamento de Memória (2026-06-01)**: Implementamos o controle de `Subscription` ativo (`private activeSub?: Subscription`) no carregamento das candidaturas com desinscrição automática (`.unsubscribe()`) e ciclo `OnDestroy`, prevenindo corridas assíncronas de requisições de rede. Movemos a execução de efeitos reativos síncronos (como a gravação do `viewMode` no `localStorage`) diretamente para o `constructor` para evitar avisos de propriedades não lidas no TS.
  - [RESOLVIDO] **Sanitização Segura de Screenshots (2026-06-01)**: Banimos o uso direto e inseguro de `bypassSecurityTrustResourceUrl` no processamento do `screenshotPath`. Implementamos validação estrita com regex de protocolo seguro (`/^(https?:\/\/|\/|assets\/)/i`) aliada à sanitização nativa do Angular `DomSanitizer.sanitize(SecurityContext.URL, path)` para neutralizar ataques XSS.

