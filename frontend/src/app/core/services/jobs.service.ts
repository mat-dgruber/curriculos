import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Job, JobListResponse, JobFilters } from '../models/job.model';

@Injectable({ providedIn: 'root' })
export class JobsService {
  private readonly api = inject(ApiService);

  getJobs(filters?: JobFilters): Observable<JobListResponse> {
    const params: Record<string, string | number | boolean> = {};
    if (filters) {
      if (filters.search) params['search'] = filters.search;
      if (filters.minScore) params['min_score'] = filters.minScore;
      if (filters.platform && filters.platform !== 'all') params['platform'] = filters.platform;
      if (filters.status && filters.status !== 'all') params['status'] = filters.status;
      if (filters.page) params['page'] = filters.page;
      if (filters.perPage) params['per_page'] = filters.perPage;
      if (filters.sortBy) params['sort_by'] = filters.sortBy;
      if (filters.sortOrder) params['sort_order'] = filters.sortOrder;
    }
    return this.api.get<JobListResponse>('/api/v1/jobs', params);
  }

  getJob(id: string): Observable<Job> {
    return this.api.get<Job>(`/api/v1/jobs/${id}`);
  }

  scanJobs(): Observable<{ message: string; jobId: string; status: string }> {
    return this.api.post('/api/v1/jobs/scan', {});
  }
}
