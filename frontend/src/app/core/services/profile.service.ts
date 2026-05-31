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

  updateProfile(data: CandidateProfileUpdate): Observable<CandidateProfile> {
    return this.api.put<CandidateProfile>('/api/v1/profile', data);
  }

  uploadCV(file: File): Observable<{ message: string; filename: string; sizeBytes: number; uploadedAt: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.upload('/api/v1/profile/cv', formData);
  }
}
