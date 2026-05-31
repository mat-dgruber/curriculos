export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  status: 'Pendente' | 'Enviado' | 'Falhou' | 'Arquivado';
  sentAt: string | null;
  isRecurring: boolean;
  screenshotPath: string | null;
  errorMessage: string | null;
  notes: string | null;
  fixedCompanyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationListResponse {
  items: Application[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface ApplicationCreate {
  jobId: string;
  notes?: string;
}

export interface ApplicationStatusUpdate {
  status: 'Pendente' | 'Enviado' | 'Falhou' | 'Arquivado';
  notes?: string;
}
