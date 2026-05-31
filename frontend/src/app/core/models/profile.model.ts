export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  targetRole: string | null;
  linkedinUrl: string | null;
  cvFilename: string | null;
  cvUploadedAt: string | null;
  keywords: string[];
  targetRoles: string[];
  preferredLocations: string[];
  scanIntervalHours: number;
  autoApply: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProfileUpdate {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  targetRole?: string;
  linkedinUrl?: string;
  keywords?: string[];
  targetRoles?: string[];
  preferredLocations?: string[];
  scanIntervalHours?: number;
  autoApply?: boolean;
}

export interface SchedulerStatus {
  isRunning: boolean;
  jobs: SchedulerJob[];
  pausedUntil: string | null;
}

export interface SchedulerJob {
  id: string;
  name: string;
  nextRun: string | null;
  lastRun: string | null;
  lastStatus: string | null;
  trigger: string;
}

export interface DashboardStats {
  totalJobs: number;
  sentApplications: number;
  responseRate: number;
}

export interface UserSettings {
  keywords: string[];
  targetRoles: string[];
  preferredLocations: string[];
  scanIntervalHours: number;
  autoApply: boolean;
}
