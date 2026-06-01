import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { JobsService } from './jobs.service';

describe('JobsService', () => {
  let service: JobsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JobsService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(JobsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get jobs with default params', () => {
    const mockResponse = { items: [], total: 0, page: 1, perPage: 20, pages: 0 };
    service.getJobs({}).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/jobs'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get jobs with search filter', () => {
    service.getJobs({ search: 'angular' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/jobs'));
    expect(req.request.params.get('search')).toBe('angular');
    req.flush({ items: [], total: 0, page: 1, perPage: 20, pages: 0 });
  });

  it('should get jobs with minScore filter', () => {
    service.getJobs({ minScore: 80 }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/jobs'));
    expect(req.request.params.get('min_score')).toBe('80');
    req.flush({ items: [], total: 0, page: 1, perPage: 20, pages: 0 });
  });

  it('should get jobs with platform filter', () => {
    service.getJobs({ platform: 'linkedin' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/jobs'));
    expect(req.request.params.get('platform')).toBe('linkedin');
    req.flush({ items: [], total: 0, page: 1, perPage: 20, pages: 0 });
  });

  it('should get single job by id', () => {
    const mockJob = { id: '123', title: 'Test Job' };
    service.getJob('123').subscribe(res => {
      expect(res).toEqual(mockJob);
    });
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/jobs/123'));
    expect(req.request.method).toBe('GET');
    req.flush(mockJob);
  });

  it('should trigger scan with POST', () => {
    service.scanJobs().subscribe(res => {
      expect(res).toBeTruthy();
    });
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/jobs/scan'));
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'ok', status: 'running' });
  });
});
