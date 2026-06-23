---
name: Arbeitnow Job Board API
description: Free public API at arbeitnow.com — no auth, no rate-limit blowback. Drop-in Jooble replacement for free-tier-only stacks.
type: reference
---

Arbeitnow maintains a free public job board API that doesn't require authentication and was used to replace Jooble after the user rejected paid-API signups.

**Endpoint:** `GET https://www.arbeitnow.com/api/job-board-api`

**Query params:**
- `search` — keyword (matches title + description)
- `page` — pagination (page numbers, 1-based; `0` may also be accepted)
- No auth headers, no API key

**Response shape:**
```json
{
  "data": [
    {
      "title": "...",
      "company_name": "...",
      "location": "...",
      "description": "...",
      "url": "https://arbeitnow.com/job/{id}",
      "tags": ["angular", "typescript"]
    }
  ],
  "links": {"first": "...", "last": "...", "prev": null, "next": "..."},
  "meta": {"total": <int>, "current_page": 1, "per_page": 50}
}
```

**Why:** On 2026-06-23 user removed Jooble from the scraper registry because the free signup key flow is friction, and pointed at Arbeitnow as the clean drop-in. Cost-conscious user explicitly prefers APIs without any auth over "free trial with key" patterns (`user-cost-conscious.md`).

**How to apply:** Prefer Arbeitnow when a scraper needs a free public jobs feed without auth. Use `tags` as the `requirements` source (matches JobHunter's matcher expectations). Treat `total` from meta as authoritative count for logging. No rate limiter needed — much higher ceiling than Remotive's 4 req/day cap.
