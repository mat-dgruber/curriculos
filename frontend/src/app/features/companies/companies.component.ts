import { Component, computed, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TriangleAlertIconComponent } from '../../shared/components/triangle-alert-icon/triangle-alert-icon.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { SendIconComponent } from '../../shared/components/send-icon/send-icon.component';
import { CompaniesService } from '../../core/services/companies.service';
import { ToastService } from '../../shared/services/toast.service';
import { FixedCompany, FixedCompanyCreate } from '../../core/models/company.model';
import { environment } from '../../../environments/environment';
import { GslPageHelp } from '../../shared/components/gsl-page-help/gsl-page-help.component';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [
    FormsModule,
    EmptyStateComponent,
    TriangleAlertIconComponent,
    StatusChipComponent,
    RelativeTimePipe,
    SendIconComponent,
    GslPageHelp,
  ],
  template: `
    <div class="p-4 md:p-6 relative overflow-hidden min-h-screen">
      <!-- Ambient background blobs -->
      <div class="blob-orange -top-12 -right-12 opacity-25 pointer-events-none"></div>
      <div class="blob-teal bottom-10 -left-10 opacity-25 pointer-events-none"></div>
      <div class="blob-gold top-1/2 left-1/3 opacity-15 pointer-events-none"></div>

      <div class="relative z-10">
        <div class="flex items-center justify-between mb-4 md:mb-6">
          <div class="flex items-center gap-3">
            <h1 class="text-3xl md:text-4xl font-serif font-bold text-white animate-fade-in-up">
              Empresas Fixas
            </h1>
            <app-gsl-page-help
              document="empresas-fixas.md"
              title="Manual: Empresas Fixas"
              class="animate-fade-in-up"
            />
          </div>
          <button (click)="toggleFormBtn()" class="btn-primary animate-fade-in-up">
            @if (showForm()) {
              Fechar
            } @else {
              + Nova Empresa
            }
          </button>
        </div>

        @if (showForm()) {
          <div class="organic-card p-6 mb-6 animate-fade-in-up stagger-1">
            <h3 class="text-xl font-serif font-semibold text-white mb-4">
              @if (editingCompany()) {
                Editar Empresa
              } @else {
                Cadastrar Empresa
              }
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col">
                <label class="text-xs text-text-muted mb-1 pl-1 font-medium">Nome da Empresa</label>
                <input
                  type="text"
                  placeholder="Ex: Google, Stripe..."
                  class="input-field"
                  list="company-suggestions"
                  [class.!border-error/50]="formSubmitted() && formNameError()"
                  [ngModel]="formName()"
                  (ngModelChange)="onNameChange($event)"
                />
                <datalist id="company-suggestions">
                  @for (c of famousCompanies; track c.name) {
                    <option [value]="c.name"></option>
                  }
                </datalist>
                @if (formSubmitted() && formNameError()) {
                  <span class="text-[11px] text-error mt-1 pl-1">{{ formNameError() }}</span>
                }
              </div>

              <div class="flex flex-col">
                <label class="text-xs text-text-muted mb-1 pl-1 font-medium"
                  >URL do Formulário / Carreiras</label
                >
                <input
                  type="url"
                  placeholder="https://exemplo.com/careers"
                  class="input-field"
                  [class.!border-error/50]="formSubmitted() && formUrlError()"
                  [ngModel]="formUrl()"
                  (ngModelChange)="formUrl.set($event)"
                />
                @if (formSubmitted() && formUrlError()) {
                  <span class="text-[11px] text-error mt-1 pl-1">{{ formUrlError() }}</span>
                }
              </div>

              <div class="flex flex-col">
                <label class="text-xs text-text-muted mb-1 pl-1 font-medium"
                  >E-mail de Contato (opcional se houver URL)</label
                >
                <input
                  type="email"
                  placeholder="recrutamento@empresa.com"
                  class="input-field"
                  [class.!border-error/50]="formSubmitted() && formEmailError()"
                  [ngModel]="formEmail()"
                  (ngModelChange)="formEmail.set($event)"
                />
                @if (formSubmitted() && formEmailError()) {
                  <span class="text-[11px] text-error mt-1 pl-1">{{ formEmailError() }}</span>
                }
              </div>

              <div class="flex flex-col">
                <label class="text-xs text-text-muted mb-1 pl-1 font-medium"
                  >Intervalo de Reenvio (dias)</label
                >
                <input
                  type="number"
                  placeholder="Ex: 30"
                  class="input-field"
                  min="7"
                  max="90"
                  [class.!border-error/50]="formSubmitted() && formIntervalError()"
                  [ngModel]="formInterval()"
                  (ngModelChange)="formInterval.set($event)"
                />
                @if (formSubmitted() && formIntervalError()) {
                  <span class="text-[11px] text-error mt-1 pl-1">{{ formIntervalError() }}</span>
                }
              </div>

              <div class="flex flex-col md:col-span-2">
                <label class="text-xs text-text-muted mb-1 pl-1 font-medium"
                  >Notas e Anotações (opcional)</label
                >
                <textarea
                  placeholder="Informações sobre o processo seletivo, requisitos especiais, etc..."
                  class="input-field min-h-[90px] py-2 resize-y"
                  [ngModel]="formNotes()"
                  (ngModelChange)="formNotes.set($event)"
                ></textarea>
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button class="btn-primary" (click)="saveCompany()" [disabled]="saving()">
                @if (saving()) {
                  Salvando...
                } @else {
                  Salvar
                }
              </button>
              <button class="btn-secondary" (click)="resetForm()">Cancelar</button>
            </div>
          </div>
        }

        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (i of [1, 2, 3, 4]; track i; let idx = $index) {
              <div
                [class]="
                  'organic-card p-5 animate-pulse animate-fade-in-up stagger-' + ((idx % 6) + 1)
                "
              >
                <div class="h-5 bg-dark-border/60 rounded-md w-1/2 mb-3"></div>
                <div class="h-3 bg-dark-border/40 rounded-md w-3/4 mb-2"></div>
                <div class="h-3 bg-dark-border/30 rounded-md w-1/3 mb-4"></div>
                <div class="flex gap-2">
                  <div class="h-8 w-20 bg-dark-border/30 rounded-lg"></div>
                  <div class="h-8 w-20 bg-dark-border/30 rounded-lg"></div>
                </div>
              </div>
            }
          </div>
        } @else if (error()) {
          <div class="organic-card p-8 text-center animate-fade-in-up">
            <div class="text-error/60 flex justify-center mb-3">
              <app-triangle-alert-icon [size]="40" [strokeWidth]="1.5" />
            </div>
            <p class="text-error font-serif font-semibold mb-1">{{ error() }}</p>
            <p class="text-text-muted text-sm mb-4">Tente novamente ou verifique sua conexão.</p>
            <button class="btn-primary text-sm" (click)="loadCompanies()">Tentar novamente</button>
          </div>
        } @else if (companies().length === 0) {
          <app-empty-state
            message="Nenhuma empresa fixa cadastrada."
            description="Adicione empresas para envio recorrente mensal de currículos."
            icon="inbox"
          />
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (company of companies(); track company.id; let idx = $index) {
              <div
                [class]="
                  'organic-card p-5 flex flex-col justify-between min-h-[260px] animate-fade-in-up stagger-' +
                  ((idx % 6) + 1) +
                  (company.status === 'Respondeu'
                    ? ' border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-dark-bg/60 to-dark-bg/60 shadow-lg shadow-amber-500/5 relative overflow-hidden'
                    : '')
                "
              >
                @if (company.status === 'Respondeu') {
                  <div
                    class="absolute top-0 right-0 px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg flex items-center gap-1 z-10"
                  >
                    <span>🎉 Retorno!</span>
                  </div>
                }

                <div>
                  <div class="flex items-start justify-between mb-3 gap-2">
                    <div class="flex flex-col gap-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <h3
                          class="text-xl font-serif font-semibold text-white truncate max-w-[160px]"
                          [title]="company.name"
                        >
                          {{ company.name }}
                        </h3>
                        <span
                          [class]="
                            'text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ' +
                            getPlatformClass(getPlatform(company.applicationUrl))
                          "
                        >
                          {{ getPlatform(company.applicationUrl) }}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <app-status-chip [status]="company.status" />

                      <!-- Elegant Mini Toolbar for Management -->
                      <div
                        class="flex items-center bg-white/5 border border-white/10 rounded-full px-1.5 py-0.5 gap-1 shadow-inner"
                      >
                        <button
                          (click)="toggleCompany(company)"
                          class="p-1 rounded-full text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                          [title]="
                            company.isActive
                              ? 'Pausar reenvio automático'
                              : 'Ativar reenvio automático'
                          "
                          [disabled]="company.status === 'Respondeu'"
                        >
                          @if (company.isActive) {
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <rect x="14" y="4" width="4" height="16" rx="1" />
                              <rect x="6" y="4" width="4" height="16" rx="1" />
                            </svg>
                          } @else {
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <polygon points="6 3 20 12 6 21 6 3" />
                            </svg>
                          }
                        </button>
                        <button
                          (click)="editCompany(company)"
                          class="p-1 rounded-full text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                          title="Editar empresa"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                        <button
                          (click)="deleteCompany(company)"
                          class="p-1 rounded-full text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remover empresa"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  @if (company.applicationUrl) {
                    <p class="text-xs text-text-muted mb-3 truncate" [title]="company.applicationUrl">
                      {{ company.applicationUrl }}
                    </p>
                  } @else if (company.email) {
                    <p class="text-xs text-text-muted mb-3 truncate" [title]="company.email">
                      ✉️ {{ company.email }}
                    </p>
                  }

                  @if (company.notes) {
                    <p
                      class="text-xs text-text-muted/80 bg-white/5 border border-white/5 rounded-lg p-2.5 mb-3 max-h-[60px] overflow-y-auto italic"
                    >
                      "{{ company.notes }}"
                    </p>
                  }

                  <div class="flex items-center gap-4 text-[11px] text-text-muted mb-2">
                    <span>Intervalo: {{ company.intervalDays }} dias</span>
                    <span>Enviados: {{ company.totalSent }}</span>
                  </div>
                  <div class="flex items-center gap-4 text-[11px] text-text-muted mb-4 pb-3">
                    @if (company.lastSentAt) {
                      <span>Último: {{ company.lastSentAt | relativeTime }}</span>
                    }
                    @if (company.nextSendAt) {
                      <span>Próximo: {{ company.nextSendAt | relativeTime }}</span>
                    }
                  </div>
                </div>

                <div class="flex gap-2 items-center w-full pt-3 border-t border-white/5">
                  <button
                    class="btn-secondary text-xs flex items-center gap-1.5 text-amber-400 hover:bg-amber-400/10 border-amber-500/20 py-1.5 px-3"
                    (click)="testAutomation(company)"
                    [disabled]="
                      testingId() === company.id ||
                      !company.isActive ||
                      company.status === 'Respondeu'
                    "
                    title="Disparar robô imediatamente para testar envio de currículo"
                  >
                    @if (testingId() === company.id) {
                      <svg
                        class="animate-spin h-3.5 w-3.5 text-amber-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Testando...
                    } @else {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="m12 14 4-4-4-4" />
                        <path d="M4 20h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4" />
                        <path d="M4 14a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Testar Robô
                    }
                  </button>

                  @if (company.totalSent > 0) {
                    <button
                      class="btn-secondary text-xs flex items-center gap-1.5 text-cyan-400 hover:bg-cyan-400/10 border-cyan-500/20 py-1.5 px-3"
                      (click)="viewLastScreenshot(company)"
                      title="Ver foto do último envio do robô"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"
                        />
                      </svg>
                      Ver Print
                    </button>
                  }

                  <button
                    class="btn-secondary text-xs flex items-center gap-1.5 ml-auto text-accent hover:bg-accent/10 border-accent/20 py-1.5 px-3 disabled:opacity-30 disabled:cursor-not-allowed"
                    (click)="recordSent(company)"
                    [disabled]="!company.isActive || company.status === 'Respondeu'"
                    title="Registrar que você fez um envio manual hoje"
                  >
                    <app-send-icon [size]="12" [strokeWidth]="2" />
                    Registrar Envio
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Screenshot Modal -->
    @if (activeScreenshot()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-300 animate-fade-in"
        (click)="closeScreenshotModal()"
      >
        <div
          class="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl max-w-4xl w-full p-5 relative flex flex-col max-h-[90vh] shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <button
            (click)="closeScreenshotModal()"
            class="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-hover)] p-2 rounded-full transition-all border border-[var(--bg-border)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          <h3 class="text-xl font-serif font-semibold text-[var(--text-primary)] mb-2 pr-10">
            Última Tentativa de Envio
          </h3>
          <div class="flex items-center gap-4 text-xs text-[var(--text-secondary)] mb-4">
            <span class="flex items-center gap-1.5"
              >Status: <app-status-chip [status]="activeScreenshot()!.status"
            /></span>
            @if (activeScreenshot()!.sentAt) {
              <span>Data: {{ activeScreenshot()!.sentAt | relativeTime }}</span>
            }
          </div>

          <div
            class="flex-1 overflow-auto rounded-lg border border-[var(--bg-border)] bg-[var(--bg-main)] p-2 flex items-center justify-center min-h-[300px]"
          >
            <img
              [src]="activeScreenshot()!.url"
              class="max-w-full max-h-[65vh] object-contain rounded-md shadow-lg"
              alt="Último print de envio"
            />
          </div>
        </div>
      </div>
    }
  `,
})
export class CompaniesComponent implements OnInit {
  private readonly companiesService = inject(CompaniesService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  companies = signal<FixedCompany[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  saving = signal(false);
  showForm = signal(false);

  editingCompany = signal<FixedCompany | null>(null);
  formSubmitted = signal(false);

  formName = signal('');
  formUrl = signal('');
  formEmail = signal('');
  formInterval = signal(30);
  formNotes = signal('');

  testingId = signal<string | null>(null);
  activeScreenshot = signal<{ url: string; status: string; sentAt: string | null } | null>(null);

  famousCompanies = [
    { name: 'Google', url: 'https://www.google.com/about/careers/applications/' },
    { name: 'Stripe', url: 'https://stripe.com/jobs' },
    { name: 'Gupy', url: 'https://portal.gupy.io/' },
    { name: 'Greenhouse', url: 'https://boards.greenhouse.io/' },
    { name: 'Lever', url: 'https://jobs.lever.co/' },
    { name: 'Meta', url: 'https://www.metacareers.com/' },
    { name: 'Netflix', url: 'https://jobs.netflix.com/' },
    { name: 'Amazon', url: 'https://www.amazon.jobs/' },
    { name: 'Microsoft', url: 'https://careers.microsoft.com/' },
    { name: 'Nubank', url: 'https://nubank.com.br/carreiras/' },
    { name: 'iFood', url: 'https://carreiras.ifood.com.br/' },
    { name: 'Mercado Livre', url: 'https://vagas.mercadolivre.com.br/' },
  ];

  formNameError = computed(() => {
    if (!this.formName().trim()) return 'O nome da empresa é obrigatório.';
    return null;
  });

  formUrlError = computed(() => {
    const url = this.formUrl().trim();
    if (!url) {
      if (!this.formEmail().trim()) {
        return 'Informe uma URL de formulário ou um e-mail de contato.';
      }
      return null;
    }
    try {
      new URL(url);
      return null;
    } catch (_) {
      return 'A URL informada não é válida (deve conter http:// ou https://).';
    }
  });

  formEmailError = computed(() => {
    const emailStr = this.formEmail().trim();
    if (!emailStr) {
      if (!this.formUrl().trim()) {
        return 'Informe uma URL de formulário ou um e-mail de contato.';
      }
      return null;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return 'O e-mail informado não é válido.';
    }
    return null;
  });

  formIntervalError = computed(() => {
    const val = this.formInterval();
    if (val === null || val === undefined) return 'O intervalo é obrigatório.';
    if (val < 7 || val > 90) return 'O intervalo de dias deve ser entre 7 e 90 dias.';
    return null;
  });

  isFormValid = computed(() => {
    return !this.formNameError() && !this.formUrlError() && !this.formEmailError() && !this.formIntervalError();
  });

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loading.set(true);
    this.error.set(null);
    this.companiesService
      .getCompanies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.companies.set(res.items);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Erro ao carregar empresas.');
          this.toast.error('Erro ao carregar empresas.');
        },
      });
  }

  toggleFormBtn(): void {
    if (this.showForm()) {
      this.resetForm();
    } else {
      this.resetForm();
      this.showForm.set(true);
    }
  }

  editCompany(company: FixedCompany): void {
    this.editingCompany.set(company);
    this.formName.set(company.name);
    this.formUrl.set(company.applicationUrl || '');
    this.formEmail.set(company.email || '');
    this.formInterval.set(company.intervalDays);
    this.formNotes.set(company.notes || '');
    this.showForm.set(true);
    this.formSubmitted.set(false);
  }

  resetForm(): void {
    this.editingCompany.set(null);
    this.formName.set('');
    this.formUrl.set('');
    this.formEmail.set('');
    this.formInterval.set(30);
    this.formNotes.set('');
    this.showForm.set(false);
    this.formSubmitted.set(false);
  }

  onNameChange(val: string): void {
    this.formName.set(val);
    if (!this.formUrl().trim()) {
      const match = this.famousCompanies.find(
        (c) => c.name.toLowerCase() === val.toLowerCase().trim(),
      );
      if (match) {
        this.formUrl.set(match.url);
      }
    }
  }

  saveCompany(): void {
    this.formSubmitted.set(true);
    if (!this.isFormValid()) {
      this.toast.error('Por favor, corrija os erros no formulário.');
      return;
    }

    this.saving.set(true);
    const editing = this.editingCompany();

    if (editing) {
      const data = {
        name: this.formName().trim(),
        applicationUrl: this.formUrl().trim() || null,
        email: this.formEmail().trim() || null,
        intervalDays: this.formInterval(),
        notes: this.formNotes().trim() || undefined,
      };
      this.companiesService
        .updateCompany(editing.id, data)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.resetForm();
            this.loadCompanies();
            this.toast.success('Empresa atualizada com sucesso!');
          },
          error: () => {
            this.saving.set(false);
            this.toast.error('Erro ao atualizar empresa.');
          },
        });
    } else {
      const data: FixedCompanyCreate = {
        name: this.formName().trim(),
        applicationUrl: this.formUrl().trim() || null,
        email: this.formEmail().trim() || null,
        intervalDays: this.formInterval(),
        notes: this.formNotes().trim() || undefined,
      };
      this.companiesService
        .createCompany(data)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.resetForm();
            this.loadCompanies();
            this.toast.success('Empresa cadastrada com sucesso!');
          },
          error: () => {
            this.saving.set(false);
            this.toast.error('Erro ao cadastrar empresa.');
          },
        });
    }
  }

  toggleCompany(company: FixedCompany): void {
    this.companiesService
      .toggleCompany(company.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadCompanies();
          this.toast.success(company.isActive ? 'Empresa pausada.' : 'Empresa ativada.');
        },
        error: () => this.toast.error('Erro ao alterar status da empresa.'),
      });
  }

  deleteCompany(company: FixedCompany): void {
    if (!confirm(`Remover "${company.name}"?`)) return;
    this.companiesService
      .deleteCompany(company.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadCompanies();
          this.toast.success('Empresa removida.');
        },
        error: () => this.toast.error('Erro ao remover empresa.'),
      });
  }

  recordSent(company: FixedCompany): void {
    this.companiesService
      .recordSent(company.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadCompanies();
          this.toast.success(`Envio registrado com sucesso para ${company.name}!`);
        },
        error: () => this.toast.error('Erro ao registrar envio.'),
      });
  }

  getPlatform(url: string | null): string {
    if (!url) return 'E-mail';
    const lowerUrl = url.toLowerCase();
    if (
      lowerUrl.includes('gupy.io') ||
      lowerUrl.includes('gupy.com') ||
      lowerUrl.includes('kenoby')
    )
      return 'Gupy';
    if (lowerUrl.includes('greenhouse.io')) return 'Greenhouse';
    if (lowerUrl.includes('lever.co')) return 'Lever';
    if (lowerUrl.includes('workable.com')) return 'Workable';
    return 'Genérica';
  }

  getPlatformClass(platform: string): string {
    switch (platform) {
      case 'Gupy':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'Greenhouse':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Lever':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'E-mail':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    }
  }

  testAutomation(company: FixedCompany): void {
    this.testingId.set(company.id);
    this.toast.info(`Iniciando robô para testar a candidatura em ${company.name}...`);
    this.companiesService
      .testAutomation(company.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.testingId.set(null);
          if (res.success) {
            this.toast.success(`Automação concluída com sucesso para ${company.name}!`);
          } else {
            this.toast.warning(`Automação terminou com aviso: ${res.errorMessage || res.status}`);
          }
          this.loadCompanies();
        },
        error: (err) => {
          this.testingId.set(null);
          const errMsg = err.error?.detail || 'Erro desconhecido';
          this.toast.error(`Erro ao rodar automação: ${errMsg}`);
        },
      });
  }

  viewLastScreenshot(company: FixedCompany): void {
    this.companiesService
      .getLastScreenshot(company.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const screenshotUrl = `${environment.apiUrl}/screenshots/${res.screenshotPath}`;
          this.activeScreenshot.set({
            url: screenshotUrl,
            status: res.status,
            sentAt: res.sentAt,
          });
        },
        error: () => {
          this.toast.error('Nenhum screenshot disponível para esta empresa.');
        },
      });
  }

  closeScreenshotModal(): void {
    this.activeScreenshot.set(null);
  }
}
