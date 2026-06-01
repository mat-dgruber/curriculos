---
name: API Communication & FastAPI Debugging
description: Handles frontend-backend parameter mapping rules and CORS policy masquerades on Internal Server Errors (500) in FastAPI.
type: feedback
---

## 1. Parameter Naming Alignment
When calling FastAPI endpoints from Angular, query param names must match exactly — FastAPI does not auto-convert camelCase to snake_case.

**Why:** Got 422 "field required" errors because frontend sent `perPage=20` but backend expected `per_page=20`. The `ApiService.get()` passes params as-is to `HttpParams`, no transformation happens.

**How to apply:** When adding pagination or new query params to an Angular service, verify the backend endpoint's param names first. The `JobsService` correctly maps `perPage` → `per_page` (line 18 of jobs.service.ts), but `ApplicationsService` did not. When creating new service methods, copy the param mapping pattern from `JobsService.getJobs()` which does the snake_case conversion explicitly.

## 2. CORS Masquerade on 500 Internal Server Errors (2026-06-01)
When the FastAPI backend throws an unhandled `500 Internal Server Error` (e.g., due to a missing SQLite table or database exception), the FastAPI CORSMiddleware is bypassed, resulting in a response lacking the `Access-Control-Allow-Origin` headers. This causes the browser to incorrectly report a CORS policy violation (`blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present` / `net::ERR_FAILED`).

**Why:** Unhandled server exceptions prevent the CORS middleware from injecting standard CORS headers.

**How to apply:** Whenever you encounter a CORS block error on a local environment that previously worked, **do not assume it is a CORS configuration issue**. Inspect the terminal logs of the FastAPI server or run a direct `curl -i` command to expose the real 500 Internal Server Error (often caused by unapplied migrations, locked databases, or model discrepancies).

## 3. JSON Field Case Sensitivity in API Responses (2026-06-01)
When returning dictionary objects or Pydantic models from FastAPI endpoints, the keys are serialized as-is (often in `snake_case` in Python). The Angular frontend must be explicitly typed and mapped to match these keys, as TypeScript types do not automatically reconcile camelCase with snake_case.

**Why:** Suggestion lists for target roles (`target_roles`) and locations (`preferred_locations`) were empty in the UI because the frontend service expected `res.targetRoles` and `res.preferredLocations`, which evaluated to `undefined`.

**How to apply:** Ensure that Angular Services and Components map response properties using the exact casing received from the FastAPI JSON payload (e.g., using `res.target_roles || res.targetRoles` to remain backwards-compatible and resilient). Always check the exact network response payload when UI components fail to load values.

