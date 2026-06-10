---
name: Dashboard Documentation Pattern - Inline JSDoc + Separate .md
description: Documenting DashboardComponent with comprehensive inline JSDoc/TSDoc on class, signals, and methods, plus a separate technical .md documentation file
type: feedback
---

When adding documentation to a major component like Dashboard:

1. **Inline JSDoc/TSDoc on the component class and all members:**
   - Class-level: `@Component` description, selector, standalone, dependencies overview
   - Every `signal()` and `computed()` — explain what it holds and when it updates
   - Every method — params, return, side effects, API calls
   - Use Mermaid diagrams for architecture flows (forkJoin pipeline, signal lifecycle)

2. **Separate .md documentation file (e.g., `docs/dashboard-module.md`):**
   - Overview, dependencies table, architecture flowchart
   - Signal lifecycle state diagram
   - Business rules (platform aggregation, weekly chart, percentages, scheduler controls)
   - Performance table with computed signals and dependencies
   - Troubleshooting table, extensibility examples
   - Related files index

3. **Test mocks must match actual service interface:**
   - Dashboard tests failed because `mockSchedulerService` was missing `status` signal and `pause/resume/triggerJob` methods
   - Fixed by adding: `status: signal({ isRunning: true, jobs: [], pausedUntil: null })` and mock implementations returning `of({ message: '...' })`
   - Always verify service interface before writing tests

**Why:** The dashboard component has complex reactive architecture (forkJoin, 20+ computed signals, shared service signals). Inline docs help maintainers understand signal dependencies; separate .md serves as architectural reference. Tests were failing silently because mocks didn't match the real `SchedulerService` which uses a shared `status` signal updated via RxJS `tap`.

**How to apply:** For any component with complex signal architecture or shared service signals, apply this dual documentation pattern. Before writing tests, read the actual service to ensure mocks include all signals and methods the component uses.