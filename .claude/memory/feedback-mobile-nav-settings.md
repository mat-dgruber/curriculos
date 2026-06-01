---
name: Mobile Nav Order & Settings Consolidation
description: Bottom nav order: Dashboard, Candidaturas, Empresas, Vagas (center), Perfil. Settings merged into Profile page — no /settings route.
type: feedback
---

Bottom nav item order is: Dashboard, Candidaturas, Empresas, **Vagas**, Perfil. Vagas sits at index 3 (4th position) and is visually highlighted as the center action — larger icon, elevated, glow effect when active.

**Why:** User explicitly said "quero q as vagas fiquem no indice 3" — they want the primary action (searching jobs) in the center/prominent position of the bottom nav. The highlight treatment (elevation + glow) draws attention to the main feature.

**How to apply:** When modifying bottom nav, maintain this exact order. Vagas gets special styling: 24px icon (vs 22px), `translateY(-4px)`, active glow shadow. Other items are standard size.

Settings consolidation: User said "quero unificar as configurações dentro do profile assim n precisaremos de mais um botão". All settings (theme toggle, keywords, roles, locations, automation) now live in the profile page. The `/settings` route was removed from `app.routes.ts`, sidebar and bottom nav no longer have a Settings entry. The `SettingsComponent` file still exists but is unrouted.

**Why:** User wants fewer navigation items — a single Profile page with everything is cleaner than splitting personal data and preferences across two pages.

**How to apply:** Don't create a new /settings route. Any new user preferences go into the profile page. If SettingsComponent is needed later for code reference, it's at `features/settings/settings.component.ts`.
