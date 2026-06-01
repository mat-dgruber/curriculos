import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationsService } from './applications.service';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApplicationsService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ApplicationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get applications', () => {
    const mockResponse = { items: [], total: 0, page: 1, perPage: 20, pages: 0 };
    service.getApplications().subscribe(res => {
      expect(res).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/applications'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get applications with status filter', () => {
    service.getApplications({ status: 'Enviado' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/applications'));
    expect(req.request.params.get('status')).toBe('Enviado');
    req.flush({ items: [], total: 0, page: 1, perPage: 20, pages: 0 });
  });

  it('should create application', () => {
    service.createApplication({ jobId: 'job-123' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/applications'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ jobId: 'job-123' });
    req.flush({ id: 'app-1', jobId: 'job-123' });
  });

  it('should update application status', () => {
    service.updateStatus('app-1', { status: 'Enviado' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/applications/app-1/status'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ status: 'Enviado' });
    req.flush({ id: 'app-1', status: 'Enviado' });
  });
});
