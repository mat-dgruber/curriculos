import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { SchedulerStatus } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  private readonly api = inject(ApiService);

  getStatus(): Observable<SchedulerStatus> {
    return this.api.get<SchedulerStatus>('/api/v1/scheduler/status');
  }

  triggerJob(jobId: string): Observable<{ message: string }> {
    return this.api.post(`/api/v1/scheduler/trigger/${jobId}`, {});
  }

  pause(): Observable<{ message: string }> {
    return this.api.put('/api/v1/scheduler/pause', {});
  }

  resume(): Observable<{ message: string }> {
    return this.api.delete('/api/v1/scheduler/pause');
  }
}
