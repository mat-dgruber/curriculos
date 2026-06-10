import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../shared/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  const mockProfile = {
    id: 'user-1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '+55 11 99999-9999',
    location: 'São Paulo, SP',
    targetRole: 'Desenvolvedor Angular',
    linkedinUrl: 'https://linkedin.com/in/joaosilva',
    cvFilename: 'cv.pdf',
    cvUploadedAt: '2026-06-01T10:00:00Z',
    cvExtractedText: 'Angular, Python, TypeScript',
    isPaused: false,
    pausedUntil: null,
    keywords: ['Angular', 'TypeScript'],
    targetRoles: ['Desenvolvedor Frontend'],
    preferredLocations: ['Remoto', 'São Paulo, SP'],
    scanIntervalHours: 6,
    autoApply: true,
    autoDeleteDays: 30,
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  };

  const mockSuggestions = {
    keywords: ['Python', 'FastAPI'],
    target_roles: ['Desenvolvedor Backend'],
    preferred_locations: ['Curitiba, PR'],
  };

  const mockProfileService = {
    getProfile: vi.fn(() => of(mockProfile)),
    updateProfile: vi.fn(() => of(mockProfile)),
    uploadCV: vi.fn(() => of({ filename: 'cv.pdf' })),
    getCVSuggestions: vi.fn(() => of(mockSuggestions)),
  };

  const mockToastService = {
    success: vi.fn(),
    error: vi.fn(),
  };

  const mockThemeService = {
    themes: [
      { id: 'dark', label: 'Escuro', icon: '🌙' },
      { id: 'light', label: 'Claro', icon: '☀️' },
    ],
    currentTheme: signal('dark'),
    setTheme: vi.fn(),
  };

  beforeEach(async () => {
    mockProfileService.getProfile.mockClear();
    mockProfileService.updateProfile.mockClear();
    mockProfileService.uploadCV.mockClear();
    mockProfileService.getCVSuggestions.mockClear();
    mockToastService.success.mockClear();
    mockToastService.error.mockClear();
    mockThemeService.setTheme.mockClear();

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ProfileService, useValue: mockProfileService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ThemeService, useValue: mockThemeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load profile and suggestions on init', () => {
    fixture.detectChanges();
    expect(mockProfileService.getProfile).toHaveBeenCalled();
    expect(mockProfileService.getCVSuggestions).toHaveBeenCalled();
    expect(component.profileData().name).toBe('João Silva');
    expect(component.keywords()).toContain('Angular');
    expect(component.suggestedKeywords()).toContain('Python');
  });

  it('should add keyword', () => {
    fixture.detectChanges();
    component.newKeyword.set('React');
    component.addKeyword();
    expect(component.keywords()).toContain('React');
    expect(component.newKeyword()).toBe('');
  });

  it('should remove keyword', () => {
    fixture.detectChanges();
    component.removeKeyword('Angular');
    expect(component.keywords()).not.toContain('Angular');
  });

  it('should change theme', () => {
    fixture.detectChanges();
    component.themeService.setTheme('light');
    expect(mockThemeService.setTheme).toHaveBeenCalledWith('light');
  });

  it('should save profile successfully', () => {
    fixture.detectChanges();
    component.updateField('name', 'João Silva Alterado');
    component.saveAll();

    expect(mockProfileService.updateProfile).toHaveBeenCalled();
    expect(mockToastService.success).toHaveBeenCalledWith('Perfil salvo com sucesso!');
  });
});
