---
name: CSS specificity pitfalls with Tailwind + Angular
description: CSS shorthand properties override Tailwind utilities. ViewEncapsulation prevents component styles from leaking. Use global CSS for shared utility classes. Icon components with host styles break absolute positioning.
type: feedback
---

CSS shorthand properties (e.g., `padding: 0.625rem 0.875rem`) override Tailwind utility classes (`pl-12`, `pr-10`) because shorthand is more specific in the cascade. Individual properties (`padding-left`, `padding-right`) allow Tailwind to override correctly.

**Why:** The search input icon was overlapping the placeholder text because `padding: 0.625rem 0.875rem` in `.input-field` prevented `pl-10`/`pl-12` from taking effect. Switching to individual padding properties fixed it.

**How to apply:**
1. When defining base CSS classes that will be extended with Tailwind utilities, use individual properties (`padding-left`, `padding-right`) instead of shorthand (`padding`)
2. Add utility classes like `.has-icon-left` / `.has-icon-right` to CSS global for inputs with icons — avoids repeating padding hacks
3. For components using `host: { 'style': '...' }` in Angular, inline styles override Tailwind classes — use wrapper `<div>` or inline SVG in template instead

**ViewEncapsulation trap:** Component styles with `ViewEncapsulation` (default) don't leak. If you use `class="btn-primary"` on an element that doesn't import `ButtonComponent`, it gets no styles. Solution: define shared utility classes (`.btn-primary`, `.btn-secondary`, `.input-field`) in global `styles.css`.

**How to apply:** When creating shared CSS classes that multiple components use, put them in `styles.css` (global), not inside a component's `styles` array. This ensures they work regardless of which components import the defining component.

**Angular icon host style issue (2026-06-01):** Icon components using `host: { 'style': 'display: inline-flex; ...' }` generate inline styles (specificity 1000) that beat Tailwind classes. A wrapper `<div>` did NOT fix this. **Solution: use inline SVG directly in template** with positioning classes. Alternatively, use the `InputComponent` which handles icon positioning internally via CSS `:has()`.

**How to apply:** When placing an icon component inside an absolutely-positioned container (input fields, buttons, modals), either: (1) use raw `<svg>` in template, or (2) use `<app-input [icon]="svgString">` which auto-adjusts padding via `.input-wrapper:has(.input-icon) input { padding-left: 2.5rem; }`.

**Angular innerHTML SVG sanitization (2026-06-01):** When using `[innerHTML]` to render SVG strings in Angular, the sanitizer strips `<svg>` tags completely. A wrapper `<div>` with `absolute` positioning did NOT fix the icon disappearing. **Solution: inject `DomSanitizer`, create a `computed<SafeHtml>(() => this.sanitizer.bypassSecurityTrustHtml(this.icon()))` and bind `[innerHTML]="sanitizedIcon()"`.** The `SafeHtml` type import from `@angular/platform-browser` is required.

**Why:** User spent multiple rounds debugging a search input where the icon appeared as empty space. Inline SVG in template worked fine, but `[innerHTML]` with a string did not — Angular's built-in sanitizer treated SVG as potential XSS.

**How to apply:** Whenever passing SVG as a string via `[innerHTML]`, ALWAYS wrap with `DomSanitizer.bypassSecurityTrustHtml()`. Never trust raw `[innerHTML]` for SVG content.

**`.card` class must be defined globally (2026-06-01):** Companies page used `class="card"` but the `.card` class was never defined in any CSS file. Components rendered without background, border, or border-radius. Added definition to `styles.css` using CSS variables for theme awareness: `background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 1rem; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);`.

**How to apply:** When using CSS class names in templates (like `.card`), always verify the class exists in global `styles.css`. Don't assume Tailwind or component styles cover it. Check with a grep before using new class names in templates.

**Tailwind linter stripping `flex-1` (2026-06-01):** The linter removed `flex-1` from a container that needed it for `mt-auto` to push content to the bottom. The pattern `parent: flex flex-col` + `child: flex-1` + `sibling: mt-auto` requires BOTH `flex-1` on the fill element AND `mt-auto` on the push-down element. If the linter strips `flex-1`, the layout breaks.

**Why:** Profile tag cards (keywords/roles/locations) use this pattern to push the input+button to the card bottom. Without `flex-1` on the tags wrapper, `mt-auto` has no effect.

**How to apply:** When using flex layout with `mt-auto`, verify the sibling has `flex-1` after linter runs. If linter strips it, re-add it or use `min-h-0 flex-1` which is less likely to be flagged.

**Update (2026-06-01):** User explicitly asked to REMOVE `flex-1` from tag cards — "os badgets ficaram gigantes caso tenham poucos, eles n precisam oculpar todo o espaço do cards". The correct layout is: tags area WITHOUT `flex-1` (natural size) + `mt-auto` on input row. The `mt-auto` works even without `flex-1` on sibling — it pushes the input row to the bottom of the flex-col container.
