import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should perform GET request', () => {
    const mockData = { items: [] };
    service.get<any>('/api/v1/jobs').subscribe(res => {
      expect(res).toEqual(mockData);
    });
    const req = httpMock.expectOne(req => req.url.includes('/api/v1/jobs'));
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should perform POST request', () => {
    const body = { title: 'Test' };
    service.post<any>('/api/v1/jobs/scan', body).subscribe(res => {
      expect(res).toBeTruthy();
    });
    const req = httpMock.expectOne(req => req.url.includes('/api/v1/jobs/scan'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ message: 'ok' });
  });

  it('should perform PUT request', () => {
    const body = { status: 'Enviado' };
    service.put<any>('/api/v1/applications/1/status', body).subscribe(res => {
      expect(res).toBeTruthy();
    });
    const req = httpMock.expectOne(req => req.url.includes('/api/v1/applications/1/status'));
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'ok' });
  });

  it('should perform DELETE request', () => {
    service.delete<any>('/api/v1/companies/1').subscribe(res => {
      expect(res).toBeTruthy();
    });
    const req = httpMock.expectOne(req => req.url.includes('/api/v1/companies/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'ok' });
  });
});
