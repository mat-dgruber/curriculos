---
name: LinkedIn API Limitations
description: LinkedIn has no public job search API — Consumer API is Sign In/Share only, Talent Solutions requires commercial partnership
type: reference
---

LinkedIn does NOT provide a public API for job search/listing data.

**Consumer Solutions Platform** (https://developer.linkedin.com/product-catalog/consumer):
- Sign In with LinkedIn (OpenID Connect)
- Share on LinkedIn
- Add to Profile
- NO job search or job listing endpoints

**Marketing API** (https://learn.microsoft.com/en-us/linkedin/marketing/):
- Campaign Management, Reporting, Lead Sync, Matched Audiences
- NO job data access

**Talent Solutions** (Job Posting API):
- Available via `job-posting-development-tools` repo on GitHub (linkedin-developers org)
- Requires commercial partnership agreement
- Postman collections available but access is gated

**Current approach**: Playwright scraping of linkedin.com/jobs/search/ (public page, no login required). Fragile but works for basic listings.

**How to apply:** Do NOT attempt to find a LinkedIn job API — it doesn't exist for free-tier users. Keep Playwright scraping as the LinkedIn integration method. If user asks about LinkedIn API, redirect to Talent Solutions commercial options.
