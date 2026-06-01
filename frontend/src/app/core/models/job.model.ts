export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  platform: string;
  url: string;
  description: string | null;
  requirements: string | null;
  salaryRange: string | null;
  score: number;
  status: 'Nova' | 'Visualizada' | 'Candidatou';
  isFavorite: boolean;
  foundAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobListResponse {
  items: Job[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface JobFilters {
  search?: string;
  minScore?: number;
  platform?: string;
  status?: string;
  isFavorite?: boolean;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RejectedJob {
  id: string;
  originalJobId: string | null;
  url: string;
  title: string;
  company: string;
  location: string;
  platform: string;
  score: number;
  reason: string;
  notes: string | null;
  rejectedAt: string;
}

export interface RejectedJobListResponse {
  items: RejectedJob[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface RejectRequest {
  reason: string;
  notes?: string;
}
