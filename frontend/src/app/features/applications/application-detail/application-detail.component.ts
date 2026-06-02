import { Component, computed, inject, input, signal, effect, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApplicationsService } from '../../../core/services/applications.service';
import { JobsService } from '../../../core/services/jobs.service';
import { CompaniesService } from '../../../core/services/companies.service';
import { Job } from '../../../core/models/job.model';
import { FixedCompany } from '../../../core/models/company.model';
import { ToastService } from '../../../core/services/toast.service';
import { Application, VALID_STATUS_TRANSITIONS, ApplicationStatus } from '../../../core/models/application.model';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { TriangleAlertIconComponent } from '../../../shared/components/triangle-alert-icon/triangle-alert-icon.component';
import { ChevronLeftIconComponent } from '../../../shared/components/chevron-left-icon/chevron-left-icon.component';
import { ClockIconComponent } from '../../../shared/components/clock-icon/clock-icon.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    StatusChipComponent,
    RelativeTimePipe,
    TriangleAlertIconComponent,
    ChevronLeftIconComponent,
    ClockIconComponent,
  ],
  template: `
    <div class="p-4 md:p-6">
      <!-- Back Button -->
      <a routerLink="/applications" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-white transition-colors mb-6 glass-v2 rounded-full px-4 py-2">
        <app-chevron-left-icon [size]="16" [strokeWidth]="2" />
        Voltar para candidaturas
      </a>

      @if (loading()) {
        <!-- Skeleton -->
        <div class="space-y-6">
          <div class="h-10 bg-dark-border/40 rounded-xl w-1/3 animate-pulse"></div>
          <div class="organic-card p-5 space-y-4 min-h-[200px]">
            <div class="h-3 w-24 bg-dark-border/40 rounded-lg animate-pulse"></div>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="h-3 w-14 bg-dark-border/40 rounded-lg animate-pulse"></div>
                <div class="h-6 w-20 bg-dark-border/40 rounded-full animate-pulse"></div>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-3 w-14 bg-dark-border/40 rounded-lg animate-pulse"></div>
                <div class="h-6 w-32 bg-dark-border/40 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      } @else if (error()) {
        <!-- Error State -->
        <div class="bg-dark-surface/80 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center">
          <div class="flex justify-center mb-4 text-red-400">
            <app-triangle-alert-icon [size]="48" [strokeWidth]="2" />
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">Erro ao carregar candidatura</h3>
          <p class="text-text-muted text-sm">{{ error() }}</p>
          <button class="btn-secondary mt-4 text-sm" (click)="loadApplication()">Tentar novamente</button>
        </div>
      } @else if (application(); as app) {
        <!-- Application Detail -->
        <div class="space-y-6">
          <!-- Header -->
          <div class="flex items-start justify-between animate-fade-in-up">
            <div>
              <h1 class="text-2xl md:text-3xl font-serif font-bold text-white mb-2">{{ app.jobTitle }}</h1>
              <p class="text-sm text-text-muted">{{ app.companyName }}</p>
            </div>
            @if (job()?.url) {
              <a
                [href]="job()!.url"
                target="_blank"
                rel="noopener noreferrer"
                (click)="trackClick()"
                class="btn-primary text-sm shrink-0 inline-flex items-center gap-1.5 px-4 py-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                Ver vaga
              </a>
            } @else if (app.isRecurring && company()?.applicationUrl) {
              <a
                [href]="company()!.applicationUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-primary text-sm shrink-0 inline-flex items-center gap-1.5 px-4 py-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                Ver link de envio
              </a>
            } @else if (app.jobId !== 'recurring' && !app.isRecurring) {
              <a
                [routerLink]="['/jobs', app.jobId]"
                class="btn-secondary text-sm shrink-0 inline-flex items-center gap-1 px-4 py-2"
              >
                Ver vaga local
              </a>
            }
          </div>

          <!-- Bento Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left: Info -->
            <div class="organic-card p-5 space-y-4">
              <h3 class="text-xs font-semibold text-text-muted/60 uppercase tracking-wider">Informacoes</h3>
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <span class="text-xs text-text-muted/60 w-20">Status</span>
                  <app-status-chip [status]="app.status" />
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-text-muted/60 w-20">Tipo</span>
                  @if (app.isRecurring) {
                    <span class="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary">Recorrente</span>
                  } @else {
                    <span class="text-xs px-3 py-1 rounded-full bg-dark-bg text-text-muted border border-dark-border">Unico</span>
                  }
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-text-muted/60 w-20">Enviado</span>
                  @if (app.sentAt) {
                    <span class="text-xs text-text-main">{{ app.sentAt | relativeTime }}</span>
                  } @else {
                    <span class="text-xs text-warning">Pendente</span>
                  }
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-text-muted/60 w-20">Criado</span>
                  <span class="text-xs text-text-muted">{{ app.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="flex items-center gap-3 border-t border-dark-border/40 pt-2 mt-2">
                  <span class="text-xs text-text-muted/60 w-20">Cliques</span>
                  <span class="text-xs font-semibold text-text-main flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                    {{ app.clickCount }} clique{{ app.clickCount === 1 ? '' : 's' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: Notes / Error / Screenshot -->
            <div class="organic-card p-5 space-y-4">
              <h3 class="text-xs font-semibold text-text-muted/60 uppercase tracking-wider">Detalhes</h3>

              @if (app.errorMessage) {
                <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p class="text-xs font-semibold text-red-400 mb-1">Erro</p>
                  <p class="text-sm text-red-300/80">{{ app.errorMessage }}</p>
                </div>
              }

              @if (app.notes) {
                <div>
                  <p class="text-xs font-semibold text-text-muted/60 mb-1">Notas</p>
                  <p class="text-sm text-white/80 whitespace-pre-line">{{ app.notes }}</p>
                </div>
              }

              @if (screenshotUrl()) {
                <div>
                  <p class="text-xs font-semibold text-text-muted/60 mb-1">Screenshot</p>
                  <a
                    [href]="screenshotUrl()"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs text-primary hover:underline"
                  >
                    Ver screenshot
                  </a>
                </div>
              }

              @if (!app.errorMessage && !app.notes && !app.screenshotPath) {
                <p class="text-sm text-text-muted/60">Nenhum detalhe adicional registrado.</p>
              }
            </div>
          </div>

          <!-- Timestamps -->
          <div class="flex items-center gap-2 text-xs text-text-muted/60">
            <app-clock-icon [size]="14" [strokeWidth]="2" />
            <span>Criado em {{ app.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
            @if (app.updatedAt !== app.createdAt) {
              <span class="text-text-muted/30">&middot;</span>
              <span>Atualizado em {{ app.updatedAt | date: 'dd/MM/yyyy HH:mm' }}</span>
            }
          </div>

          <!-- Status Update Actions -->
          <div class="organic-card p-5">
            <h3 class="text-xs font-semibold text-text-muted/60 uppercase tracking-wider mb-3">Alterar Status</h3>
            <div class="flex flex-wrap gap-2">
              @for (status of availableStatuses(); track status) {
                <button
                  class="text-sm px-4 py-2 rounded-full transition-all"
                  [class]="status === app.status
                    ? 'bg-primary/20 text-primary border border-primary/30 cursor-default'
                    : 'glass-v2 text-text-muted hover:text-white hover:border-white/20'"
                  [disabled]="status === app.status || updatingStatus()"
                  (click)="updateStatus(status)"
                >
                  {{ status }}
                </button>
              }
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="organic-card p-5 border border-red-500/20">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xs font-semibold text-red-400/80 uppercase tracking-wider">Arquivar candidatura</h3>
                <p class="text-xs text-text-muted/60 mt-1">Remove esta candidatura da lista ativa.</p>
              </div>
              <button
                class="text-sm px-4 py-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                [disabled]="deleting()"
                (click)="confirmDelete()"
              >
                @if (deleting()) {
                  Arquivando...
                } @else {
                  Arquivar
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ApplicationDetailComponent {
  private readonly applicationsService = inject(ApplicationsService);
  private readonly jobsService = inject(JobsService);
  private readonly companiesService = inject(CompaniesService);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);

  id = input<string>('');

  application = signal<Application | null>(null);
  job = signal<Job | null>(null);
  company = signal<FixedCompany | null>(null);
  loading = signal(false);
  error = signal('');
  updatingStatus = signal(false);
  deleting = signal(false);

  screenshotUrl = computed<string | null>(() => {
    const path = this.application()?.screenshotPath;
    if (!path) return null;

    // Extrai o nome do arquivo se for um caminho completo
    const filename = path.includes('/') 
      ? path.substring(path.lastIndexOf('/') + 1) 
      : path.includes('\\') 
        ? path.substring(path.lastIndexOf('\\') + 1) 
        : path;

    const fullUrl = `${environment.apiUrl}/screenshots/${filename}`;

    // Validação estrita para aceitar apenas protocolos da Web padrão ou caminhos locais seguros
    const isSafe = /^(https?:\/\/|\/|assets\/)/i.test(fullUrl);
    if (!isSafe) {
      console.warn('Screenshot path com protocolo potencialmente inseguro detectado.');
      return null;
    }

    // Sanitiza contra XSS nativamente
    return this.sanitizer.sanitize(SecurityContext.URL, fullUrl);
  });

  private readonly _appEffect = effect(() => {
    const id = this.id();
    if (id) {
      this.loadApplication();
    } else {
      this.application.set(null);
      this.error.set('');
    }
  });

  availableStatuses = computed(() => {
    const app = this.application();
    if (!app) return [];
    return VALID_STATUS_TRANSITIONS[app.status] || [];
  });

  loadApplication(): void {
    const id = this.id();
    if (!id) return;

    this.loading.set(true);
    this.error.set('');

    this.applicationsService.getApplication(id).subscribe({
      next: (app) => {
        this.application.set(app);

        if (app.jobId === 'recurring' || app.isRecurring) {
          this.job.set(null);
          if (app.fixedCompanyId) {
            this.companiesService.getCompanies({ perPage: 1000 }).subscribe({
              next: (res) => {
                const found = res.items.find(c => c.id === app.fixedCompanyId);
                if (found) {
                  this.company.set(found);
                }
                this.loading.set(false);
              },
              error: () => {
                this.loading.set(false);
              }
            });
          } else {
            this.loading.set(false);
          }
        } else {
          // Carrega também a vaga associada para extrair a URL de origem
          this.jobsService.getJob(app.jobId).subscribe({
            next: (job) => {
              this.job.set(job);
              this.loading.set(false);
            },
            error: () => {
              this.loading.set(false);
            }
          });
        }
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Nao foi possivel carregar os detalhes da candidatura.');
        this.loading.set(false);
      },
    });
  }

  updateStatus(status: string): void {
    const app = this.application();
    if (!app || status === app.status) return;

    this.updatingStatus.set(true);
    this.applicationsService.updateStatus(app.id, { status: status as ApplicationStatus }).subscribe({
      next: (updated) => {
        this.application.set(updated);
        this.updatingStatus.set(false);
        this.toast.success(`Status alterado para "${status}".`);
      },
      error: (err) => {
        this.updatingStatus.set(false);
        this.toast.error(err?.error?.detail || 'Erro ao alterar status.');
      },
    });
  }

  confirmDelete(): void {
    const app = this.application();
    if (!app) return;
    if (!confirm('Tem certeza que deseja arquivar esta candidatura?')) return;

    this.deleting.set(true);
    this.applicationsService.deleteApplication(app.id).subscribe({
      next: () => {
        this.toast.success('Candidatura arquivada.');
        this.deleting.set(false);
        window.history.back();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(err?.error?.detail || 'Erro ao arquivar candidatura.');
      },
    });
  }

  trackClick(): void {
    const app = this.application();
    if (!app) return;

    this.applicationsService.registerClick(app.id).subscribe({
      next: (updated) => {
        this.application.set(updated);
      },
      error: () => {
        // Silencioso para não obstruir o redirecionamento do usuário
      }
    });
  }
}
