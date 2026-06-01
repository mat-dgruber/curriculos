import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Job, JobListResponse, JobFilters, RejectedJobListResponse } from '../models/job.model';

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
      if (filters.isFavorite !== undefined) params['is_favorite'] = filters.isFavorite;
      if (filters.sortBy) params['sort_by'] = filters.sortBy;
      if (filters.sortOrder) params['sort_order'] = filters.sortOrder;
    }
    return this.api.get<JobListResponse>('/api/v1/jobs', params);
  }

  getJob(id: string): Observable<Job> {
    return this.api.get<Job>(`/api/v1/jobs/${id}`);
  }

  updateJob(id: string, data: Partial<Job>): Observable<Job> {
    return this.api.patch<Job>(`/api/v1/jobs/${id}`, data);
  }

  scanJobs(): Observable<{ message: string; status: string }> {
    return this.api.post('/api/v1/jobs/scan', {});
  }

  getScanStatus(): Observable<{ status: string; started_at: string | null; finished_at: string | null; result: any; error: string | null }> {
    return this.api.get('/api/v1/jobs/scan/status');
  }

  enrichDescriptions(): Observable<{ message: string; status: string }> {
    return this.api.post('/api/v1/jobs/enrich', {});
  }

  deleteJob(id: string, reason?: string, notes?: string): Observable<{ message: string }> {
    const body: Record<string, string> = {};
    if (reason) body['reason'] = reason;
    if (notes) body['notes'] = notes;
    return this.api.delete<{ message: string }>(`/api/v1/jobs/${id}`, body);
  }

  rejectBatch(jobIds: string[], reason: string, notes?: string): Observable<{ message: string; deleted: number }> {
    return this.api.post('/api/v1/jobs/reject-batch', { jobIds, reason, notes });
  }

  getRejectedJobs(page?: number): Observable<RejectedJobListResponse> {
    const params: Record<string, number> = {};
    if (page) params['page'] = page;
    return this.api.get<RejectedJobListResponse>('/api/v1/jobs/rejected', params);
  }

  autoDeletePreview(): Observable<{ autoDeleteDays: number; wouldDelete: number }> {
    return this.api.post('/api/v1/jobs/auto-delete/preview', {});
  }

  autoDeleteRun(): Observable<{ deleted: number }> {
    return this.api.post('/api/v1/jobs/auto-delete/run', {});
  }

  rejectByFilter(params: { maxScore?: number; olderThanDays?: number; nonFavoritesOnly?: boolean; reason?: string; notes?: string }): Observable<{ deleted: number }> {
    return this.api.post('/api/v1/jobs/reject-by-filter', params);
  }
}
