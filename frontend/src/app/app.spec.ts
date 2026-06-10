import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { App } from './app';
import { SchedulerService } from './core/services/scheduler.service';

describe('App', () => {
  const mockSchedulerService = {
    getStatus: () => of({ isRunning: true, jobs: [], pausedUntil: null }),
    status: signal({ isRunning: true, jobs: [], pausedUntil: null }),
    pause: () => of({ message: 'Paused' }),
    resume: () => of({ message: 'Resumed' }),
    triggerJob: () => of({ message: 'Triggered' }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
          { path: '**', redirectTo: 'dashboard' }
        ]),
        { provide: SchedulerService, useValue: mockSchedulerService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            queryParams: of({}),
            snapshot: {},
            paramMap: of({ get: () => null }),
            queryParamMap: of({ get: () => null }),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render dashboard title', async () => {
    const router = TestBed.inject(Router);
    await router.navigate(['/dashboard']);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Dashboard');
  });
});
