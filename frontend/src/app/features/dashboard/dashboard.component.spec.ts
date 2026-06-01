import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { JobsService } from '../../core/services/jobs.service';
import { ApplicationsService } from '../../core/services/applications.service';
import { SchedulerService } from '../../core/services/scheduler.service';
import { of } from 'rxjs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  const mockJobsService = {
    getJobs: () => of({
      items: [
        { id: '1', title: 'Dev Angular', company: 'Tech', location: 'SP', score: 85, foundAt: new Date().toISOString(), platform: 'linkedin', status: 'Nova' }
      ],
      total: 5, page: 1, perPage: 5, pages: 1
    })
  };

  const mockApplicationsService = {
    getApplications: () => of({
      items: [
        { id: '1', status: 'Enviado' },
        { id: '2', status: 'Falhou' }
      ],
      total: 2, page: 1, perPage: 20, pages: 1
    })
  };

  const mockSchedulerService = {
    getStatus: () => of({ isRunning: true, jobs: [], pausedUntil: null })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: JobsService, useValue: mockJobsService },
        { provide: ApplicationsService, useValue: mockApplicationsService },
        { provide: SchedulerService, useValue: mockSchedulerService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load jobs on init', () => {
    fixture.detectChanges();
    expect(component.recentJobs().length).toBe(1);
    expect(component.recentJobs()[0].title).toBe('Dev Angular');
  });

  it('should set total jobs in stats', () => {
    fixture.detectChanges();
    expect(component.stats().totalJobs).toBe(5);
  });

  it('should count sent applications', () => {
    fixture.detectChanges();
    expect(component.stats().sentApplications).toBe(1);
  });

  it('should load scheduler status', () => {
    fixture.detectChanges();
    expect(component.schedulerStatus()?.isRunning).toBe(true);
  });

  it('should display stats in template', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Vagas Encontradas');
    expect(el.textContent).toContain('Currículos Enviados');
    expect(el.textContent).toContain('Dashboard');
  });

  it('should display recent job title', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Dev Angular');
    expect(el.textContent).toContain('Tech');
  });

  it('should show active scheduler status', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Robô ativo');
  });
});
