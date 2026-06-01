---
name: Remotive API Reference
description: Remotive is a free remote jobs API — no auth required, max 4 req/day, must link back, no redistribution to job aggregators
type: reference
---

Remotive provides a free public API for remote job listings.

**Endpoint:** `GET https://remotive.com/api/remote-jobs`

**Params (all optional):**
- `search` — keyword search (title + description)
- `category` — filter by category slug (e.g., `software-dev`)
- `company_name` — partial match, case-insensitive
- `limit` — max results (default: all)

**Categories endpoint:** `GET https://remotive.com/api/remote-jobs/categories`

**Response fields per job:**
- `id`, `url`, `title`, `company_name`, `company_logo`
- `category`, `job_type` (full_time, contract, part_time, freelance, internship)
- `publication_date` (ISO 8601), `candidate_required_location`, `salary`
- `description` (full HTML)

**Rate limit:** Max 4 requests per day. Data is delayed 24h.

**Terms of use:** Must link back to Remotive. Cannot redistribute to job aggregator sites.

**How to apply:** RemotiveScraper uses this API with no auth key needed. Rate limit counter is class-level (resets daily). Good source for global remote positions.
