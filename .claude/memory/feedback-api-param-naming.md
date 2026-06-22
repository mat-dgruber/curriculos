---
name: API Communication & FastAPI Debugging
description: Handles frontend-backend parameter mapping rules and CORS policy masquerades on Internal Server Errors (500) in FastAPI.
type: feedback
---

## 1. Parameter Naming Alignment
When calling FastAPI endpoints from Angular, query param names must match exactly — FastAPI does not auto-convert camelCase to snake_case.

**Why:** Got 422 "field required" errors because frontend sent `perPage=20` but backend expected `per_page=20`. The `ApiService.get()` passes params as-is to `HttpParams`, no transformation happens.

**How to apply:** When adding pagination or new query params to an Angular service, verify the backend endpoint's param names first. The `JobsService` correctly maps `perPage` → `per_page` (line 18 of jobs.service.ts), but `ApplicationsService` did not. When creating new service methods, copy the param mapping pattern from `JobsService.getJobs()` which does the snake_case conversion explicitly.

## 2. CORS Masquerade on 5xx Server Errors (502/500/503) — 2026-06-01 + 2026-06-22
When the backend returns ANY 5xx error surface to the browser — FastAPI 500 from unhandled exception, **OR nginx 502/503/504 upstream error** — the response has NO `Access-Control-Allow-Origin` header. The browser then reports it as a CORS policy block with `net::ERR_FAILED`, misdirecting the investigation toward CORSMiddleware config when the real cause is upstream/downstream service health.

**Why:**
- (500) Unhandled server exception bypasses FastAPI CORSMiddleware before headers are written.
- (502/504) Nginx returns its own HTML error page (`nginx/1.18.0 (Ubuntu)`, `Content-Type: text/html`, `Connection: keep-alive`) for upstream failures. Nginx does NOT inject CORS on these — that only happens for proxied 2xx/4xx responses.

**How to apply:** Whenever you get a browser CORS block error in production:
1. Open DevTools → Network → the failing request → inspect `Status Code` and the `Response Headers` block.
2. If `Status Code` is 5xx OR the response Content-Type is `text/html` with `Server: nginx` → it's NOT a CORS issue, it's upstream health.
3. Run `curl -i -H 'Origin: https://<your-frontend>' https://<api-host>/<endpoint>` from local terminal. The bare `curl` will show the real HTTP status without browser masking.
4. For nginx-upstream: SSH into the VM and check `docker ps` + container health (`docker inspect <ctr> --format '{{.State.Health.Status}}'`) — if `unhealthy` with high `FailingStreak`, `docker restart <ctr>` and re-check.
5. Always include `-H 'Origin: ...'` flag so CORS headers appear even on 2xx responses when validating from terminal.

## 3. JSON Field Case Sensitivity in API Responses (2026-06-01)
When returning dictionary objects or Pydantic models from FastAPI endpoints, the keys are serialized as-is (often in `snake_case` in Python). The Angular frontend must be explicitly typed and mapped to match these keys, as TypeScript types do not automatically reconcile camelCase with snake_case.

**Why:** Suggestion lists for target roles (`target_roles`) and locations (`preferred_locations`) were empty in the UI because the frontend service expected `res.targetRoles` and `res.preferredLocations`, which evaluated to `undefined`.

**How to apply:** Ensure that Angular Services and Components map response properties using the exact casing received from the FastAPI JSON payload (e.g., using `res.target_roles || res.targetRoles` to remain backwards-compatible and resilient). Always check the exact network response payload when UI components fail to load values.

