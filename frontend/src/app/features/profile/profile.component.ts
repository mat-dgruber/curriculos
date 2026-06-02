import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService, ThemeId } from '../../core/services/theme.service';
import { CandidateProfile, CandidateProfileUpdate } from '../../core/models/profile.model';
import { UserIconComponent } from '../../shared/components/user-icon/user-icon.component';
import { FileTextIconComponent } from '../../shared/components/file-text-icon/file-text-icon.component';
import { CircleCheckIconComponent } from '../../shared/components/circle-check-icon/circle-check-icon.component';
import { CloudUploadIconComponent } from '../../shared/components/cloud-upload-icon/cloud-upload-icon.component';
import { TriangleAlertIconComponent } from '../../shared/components/triangle-alert-icon/triangle-alert-icon.component';
import { CheckIconComponent } from '../../shared/components/check-icon/check-icon.component';
import { TagIconComponent } from '../../shared/components/tag-icon/tag-icon.component';
import { BriefcaseIconComponent } from '../../shared/components/briefcase-icon/briefcase-icon.component';
import { MapPinIconComponent } from '../../shared/components/map-pin-icon/map-pin-icon.component';
import { CogIconComponent } from '../../shared/components/cog-icon/cog-icon.component';
import { GslPageHelp } from '../../shared/components/gsl-page-help/gsl-page-help.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    FormsModule,
    FileUploadModule,
    UserIconComponent,
    FileTextIconComponent,
    CircleCheckIconComponent,
    TriangleAlertIconComponent,
    CheckIconComponent,
    TagIconComponent,
    BriefcaseIconComponent,
    MapPinIconComponent,
    CogIconComponent,
    GslPageHelp,
  ],
  template: `
    <div class="p-4 md:p-8">
      <div class="flex items-center gap-3 mb-6 md:mb-8 animate-fade-in-up">
        <h1 class="text-3xl md:text-4xl font-serif font-bold text-white">Meu Perfil</h1>
        <app-gsl-page-help document="perfil.md" title="Manual: Perfil Profissional" />
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div
            class="lg:col-span-2 bg-dark-surface border border-dark-border rounded-xl p-6 animate-pulse"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                <div>
                  <div class="h-3 bg-dark-border/40 rounded w-20 mb-2"></div>
                  <div class="h-10 bg-dark-border/30 rounded-xl w-full"></div>
                </div>
              }
            </div>
          </div>
          <div class="bg-dark-surface border border-dark-border rounded-xl p-6 animate-pulse">
            <div class="h-32 bg-dark-border/30 rounded-xl mb-4"></div>
            <div class="h-4 bg-dark-border/40 rounded w-1/2"></div>
          </div>
        </div>
      } @else if (error()) {
        <div class="bg-dark-surface border border-error/20 rounded-xl p-8 text-center">
          <app-triangle-alert-icon
            [size]="40"
            [strokeWidth]="1.5"
            class="text-error/60 mx-auto mb-3"
          />
          <p class="text-error font-medium mb-1">{{ error() }}</p>
          <button class="btn-primary text-sm mt-3" (click)="loadProfile()">Tentar novamente</button>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- ═══ Coluna principal (2/3) ═══ -->

          <!-- Dados Pessoais -->
          <div class="lg:col-span-2 bg-dark-surface border border-dark-border rounded-2xl p-6">
            <h3 class="text-white font-semibold mb-5 flex items-center gap-2">
              <app-user-icon [size]="20" [strokeWidth]="1.5" class="text-primary" />
              Dados Pessoais
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider"
                  >Nome completo</label
                >
                <input
                  type="text"
                  class="input-field w-full"
                  placeholder="Seu nome"
                  [ngModel]="profileData().name"
                  (ngModelChange)="updateField('name', $event)"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider"
                  >E-mail</label
                >
                <input
                  type="email"
                  class="input-field w-full"
                  placeholder="seu@email.com"
                  [ngModel]="profileData().email"
                  (ngModelChange)="updateField('email', $event)"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider"
                  >Telefone</label
                >
                <input
                  type="tel"
                  class="input-field w-full"
                  placeholder="+55 11 99999-0000"
                  [ngModel]="profileData().phone"
                  (ngModelChange)="updateField('phone', $event)"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider"
                  >Localização</label
                >
                <input
                  type="text"
                  class="input-field w-full"
                  placeholder="São Paulo, SP"
                  [ngModel]="profileData().location"
                  (ngModelChange)="updateField('location', $event)"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider"
                  >Cargo alvo</label
                >
                <input
                  type="text"
                  class="input-field w-full"
                  placeholder="Ex: Desenvolvedor Angular/Python"
                  [ngModel]="profileData().targetRole"
                  (ngModelChange)="updateField('targetRole', $event)"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider"
                  >LinkedIn</label
                >
                <input
                  type="url"
                  class="input-field w-full"
                  placeholder="https://linkedin.com/in/seuusuario"
                  [ngModel]="profileData().linkedinUrl"
                  (ngModelChange)="updateField('linkedinUrl', $event)"
                />
              </div>
            </div>
          </div>

          <!-- CV Upload Card -->
          <div class="bg-dark-surface border border-dark-border rounded-2xl p-6 flex flex-col">
            <h3 class="text-white font-semibold mb-5 flex items-center gap-2">
              <app-file-text-icon [size]="20" [strokeWidth]="1.5" class="text-accent" />
              Currículo
            </h3>
            @if (profileData().cvFilename) {
              <div class="flex-1 flex flex-col items-center justify-center">
                <div
                  class="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-3"
                >
                  <app-circle-check-icon [size]="32" [strokeWidth]="1.5" class="text-success" />
                </div>
                <p class="text-white text-sm font-medium mb-1">{{ profileData().cvFilename }}</p>
                <p class="text-text-muted text-xs mb-4">PDF carregado</p>
                <p-fileupload
                  #cvUploadCompact
                  mode="advanced"
                  name="cv"
                  accept=".pdf"
                  [maxFileSize]="10485760"
                  [customUpload]="true"
                  [showUploadButton]="false"
                  [showCancelButton]="false"
                  chooseLabel="Substituir CV"
                  chooseIcon="pi pi-refresh"
                  (onSelect)="onFileUpload($event)"
                  styleClass="cv-upload-compact"
                >
                  <ng-template #empty><span></span></ng-template>
                </p-fileupload>
              </div>
            } @else {
              <p-fileupload
                #cvUploadZone
                mode="advanced"
                name="cv"
                accept=".pdf"
                [maxFileSize]="10485760"
                [customUpload]="true"
                [showUploadButton]="false"
                [showCancelButton]="false"
                chooseLabel="Selecionar PDF"
                chooseIcon="pi pi-upload"
                (onSelect)="onFileUpload($event)"
                styleClass="cv-upload-zone"
              >
                <ng-template #empty>
                  <div class="flex flex-col items-center justify-center py-4 cursor-pointer w-full h-full hover:bg-white/[0.01] rounded-2xl transition-all" (click)="cvUploadZone.choose()">
                    <div
                      class="w-14 h-14 rounded-2xl bg-dark-border/30 flex items-center justify-center mb-3"
                    >
                      <i class="pi pi-cloud-upload text-2xl text-text-muted/50"></i>
                    </div>
                    <p class="text-text-main text-sm font-medium mb-1">
                      Arraste seu PDF aqui ou clique para selecionar
                    </p>
                    <p class="text-text-muted text-xs">Apenas PDF · Máximo 10 MB</p>
                  </div>
                </ng-template>
              </p-fileupload>
            }
          </div>

          <!-- ═══ Configurações (largura total) ═══ -->

          <!-- Aparência -->
          <div class="lg:col-span-3 bg-dark-surface border border-dark-border rounded-2xl p-6">
            <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
              </svg>
              Aparência
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              @for (theme of themeService.themes; track theme.id) {
                <button
                  class="p-3 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer theme-preview-card"
                  [style.--theme-primary]="getThemeSwatch(theme.id)[2]"
                  [class.theme-active]="themeService.currentTheme() === theme.id"
                  (click)="themeService.setTheme(theme.id)">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-base">{{ theme.icon }}</span>
                    <span class="text-xs font-medium text-text-main">{{ theme.label }}</span>
                  </div>
                  <div class="flex gap-1">
                    @for (color of getThemeSwatch(theme.id); track color) {
                      <div class="w-4 h-4 rounded-full border border-white/10" [style.background]="color"></div>
                    }
                  </div>
                  @if (themeService.currentTheme() === theme.id) {
                    <div class="mt-2 flex items-center gap-1">
                      <div class="w-3 h-3 rounded-full flex items-center justify-center" [style.backgroundColor]="getThemeSwatch(theme.id)[2]">
                        <svg class="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <span class="text-[10px] font-medium" [style.color]="getThemeSwatch(theme.id)[2]">Ativo</span>
                    </div>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Tags: Keywords, Roles, Locations -->
          <div class="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-5">
            <!-- Palavras-chave -->
            <div class="bg-dark-surface border border-dark-border rounded-2xl p-6 flex flex-col">
              <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
                <app-tag-icon [size]="20" [strokeWidth]="1.5" class="text-primary" />
                Palavras-chave
              </h3>
              <div class="flex flex-wrap gap-2 mb-4">
                @for (kw of keywords(); track kw) {
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/20">
                    {{ kw }}
                    <button (click)="removeKeyword(kw)" class="hover:text-error transition-colors ml-0.5">✕</button>
                  </span>
                } @empty {
                  <span class="text-text-muted text-xs">Nenhuma palavra-chave</span>
                }
              </div>

              <!-- Sugestões de Palavras-chave -->
              <div class="mb-4">
                <span class="text-text-muted text-[10px] uppercase tracking-wider block mb-1.5">Sugestões rápidas</span>
                <div class="flex flex-wrap gap-1.5">
                  @for (suggest of suggestedKeywords(); track suggest) {
                    @if (!keywords().includes(suggest)) {
                      <button
                        (click)="addSuggestedKeyword(suggest)"
                        class="text-[10px] px-2 py-0.5 rounded border border-dark-border hover:border-primary/40 hover:text-primary bg-white/[0.01] transition-all cursor-pointer">
                        + {{ suggest }}
                      </button>
                    }
                  }
                </div>
              </div>

              <div class="flex gap-2 mt-auto">
                <input type="text" class="input-field flex-1 text-sm" placeholder="Nova palavra-chave"
                       [ngModel]="newKeyword()" (ngModelChange)="newKeyword.set($event)" (keyup.enter)="addKeyword()" />
                <button class="btn-secondary text-sm shrink-0" (click)="addKeyword()">+</button>
              </div>
            </div>

            <!-- Cargos alvo -->
            <div class="bg-dark-surface border border-dark-border rounded-2xl p-6 flex flex-col">
              <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
                <app-briefcase-icon [size]="20" [strokeWidth]="1.5" class="text-accent" />
                Cargos alvo
              </h3>
              <div class="flex flex-wrap gap-2 mb-4">
                @for (role of targetRoles(); track role) {
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/20">
                    {{ role }}
                    <button (click)="removeRole(role)" class="hover:text-error transition-colors ml-0.5">✕</button>
                  </span>
                } @empty {
                  <span class="text-text-muted text-xs">Nenhum cargo</span>
                }
              </div>

              <!-- Sugestões de Cargos -->
              <div class="mb-4">
                <span class="text-text-muted text-[10px] uppercase tracking-wider block mb-1.5">Sugestões rápidas</span>
                <div class="flex flex-wrap gap-1.5">
                  @for (suggest of suggestedRoles(); track suggest) {
                    @if (!targetRoles().includes(suggest)) {
                      <button
                        (click)="addSuggestedRole(suggest)"
                        class="text-[10px] px-2 py-0.5 rounded border border-dark-border hover:border-accent/40 hover:text-accent bg-white/[0.01] transition-all cursor-pointer">
                        + {{ suggest }}
                      </button>
                    }
                  }
                </div>
              </div>

              <div class="flex gap-2 mt-auto">
                <input type="text" class="input-field flex-1 text-sm" placeholder="Novo cargo"
                       [ngModel]="newRole()" (ngModelChange)="newRole.set($event)" (keyup.enter)="addRole()" />
                <button class="btn-secondary text-sm shrink-0" (click)="addRole()">+</button>
              </div>
            </div>

            <!-- Localizações -->
            <div class="bg-dark-surface border border-dark-border rounded-2xl p-6 flex flex-col">
              <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
                <app-map-pin-icon [size]="20" [strokeWidth]="1.5" class="text-success" />
                Localizações
              </h3>
              <div class="flex flex-wrap gap-2 mb-4">
                @for (loc of preferredLocations(); track loc) {
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-success/15 text-success border border-success/20">
                    {{ loc }}
                    <button (click)="removeLocation(loc)" class="hover:text-error transition-colors ml-0.5">✕</button>
                  </span>
                } @empty {
                  <span class="text-text-muted text-xs">Nenhuma localização</span>
                }
              </div>

              <!-- Sugestões de Localizações -->
              <div class="mb-4">
                <span class="text-text-muted text-[10px] uppercase tracking-wider block mb-1.5">Sugestões rápidas</span>
                <div class="flex flex-wrap gap-1.5">
                  @for (suggest of suggestedLocations(); track suggest) {
                    @if (!preferredLocations().includes(suggest)) {
                      <button
                        (click)="addSuggestedLocation(suggest)"
                        class="text-[10px] px-2 py-0.5 rounded border border-dark-border hover:border-success/40 hover:text-success bg-white/[0.01] transition-all cursor-pointer">
                        + {{ suggest }}
                      </button>
                    }
                  }
                </div>
              </div>

              <div class="flex gap-2 mt-auto">
                <input type="text" class="input-field flex-1 text-sm" placeholder="Nova localização"
                       [ngModel]="newLocation()" (ngModelChange)="newLocation.set($event)" (keyup.enter)="addLocation()" />
                <button class="btn-secondary text-sm shrink-0" (click)="addLocation()">+</button>
              </div>
            </div>
          </div>

          <!-- Automação -->
          <div class="lg:col-span-3 bg-dark-surface border border-dark-border rounded-2xl p-6">
            <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
              <app-cog-icon [size]="20" [strokeWidth]="1.5" class="text-warning" />
              Automação
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wider"
                  >Frequência de varredura</label
                >
                <select
                  class="input-field w-full"
                  [ngModel]="scanInterval()"
                  (ngModelChange)="scanInterval.set($event)"
                >
                  <option [value]="3">A cada 3 horas</option>
                  <option [value]="6">A cada 6 horas</option>
                  <option [value]="12">A cada 12 horas</option>
                  <option [value]="24">Diariamente</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Excluir vagas após (dias)</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  class="input-field w-full"
                  [ngModel]="autoDeleteDays()"
                  (ngModelChange)="autoDeleteDays.set($event)"
                />
                <span class="text-xs text-text-muted mt-1 block">0 = desativado</span>
              </div>
              <div class="flex items-center">
                <div
                  class="p-3 rounded-xl w-full"
                  style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);"
                >
                  <label class="flex items-center gap-3 cursor-pointer">
                    <div class="relative">
                      <input
                        type="checkbox"
                        class="sr-only peer"
                        [ngModel]="autoApply()"
                        (ngModelChange)="autoApply.set($event)"
                      />
                      <div
                        class="w-10 h-5 bg-dark-border rounded-full peer peer-checked:bg-primary transition-colors"
                      ></div>
                      <div
                        class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"
                      ></div>
                    </div>
                    <div>
                      <span class="text-text-main text-sm font-medium">Candidatura automática</span>
                      <p class="text-text-muted text-xs">Enviar CV para vagas com score ≥ 80%</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══ Botão Salvar ═══ -->
          <div class="lg:col-span-3 flex justify-end gap-3">
            <button class="btn-primary" (click)="saveAll()" [disabled]="saving()">
              @if (saving()) {
                Salvando...
              } @else {
                Salvar Tudo
              }
            </button>
            @if (saved()) {
              <span class="text-success text-sm self-center flex items-center gap-1">
                <app-check-icon [size]="16" [strokeWidth]="2" />
                Tudo salvo!
              </span>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  @ViewChild('cvUploadZone') cvUploadZone!: FileUpload;
  @ViewChild('cvUploadCompact') cvUploadCompact!: FileUpload;

  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  readonly themeService = inject(ThemeService);

  profileData = signal<Partial<CandidateProfile>>({});
  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  error = signal<string | null>(null);

  // Settings (ex-settings component)
  keywords = signal<string[]>([]);
  targetRoles = signal<string[]>([]);
  preferredLocations = signal<string[]>([]);
  scanInterval = signal(6);
  autoApply = signal(false);
  autoDeleteDays = signal(30);

  newKeyword = signal('');
  newRole = signal('');
  newLocation = signal('');

  // Sugestões recomendadas para auxiliar o preenchimento de tags (carregadas via API se houver perfil/CV)
  suggestedKeywords = signal<string[]>(['Python', 'Angular', 'React', 'TypeScript', 'Docker', 'AWS', 'PostgreSQL', 'RxJS', 'Node.js', 'FastAPI']);
  suggestedRoles = signal<string[]>(['Desenvolvedor Fullstack', 'Desenvolvedor Frontend', 'Desenvolvedor Backend', 'Engenheiro de Software', 'Tech Lead']);
  suggestedLocations = signal<string[]>(['Remoto', 'São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Curitiba, PR', 'Híbrido']);

  ngOnInit(): void {
    this.loadProfile();
  }

  getThemeSwatch(themeId: ThemeId): string[] {
    const swatches: Record<ThemeId, string[]> = {
      'dark': ['#0a0f1e', '#111827', '#60a5fa', '#f97316'],
      'light': ['#f1f5f9', '#ffffff', '#2563eb', '#0891b2'],
      'capycro': ['#faf9f6', '#fdfdfd', '#5d8a8c', '#d8704c'],
      'high-contrast': ['#000000', '#111111', '#ffff00', '#00ffff'],
    };
    return swatches[themeId];
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profileData.set(profile);
        this.keywords.set(profile.keywords || []);
        this.targetRoles.set(profile.targetRoles || []);
        this.preferredLocations.set(profile.preferredLocations || []);
        this.scanInterval.set(profile.scanIntervalHours);
        this.autoApply.set(profile.autoApply);
        this.autoDeleteDays.set(profile.autoDeleteDays ?? 30);
        this.loading.set(false);
        this.loadSuggestions();
      },
      error: () => {
        this.error.set('Erro ao carregar perfil.');
        this.loading.set(false);
        this.toast.error('Erro ao carregar perfil.');
      },
    });
  }

  loadSuggestions(): void {
    this.profileService.getCVSuggestions().subscribe({
      next: (res) => {
        this.suggestedKeywords.set(res.keywords || []);
        this.suggestedRoles.set(res.target_roles || []);
        this.suggestedLocations.set(res.preferred_locations || []);
      },
      error: () => {
        // Fallback happens implicitly through default signal values
      }
    });
  }

  updateField(field: keyof CandidateProfileUpdate, value: string): void {
    this.profileData.update((d) => ({ ...d, [field]: value }));
    this.saved.set(false);
  }

  // Tag management
  addKeyword(): void {
    const kw = this.newKeyword().trim();
    if (kw && !this.keywords().includes(kw)) {
      this.keywords.update((k) => [...k, kw]);
      this.newKeyword.set('');
    }
  }

  addSuggestedKeyword(kw: string): void {
    if (!this.keywords().includes(kw)) {
      this.keywords.update((k) => [...k, kw]);
    }
  }

  removeKeyword(kw: string): void {
    this.keywords.update((k) => k.filter((x) => x !== kw));
  }

  addRole(): void {
    const role = this.newRole().trim();
    if (role && !this.targetRoles().includes(role)) {
      this.targetRoles.update((r) => [...r, role]);
      this.newRole.set('');
    }
  }

  addSuggestedRole(role: string): void {
    if (!this.targetRoles().includes(role)) {
      this.targetRoles.update((r) => [...r, role]);
    }
  }

  removeRole(role: string): void {
    this.targetRoles.update((r) => r.filter((x) => x !== role));
  }

  addLocation(): void {
    const loc = this.newLocation().trim();
    if (loc && !this.preferredLocations().includes(loc)) {
      this.preferredLocations.update((l) => [...l, loc]);
      this.newLocation.set('');
    }
  }

  addSuggestedLocation(loc: string): void {
    if (!this.preferredLocations().includes(loc)) {
      this.preferredLocations.update((l) => [...l, loc]);
    }
  }

  removeLocation(loc: string): void {
    this.preferredLocations.update((l) => l.filter((x) => x !== loc));
  }

  // Unified save
  saveAll(): void {
    this.saving.set(true);
    const d = this.profileData();
    const payload: CandidateProfileUpdate = {
      name: d.name ?? undefined,
      email: d.email ?? undefined,
      phone: d.phone ?? undefined,
      location: d.location ?? undefined,
      targetRole: d.targetRole ?? undefined,
      linkedinUrl: d.linkedinUrl ?? undefined,
      keywords: this.keywords(),
      targetRoles: this.targetRoles(),
      preferredLocations: this.preferredLocations(),
      scanIntervalHours: this.scanInterval(),
      autoApply: this.autoApply(),
      autoDeleteDays: this.autoDeleteDays(),
    };
    this.profileService.updateProfile(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        this.toast.success('Perfil salvo com sucesso!');
        setTimeout(() => this.saved.set(false), 3000);
        this.loadSuggestions();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Erro ao salvar perfil.');
      },
    });
  }

  onFileUpload(event: any): void {
    const file = event.files?.[0];
    if (file) {
      this.profileService.uploadCV(file).subscribe({
        next: (res) => {
          this.profileData.update((d) => ({ ...d, cvFilename: res.filename }));
          this.toast.success('Currículo carregado com sucesso!');
          if (this.cvUploadZone) this.cvUploadZone.clear();
          if (this.cvUploadCompact) this.cvUploadCompact.clear();
          this.loadSuggestions();
        },
        error: () => this.toast.error('Erro ao carregar currículo.'),
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.profileService.uploadCV(file).subscribe({
        next: (res) => {
          this.profileData.update((d) => ({ ...d, cvFilename: res.filename }));
          this.toast.success('Currículo carregado com sucesso!');
        },
        error: () => this.toast.error('Erro ao carregar currículo.'),
      });
    }
  }
}
