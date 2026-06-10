import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ApplicationsComponent } from './applications.component';
import { ApplicationsService } from '../../core/services/applications.service';
import { ToastService } from '../../shared/services/toast.service';
import { of, throwError } from 'rxjs';

describe('ApplicationsComponent', () => {
  let component: ApplicationsComponent;
  let fixture: ComponentFixture<ApplicationsComponent>;

  const mockApplications = {
    items: [
      {
        id: 'app-1',
        jobId: 'job-1',
        jobTitle: 'Frontend Engineer',
        companyName: 'Google',
        status: 'Pendente',
        isRecurring: false,
        clickCount: 0,
        createdAt: '2026-06-01T10:00:00Z',
        updatedAt: '2026-06-01T10:00:00Z',
      },
      {
        id: 'app-2',
        jobId: 'recurring',
        jobTitle: 'Candidatura Recorrente',
        companyName: 'Meta',
        status: 'Enviado',
        isRecurring: true,
        sentAt: '2026-06-02T12:00:00Z',
        clickCount: 3,
        createdAt: '2026-06-02T10:00:00Z',
        updatedAt: '2026-06-02T12:00:00Z',
      },
    ],
    total: 2,
    page: 1,
    perPage: 20,
    pages: 1,
  };

  const mockApplicationsService = {
    getApplications: vi.fn(() => of(mockApplications)),
  };

  const mockToastService = {
    error: vi.fn(),
    success: vi.fn(),
  };

  beforeEach(async () => {
    mockApplicationsService.getApplications.mockClear();
    mockToastService.error.mockClear();

    await TestBed.configureTestingModule({
      imports: [ApplicationsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ApplicationsService, useValue: mockApplicationsService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load applications on init', () => {
    fixture.detectChanges();
    expect(mockApplicationsService.getApplications).toHaveBeenCalled();
    expect(component.applications().length).toBe(2);
    expect(component.total()).toBe(2);
  });

  it('should filter by search term with debounce', async () => {
    fixture.detectChanges();
    vi.useFakeTimers();

    component.onSearchChange('Google');
    vi.advanceTimersByTime(300);

    expect(component.searchTerm()).toBe('Google');
    expect(mockApplicationsService.getApplications).toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('should show error when API fails', () => {
    mockApplicationsService.getApplications.mockReturnValueOnce(throwError(() => new Error('Error')));
    fixture.detectChanges();

    expect(component.error()).toBe('Erro ao carregar candidaturas.');
    expect(mockToastService.error).toHaveBeenCalledWith('Erro ao carregar candidaturas.');
  });

  it('should change view mode and save in localStorage', () => {
    fixture.detectChanges();
    component.viewMode.set('grid');
    fixture.detectChanges();
    expect(localStorage.getItem('applicationsViewMode')).toBe('grid');

    component.viewMode.set('list');
    fixture.detectChanges();
    expect(localStorage.getItem('applicationsViewMode')).toBe('list');
  });
});
