import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { SchedulerStatus } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  private readonly api = inject(ApiService);

  status = signal<SchedulerStatus | null>(null);

  getStatus(): Observable<SchedulerStatus> {
    return this.api.get<SchedulerStatus>('/api/v1/scheduler/status').pipe(
      tap((status) => this.status.set(status))
    );
  }

  triggerJob(jobId: string): Observable<{ message: string }> {
    return this.api.post(`/api/v1/scheduler/trigger/${jobId}`, {});
  }

  pause(): Observable<{ message: string }> {
    return this.api.put<{ message: string }>('/api/v1/scheduler/pause', {}).pipe(
      tap(() => this.status.update((s) => (s ? { ...s, isRunning: false } : null)))
    );
  }

  resume(): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/api/v1/scheduler/pause').pipe(
      tap(() => this.status.update((s) => (s ? { ...s, isRunning: true } : null)))
    );
  }
}