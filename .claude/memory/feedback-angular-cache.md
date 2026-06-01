---
name: Angular Build Cache Stale
description: After creating new component files, Angular build may fail with "Could not resolve" errors due to stale cache — clean with rm -rf dist/ .angular/
type: feedback
---

After creating new Angular component files and adding lazy-loaded routes, `npx ng build` may fail with "Could not resolve" errors even though the files exist at the correct path.

**Why:** Angular's build cache (`.angular/` directory) can become stale when new files are added outside the normal dev server flow. The cache holds a manifest of resolved modules that doesn't include newly created files.

**How to apply:** When a build fails with "Could not resolve" for a file that definitely exists, run `rm -rf dist/ .angular/` before rebuilding. Do NOT keep retrying `ng build` without cleaning cache first — it will keep failing. This is different from a normal code error (which would show TS errors), this is a cache resolution issue.
