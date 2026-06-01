import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CompaniesService } from './companies.service';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CompaniesService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CompaniesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get companies', () => {
    const mockResponse = { items: [], total: 0, page: 1, perPage: 20, pages: 0 };
    service.getCompanies().subscribe(res => {
      expect(res).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/companies'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create company', () => {
    const data = { name: 'Test Corp', applicationUrl: 'https://test.com', intervalDays: 30 };
    service.createCompany(data).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/companies'));
    expect(req.request.method).toBe('POST');
    req.flush({ id: '1', ...data });
  });

  it('should update company', () => {
    service.updateCompany('1', { name: 'Updated' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/companies/1'));
    expect(req.request.method).toBe('PUT');
    req.flush({ id: '1', name: 'Updated' });
  });

  it('should delete company', () => {
    service.deleteCompany('1').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/companies/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'removido' });
  });

  it('should toggle company', () => {
    service.toggleCompany('1').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/companies/1/toggle'));
    expect(req.request.method).toBe('PUT');
    req.flush({ id: '1', isActive: false });
  });
});
