---
name: Animated Icons Source — itshover.com
description: itshover.com provides animated SVG icons as React/Framer Motion components — extract paths and convert to Angular CSS transitions
type: reference
---

itshover.com is the primary source for animated icon SVGs in the JobHunter project.

**URL pattern:** `https://itshover.com/r/[icon-name]-icon.json`

Each JSON contains: React component with SVG paths, Framer Motion animation logic, CSS class targets for animation groups.

**How to convert to Angular:**
1. Extract SVG `d` paths and `<g>` group class names from the JSON
2. Replace Framer Motion `animate()` calls with CSS transitions in `:host:hover`
3. Wrap animated parts in `<g class="target-name">` tags
4. Use `transition: transform 0.3s ease-out` and `:host:hover .target { transform: ... }`

**Available icons found (2026-06-01):**
- travel-bag, rocket-icon, hotel-icon, user-icon, gear-icon, magnifier-icon, filled-bell-icon, layout-dashboard-icon, triangle-alert-icon, checked-icon, upload-icon, file-description-icon, chart-line-icon, link-icon, map-pin-icon, simple-checked-icon, right-chevron, down-chevron, refresh-icon, info-circle-icon, cloud-1-icon, heart-icon, bell-off-icon, double-check-icon

**Not found on itshover.com (404):** inbox-icon, chevron-left-icon, spinner/loader-icon

**Project icon mapping (24 components created):**

| Component | Source | itshover name | Animation |
|-----------|--------|---------------|-----------|
| dashboard-icon | itshover | layout-dashboard | 4 rects fly apart |
| briefcase-icon | custom CSS | — | handle lifts up |
| send-icon | itshover | send-icon | fly out + return |
| building-icon | itshover | hotel | scaleY bounce |
| user-icon | itshover | user | scale 1.05 + lift |
| cog-icon | custom CSS | — | rotate 45deg |
| search-icon | custom CSS | — | wiggle rotation |
| bell-icon | itshover | filled-bell | swing from top |
| external-link-icon | itshover | link | arrow flies out |
| clock-icon | itshover | clock | hands rotate 360 |
| check-icon | itshover | simple-checked | stroke-dashoffset draw |
| triangle-alert-icon | itshover | triangle-alert | triangle bounce + exclamation pulse |
| chevron-left-icon | custom CSS | — | translateX(-3px) |
| chevron-right-icon | custom CSS | — | translateX(+3px) |
| chevron-down-icon | custom CSS | — | translateY(+3px) |
| file-text-icon | itshover | file-description | fold + lines draw |
| circle-check-icon | itshover | checked | scale + stroke draw |
| cloud-upload-icon | itshover | upload | arrow moves up |
| tag-icon | custom CSS | — | swing rotation |
| map-pin-icon | itshover | map-pin | dot pulse |
| trending-up-icon | custom CSS | — | translateY(-2px) |
| inbox-icon | custom CSS | — | translateY(-2px) |
| x-icon | custom CSS | — | lines rotate open |
| plug-connected-icon | itshover | plug-connected | halves separate |

**Why:** User explicitly chose itshover.com icons and wanted all static SVGs replaced with animated versions. The site has 263 icons total.

**How to apply:** When creating new icon components, always check itshover.com first. If not found, create CSS custom animation (pulse, rotate, bounce, etc.). All components live in `shared/components/[name]-icon/`.
