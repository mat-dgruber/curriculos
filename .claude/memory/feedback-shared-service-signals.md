---
name: Cross-Component Layout Synchronization with Service Signals
description: Best practices for synchronizing shared states (such as background job status) across multiple layout components in Angular using shared service signals
type: feedback
---

# Cross-Component Layout Synchronization with Service Signals

When multiple distinct viewport areas (such as a global header/topbar and a local page content card) need to monitor and display a synchronized real-time server state (such as background robot/scheduler running status), do not duplicate local signals or poll independently. Instead, centralize the state in a shared Angular service.

## Guidelines

1. **Service-Level Signal:** Declare a writable signal inside the singleton service: `status = signal<SchedulerStatus | null>(null);`.
2. **RxJS Tap Interception:** Pipe the `tap` operator on the service's HTTP methods (`getStatus()`, `pause()`, `resume()`) to automatically update this single status signal:
   ```typescript
   pause(): Observable<{ message: string }> {
     return this.api.put('/api/v1/scheduler/pause', {}).pipe(
       tap(() => this.status.update(s => s ? { ...s, isRunning: false } : null))
     );
   }
   ```
3. **Direct Component Binding:** Bind local components to the shared service signal directly:
   `schedulerStatus = this.schedulerService.status;`
4. **No Local State Mutations:** Let components simply call the service methods; the shared signal will propagate changes reactively and instantly across all active layout subscribers.
5. **Always Bind Visual Feedback to Manual Actions:** When a layout element (like the "Buscar Vagas" button in the Topbar) triggers an asynchronous backend background task that completes instantly under a 202 Accepted response, do not silently subscribe. Always inject `ToastService` and couple the subscription lifecycle with clear information and success/error toasts to give immediate feedback to the user.

**Why:** Avoids visual desynchronization and race conditions. Any action taken in one view instantly updates all observers globally across the application layout with zero-lag. Coupling background action triggers with active toast feedback prevents "dead" clicks where the user gets no visual confirmation that their action was successfully processed.
