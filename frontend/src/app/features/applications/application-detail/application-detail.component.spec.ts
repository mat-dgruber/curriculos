import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ApplicationDetailComponent } from './application-detail.component';
import { ApplicationsService } from '../../../core/services/applications.service';
import { JobsService } from '../../../core/services/jobs.service';
import { CompaniesService } from '../../../core/services/companies.service';
import { ToastService } from '../../../shared/services/toast.service';
import { of, throwError } from 'rxjs';

describe('ApplicationDetailComponent', () => {
  let component: ApplicationDetailComponent;
  let fixture: ComponentFixture<ApplicationDetailComponent>;

  const mockApplication = {
    id: 'app-1',
    jobId: 'job-1',
    jobTitle: 'Frontend Engineer',
    companyName: 'Google',
    status: 'Pendente' as const,
    isRecurring: false,
    clickCount: 0,
    screenshotPath: 'safe_screenshot.png',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  };

  const mockJob = {
    id: 'job-1',
    title: 'Frontend Engineer',
    url: 'https://google.com/jobs/1',
    company: 'Google',
  };

  const mockApplicationsService = {
    getApplication: vi.fn(() => of(mockApplication)),
    updateStatus: vi.fn(() => of({ ...mockApplication, status: 'Enviado' })),
    registerClick: vi.fn(() => of({ ...mockApplication, clickCount: 1 })),
    deleteApplication: vi.fn(() => of({ ...mockApplication, status: 'Arquivado' })),
  };

  const mockJobsService = {
    getJob: vi.fn(() => of(mockJob)),
  };

  const mockCompaniesService = {
    getCompanies: vi.fn(() => of({ items: [] })),
  };

  const mockToastService = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(async () => {
    mockApplicationsService.getApplication.mockClear();
    mockApplicationsService.updateStatus.mockClear();
    mockApplicationsService.registerClick.mockClear();
    mockApplicationsService.deleteApplication.mockClear();
    mockJobsService.getJob.mockClear();
    mockToastService.success.mockClear();
    mockToastService.error.mockClear();

    await TestBed.configureTestingModule({
      imports: [ApplicationDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ApplicationsService, useValue: mockApplicationsService },
        { provide: JobsService, useValue: mockJobsService },
        { provide: CompaniesService, useValue: mockCompaniesService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load application and job on init', () => {
    fixture.componentRef.setInput('id', 'app-1');
    fixture.detectChanges();

    expect(mockApplicationsService.getApplication).toHaveBeenCalledWith('app-1');
    expect(mockJobsService.getJob).toHaveBeenCalledWith('job-1');
    expect(component.application()).toEqual(mockApplication);
    expect(component.job()).toEqual(mockJob);
  });

  it('should update status successfully', () => {
    fixture.componentRef.setInput('id', 'app-1');
    fixture.detectChanges();

    component.updateStatus('Enviado');
    expect(mockApplicationsService.updateStatus).toHaveBeenCalledWith('app-1', {
      status: 'Enviado',
    });
    expect(mockToastService.success).toHaveBeenCalledWith('Status alterado para "Enviado".');
  });

  it('should register click', () => {
    fixture.componentRef.setInput('id', 'app-1');
    fixture.detectChanges();

    component.trackClick();
    expect(mockApplicationsService.registerClick).toHaveBeenCalledWith('app-1');
    expect(component.application()?.clickCount).toBe(1);
  });

  it('should archive application on confirmation', () => {
    fixture.componentRef.setInput('id', 'app-1');
    fixture.detectChanges();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const backSpy = vi.spyOn(window.history, 'back');

    component.confirmDelete();

    expect(mockApplicationsService.deleteApplication).toHaveBeenCalledWith('app-1');
    expect(mockToastService.success).toHaveBeenCalledWith('Candidatura arquivada.');
    expect(backSpy).toHaveBeenCalled();
  });
});
