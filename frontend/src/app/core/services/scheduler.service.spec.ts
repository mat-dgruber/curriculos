import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SchedulerService } from './scheduler.service';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SchedulerService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(SchedulerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get scheduler status', () => {
    const mockStatus = { isRunning: true, jobs: [], pausedUntil: null };
    service.getStatus().subscribe(res => {
      expect(res).toEqual(mockStatus);
    });
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/scheduler/status'));
    expect(req.request.method).toBe('GET');
    req.flush(mockStatus);
  });

  it('should trigger a job', () => {
    service.triggerJob('scan_jobs').subscribe(res => {
      expect(res).toBeTruthy();
    });
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/scheduler/trigger/scan_jobs'));
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'ok' });
  });

  it('should pause scheduler', () => {
    service.pause().subscribe(res => {
      expect(res).toBeTruthy();
    });
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/scheduler/pause'));
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'pausado' });
  });

  it('should resume scheduler', () => {
    service.resume().subscribe(res => {
      expect(res).toBeTruthy();
    });
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/scheduler/pause'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'retomado' });
  });
});
