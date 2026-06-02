import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Application, ApplicationListResponse, ApplicationCreate, ApplicationStatusUpdate } from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly api = inject(ApiService);

  getApplications(params?: Record<string, string | number | boolean>): Observable<ApplicationListResponse> {
    return this.api.get<ApplicationListResponse>('/api/v1/applications', params);
  }

  getApplication(id: string): Observable<Application> {
    return this.api.get<Application>(`/api/v1/applications/${id}`);
  }

  createApplication(data: ApplicationCreate): Observable<Application> {
    return this.api.post<Application>('/api/v1/applications', data);
  }

  updateStatus(id: string, data: ApplicationStatusUpdate): Observable<Application> {
    return this.api.put<Application>(`/api/v1/applications/${id}/status`, data);
  }

  deleteApplication(id: string): Observable<Application> {
    return this.api.delete<Application>(`/api/v1/applications/${id}`);
  }

  registerClick(id: string): Observable<Application> {
    return this.api.post<Application>(`/api/v1/applications/${id}/click`, {});
  }
}
