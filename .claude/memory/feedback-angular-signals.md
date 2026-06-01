---
name: Angular 21 Signals — .set()/.update() required
description: Angular 21 signals require .set()/.update() for mutation — calling signal(value) directly is a TypeScript error, not the BehaviorSubject pattern.
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
