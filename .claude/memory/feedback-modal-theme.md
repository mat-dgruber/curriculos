---
name: Modals must use theme-adaptive colors
description: Modals and overlays need explicit dark-bg/dark-surface colors, not glass-v2 or hardcoded backgrounds, to respect active theme
type: feedback
---

Modals and overlay panels must use theme-aware color tokens, not hardcoded or generic glass classes.

**Why:** A reject-modal used `glass-v2` class which rendered as light gray even in dark mode. The backdrop and input fields were also unstyled, creating a jarring light-on-dark mismatch.

**How to apply:**
1. Modal backdrop: `bg-black/60 backdrop-blur-md`
2. Modal container: `bg-dark-surface border border-dark-border rounded-2xl shadow-2xl`
3. Inputs inside modals: `bg-dark-bg border border-dark-border` with `focus:border-primary focus:outline-none`
4. Apply the same pattern to both jobs-list and job-detail modals for consistency
5. Always test modals in both dark and light mode before committing
