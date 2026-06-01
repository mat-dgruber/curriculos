---
name: Angular 21 Signals — .set()/.update() required + router binding
description: Angular 21 signals require .set()/.update() for mutation. withComponentInputBinding() is required for route params → input signals.
type: feedback
---

Angular 21 signals use `.set(valor)` for direct assignment and `.update(fn)` for derived updates. Calling `signal(valor)` directly (like BehaviorSubject) causes TS2554 errors.

**Why:** In Angular 21, `signal()` returns a `WritableSignal` which is a getter function when called without args. To mutate it, you must use `.set()` or `.update()`. This is different from RxJS `BehaviorSubject.next()` pattern.

**How to apply:** When writing Angular components with signals:
- `signal.set(valor)` — replaces the value entirely
- `signal.update(fn => ({ ...fn, field: newValue }))` — updates based on previous value
- `signal()` in templates — reads the current value (no args = getter)
- NEVER `signal(valor)` to set — this is a TS error
- Common mistake in subscribe callbacks: `this.loading(false)` should be `this.loading.set(false)`

**⚠️ InputSignal is READ-ONLY (2026-06-01):** Angular 21 `input()` returns `InputSignal<T>` which does NOT have `.set()` or `.update()` methods. Attempting `mobileOpen.set(false)` on an `InputSignal` causes TS2339. Only `WritableSignal` (from `signal()`) has mutation methods. To change parent state from a child component, use `output()` to emit events instead.

**How to apply:** When a component receives state via `input()`, it cannot mutate it directly. Use `output()` to emit events back to the parent. Example: sidebar `mobileOpen` is `input<boolean>(false)` — backdrop click must call `mobileClose.emit()` not `mobileOpen.set(false)`. The parent owns the writable signal and controls the state.

**⚠️ withComponentInputBinding() REQUIRED (2026-06-01):** For route params to be injected into component `input()` signals, you MUST add `withComponentInputBinding()` to the router provider. Without it, `provideRouter(routes)` silently ignores route params — the input signal stays at its default value and nothing ever reaches the component. Fix: `provideRouter(routes, withComponentInputBinding())` in app.config.ts. Also rename the input to match the route param exactly (e.g., route `:id` → input `id`, NOT `jobId`).

**Why:** User spent significant time debugging "JobDetail never loads data" — the root cause was missing `withComponentInputBinding()`. The input `jobId` never received the `:id` route param, so the effect never fired. Renaming to `id` + adding the provider fixed it.

**How to apply:** When a component receives data via route params (e.g., `/jobs/:id`), ensure: (1) `withComponentInputBinding()` is in app.config.ts, (2) the input signal name matches the route param name exactly.
