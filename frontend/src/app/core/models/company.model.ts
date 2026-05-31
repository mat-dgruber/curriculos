export interface FixedCompany {
  id: string;
  name: string;
  applicationUrl: string;
  status: 'Ativo' | 'Pausado' | 'Respondeu';
  isActive: boolean;
  intervalDays: number;
  lastSentAt: string | null;
  nextSendAt: string | null;
  totalSent: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FixedCompanyListResponse {
  items: FixedCompany[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface FixedCompanyCreate {
  name: string;
  applicationUrl: string;
  intervalDays?: number;
  notes?: string;
}

export interface FixedCompanyUpdate {
  name?: string;
  applicationUrl?: string;
  intervalDays?: number;
  notes?: string;
}
