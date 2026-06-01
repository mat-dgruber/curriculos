---
name: Backdrop-blur stacking context z-index issue
description: backdrop-blur on containers creates stacking contexts — dropdowns and modals need explicit z-index on parent containers to stay above sibling elements.
type: feedback
---

When using `backdrop-blur-*` CSS on a container, it creates a new stacking context. Child elements (like dropdowns with `z-50`) can be clipped by sibling elements that also have `backdrop-blur-*`, even if the sibling has a lower z-index.

**Why:** User reported dropdown selects (platform, status, score) being clipped by job cards below the filter bar. The filter bar had `backdrop-blur-sm` and the cards had `backdrop-blur-xl` — both created stacking contexts, causing z-index comparison issues.

**How to apply:** When a container with `backdrop-blur` has dropdown/overlay children that need to appear above sibling elements:
1. Add `relative z-20` (or higher) to the parent container with dropdowns
2. Add `relative z-10` to sibling card elements
3. Keep the dropdown itself at `z-50` — it's the parent's z-index that matters
4. Apply this pattern in ALL pages with glassmorphism containers that have interactive overlays (dropdowns, modals, tooltips)

**Rule of thumb:** `backdrop-blur` = stacking context. If overlays are clipped, the parent needs a higher z-index than the siblings.
