import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  FixedCompany,
  FixedCompanyListResponse,
  FixedCompanyCreate,
  FixedCompanyUpdate,
} from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class CompaniesService {
  private readonly api = inject(ApiService);

  getCompanies(
    params?: Record<string, string | number | boolean>,
  ): Observable<FixedCompanyListResponse> {
    return this.api.get<FixedCompanyListResponse>('/api/v1/companies', params);
  }

  createCompany(data: FixedCompanyCreate): Observable<FixedCompany> {
    return this.api.post<FixedCompany>('/api/v1/companies', data);
  }

  updateCompany(id: string, data: FixedCompanyUpdate): Observable<FixedCompany> {
    return this.api.put<FixedCompany>(`/api/v1/companies/${id}`, data);
  }

  deleteCompany(id: string): Observable<{ message: string; id: string }> {
    return this.api.delete(`/api/v1/companies/${id}`);
  }

  toggleCompany(id: string): Observable<FixedCompany> {
    return this.api.put<FixedCompany>(`/api/v1/companies/${id}/toggle`, {});
  }

  recordSent(id: string): Observable<FixedCompany> {
    return this.api.post<FixedCompany>(`/api/v1/companies/${id}/record-sent`, {});
  }

  testAutomation(id: string): Observable<any> {
    return this.api.post<any>(`/api/v1/companies/${id}/test-automation`, {});
  }

  getLastScreenshot(
    id: string,
  ): Observable<{ screenshotPath: string; status: string; sentAt: string | null }> {
    return this.api.get<{ screenshotPath: string; status: string; sentAt: string | null }>(
      `/api/v1/companies/${id}/last-screenshot`,
    );
  }
}
