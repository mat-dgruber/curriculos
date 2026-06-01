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
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
