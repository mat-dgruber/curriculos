import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProfileService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get profile', () => {
    const mockProfile = { id: '1', name: 'Test User', email: 'test@test.com' };
    service.getProfile().subscribe(res => {
      expect(res).toBeTruthy();
    });
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/profile'));
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);
  });

  it('should update profile', () => {
    const data = { name: 'Updated Name' };
    service.updateProfile(data).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/profile'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(data);
    req.flush({ id: '1', name: 'Updated Name' });
  });

  it('should upload CV', () => {
    const file = new File(['test'], 'cv.pdf', { type: 'application/pdf' });
    service.uploadCV(file).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/profile/cv'));
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'ok', filename: 'cv.pdf' });
  });
});
