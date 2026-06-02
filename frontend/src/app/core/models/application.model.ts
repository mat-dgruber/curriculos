export type ApplicationStatus = 'Pendente' | 'Enviado' | 'Falhou' | 'Arquivado';

export const VALID_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  Pendente: ['Enviado', 'Falhou', 'Arquivado'],
  Enviado: ['Arquivado', 'Falhou'],
  Falhou: ['Pendente', 'Enviado', 'Arquivado'],
  Arquivado: ['Pendente'],
};

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatus;
  sentAt: string | null;
  isRecurring: boolean;
  screenshotPath: string | null;
  errorMessage: string | null;
  notes: string | null;
  fixedCompanyId: string | null;
  clickCount: number;
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
  status: ApplicationStatus;
  notes?: string;
}
