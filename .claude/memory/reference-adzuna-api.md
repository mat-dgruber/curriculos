---
name: Adzuna API Documentation
description: Adzuna has a complete OpenAPI 3.1.0 spec with 9 endpoints including salary histogram, top companies, and geodata — useful for Phase 7 analytics
type: reference
---

Adzuna provides a full OpenAPI 3.1.0 spec at `https://developer.adzuna.com/swagger/spec/test2.json`.

**Key endpoints beyond job search:**
- `GET /jobs/{country}/search/{page}` — Main job search with rich params (what, where, distance, salary_min/max, contract_type, full_time/part_time)
- `GET /jobs/{country}/histogram` — Salary distribution data
- `GET /jobs/{country}/top_companies` — Top employers for search terms
- `GET /jobs/{country}/geodata` — Salary data by location
- `GET /jobs/{country}/history` — Historical salary trends (1-12 months)
- `GET /jobs/{country}/categories` — Job categories

**Supports Brazil (br)** — one of 19 countries. Free tier: 500 req/month.

**How to apply:** When implementing Phase 7 (Market Analysis), Adzuna's histogram/top_companies/history endpoints can provide salary data and hiring trends without building custom analytics. The OpenAPI spec is authoritative for request/response schemas.
