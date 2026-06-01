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
