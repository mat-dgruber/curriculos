import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CandidateProfile, CandidateProfileUpdate } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);

  getProfile(): Observable<CandidateProfile> {
    return this.api.get<CandidateProfile>('/api/v1/profile');
  }

  createProfile(data: any): Observable<CandidateProfile> {
    return this.api.post<CandidateProfile>('/api/v1/profile', data);
  }

  updateProfile(data: CandidateProfileUpdate): Observable<CandidateProfile> {
    return this.api.put<CandidateProfile>('/api/v1/profile', data);
  }

  uploadCV(file: File): Observable<{ message: string; filename: string; sizeBytes: number; uploadedAt: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.upload('/api/v1/profile/cv', formData);
  }

  getCVSuggestions(): Observable<{ keywords: string[]; target_roles: string[]; preferred_locations: string[] }> {
    return this.api.get<{ keywords: string[]; target_roles: string[]; preferred_locations: string[] }>('/api/v1/profile/cv-suggestions');
  }
}
