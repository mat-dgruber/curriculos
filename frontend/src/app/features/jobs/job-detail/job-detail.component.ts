import { Component, computed, inject, input, signal, effect, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobsService } from '../../../core/services/jobs.service';
import { ApplicationsService } from '../../../core/services/applications.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Job } from '../../../core/models/job.model';
import { CompaniesService } from '../../../core/services/companies.service';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { SearchIconComponent } from '../../../shared/components/search-icon/search-icon.component';
import { SendIconComponent } from '../../../shared/components/send-icon/send-icon.component';
import { ExternalLinkIconComponent } from '../../../shared/components/external-link-icon/external-link-icon.component';
import { ClockIconComponent } from '../../../shared/components/clock-icon/clock-icon.component';
import { CheckIconComponent } from '../../../shared/components/check-icon/check-icon.component';
import { TriangleAlertIconComponent } from '../../../shared/components/triangle-alert-icon/triangle-alert-icon.component';
import { SpinnerIconComponent } from '../../../shared/components/spinner-icon/spinner-icon.component';
import { ChevronLeftIconComponent } from '../../../shared/components/chevron-left-icon/chevron-left-icon.component';
import { PlatformClassPipe } from '../../../shared/pipes/platform-class.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    FormsModule,
    PlatformClassPipe,
    ScoreBadgeComponent,
    StatusChipComponent,
    SearchIconComponent,
    SendIconComponent,
    ExternalLinkIconComponent,
    ClockIconComponent,
    CheckIconComponent,
    TriangleAlertIconComponent,
    SpinnerIconComponent,
    ChevronLeftIconComponent,
  ],
  template: `
    <div class="p-6">
      <!-- Back Button (pill style) -->
      <a
        routerLink="/jobs"
        class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-white transition-colors mb-6 glass-v2 rounded-full px-4 py-2"
      >
        <app-chevron-left-icon [size]="16" [strokeWidth]="2" />
        Voltar para vagas
      </a>

      @if (loading()) {
        <!-- Skeleton Loading -->
        <div class="space-y-6">
          <div class="h-10 bg-dark-border/40 rounded-xl w-1/3 animate-pulse"></div>
          <div class="flex gap-2">
            <div class="h-7 bg-dark-border/30 rounded-full w-32 animate-pulse"></div>
            <div class="h-7 bg-dark-border/30 rounded-full w-28 animate-pulse"></div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="organic-card p-5 space-y-4 min-h-[200px]">
              <div class="h-3 w-24 bg-dark-border/40 rounded-lg animate-pulse"></div>
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <div class="h-3 w-14 bg-dark-border/40 rounded-lg animate-pulse"></div>
                  <div class="h-6 w-12 bg-dark-border/40 rounded-full animate-pulse"></div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="h-3 w-14 bg-dark-border/40 rounded-lg animate-pulse"></div>
                  <div class="h-6 w-20 bg-dark-border/40 rounded-full animate-pulse"></div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="h-3 w-14 bg-dark-border/40 rounded-lg animate-pulse"></div>
                  <div class="h-6 w-16 bg-dark-border/40 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
            <div class="organic-card p-5 space-y-3 min-h-[200px]">
              <div class="h-3 w-20 bg-dark-border/40 rounded-lg animate-pulse"></div>
              <div class="space-y-2">
                <div class="h-3 bg-dark-border/30 rounded-md w-full animate-pulse"></div>
                <div class="h-3 bg-dark-border/30 rounded-md w-5/6 animate-pulse"></div>
                <div class="h-3 bg-dark-border/30 rounded-md w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      } @else if (error()) {
        <!-- Error State -->
        <div
          class="bg-dark-surface/80 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center"
        >
          <div class="flex justify-center mb-4 text-red-400">
            <app-triangle-alert-icon [size]="48" [strokeWidth]="2" />
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">Erro ao carregar vaga</h3>
          <p class="text-text-muted text-sm">{{ error() }}</p>
          <button class="btn-secondary mt-4 text-sm" (click)="loadJob()">Tentar novamente</button>
        </div>
      } @else if (job()) {
        <!-- Job Detail -->
        <div class="space-y-6">
          <!-- Header -->
          <div>
            <h1 class="text-3xl font-bold text-white mb-3">{{ job()!.title }}</h1>
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="text-sm text-text-muted bg-dark-surface/80 backdrop-blur-sm border border-white/5 rounded-full px-3 py-1"
                >{{ job()!.company }}</span
              >
              <span class="text-text-muted/30">&middot;</span>
              <span class="text-sm text-text-muted/70">{{ job()!.location }}</span>
            </div>
          </div>

          <!-- Bento Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left column: Score + Status + Platform -->
            <div class="organic-card p-5 space-y-3 min-h-[200px]">
              <h3 class="text-xs font-semibold text-text-muted/60 uppercase tracking-wider">
                Informações
              </h3>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-text-muted/60 w-16">Score</span>
                  <app-score-badge [score]="job()!.score" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-text-muted/60 w-16">Status</span>
                  <app-status-chip [status]="job()!.status" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-text-muted/60 w-16">Origem</span>
                  <span
                    class="text-xs px-3 py-1 rounded-lg border"
                    [class]="job()!.platform | platformClass"
                    >{{ job()!.platform }}</span
                  >
                </div>
                @if (job()!.salaryRange) {
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-text-muted/60 w-16">Salário</span>
                    <span
                      class="text-xs px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400"
                      >{{ job()!.salaryRange }}</span
                    >
                  </div>
                }
              </div>
            </div>

            <!-- Right column: Description -->
            <div
              class="organic-card p-5 flex flex-col justify-between max-h-[420px] transition-all duration-300"
            >
              <div class="flex-1 flex flex-col min-h-0">
                <h3 class="text-xs font-semibold text-text-muted/60 uppercase tracking-wider mb-3">
                  Descrição
                </h3>
                <div class="flex-1 overflow-y-auto pr-1 max-h-[300px] transition-all duration-300">
                  <p class="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                    {{ formattedDescription() || 'Descrição não disponível para esta vaga.' }}
                  </p>
                </div>
              </div>

              @if (shouldShowReadMore()) {
                <button
                  (click)="isExpanded.set(!isExpanded())"
                  class="mt-4 text-xs font-semibold text-accent hover:text-accent/80 flex items-center gap-1 transition-all self-start"
                >
                  @if (isExpanded()) {
                    Ver menos
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                    >
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                  } @else {
                    Ler descrição completa
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Requirements (full-width) -->
          @if (parsedRequirements().length > 0) {
            <div class="organic-card p-5">
              <h3 class="text-xs font-semibold text-text-muted/60 uppercase tracking-wider mb-3">
                Requisitos
              </h3>
              <div class="flex flex-wrap gap-2">
                @for (req of parsedRequirements(); track req) {
                  <span
                    class="text-xs px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary"
                  >
                    {{ req }}
                  </span>
                }
              </div>
            </div>
          }

          <!-- Found Date -->
          <div class="flex items-center gap-2 text-xs text-text-muted/60">
            <app-clock-icon [size]="14" [strokeWidth]="2" />
            <span>Encontrada em {{ job()!.foundAt | date: 'dd/MM/yyyy HH:mm' }}</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 flex-wrap">
            @if (job()!.status === 'Candidatou') {
              <div
                class="flex items-center gap-2 text-sm bg-green-500/10 backdrop-blur-sm border border-green-500/20 text-green-400 rounded-full px-5 py-2.5"
              >
                <app-check-icon [size]="16" [strokeWidth]="2" />
                <span>Já candidatado</span>
              </div>
            } @else {
              <button
                class="btn-primary flex items-center gap-2 rounded-full px-6 py-2.5"
                [disabled]="applying()"
                (click)="showConfirm.set(true)"
              >
                @if (applying()) {
                  <app-spinner-icon [size]="16" />
                  Enviando...
                } @else {
                  <app-send-icon [size]="16" [strokeWidth]="2" />
                  Candidatar-se
                }
              </button>
            }

            <!-- Favorite Button -->
            <button
              class="btn-secondary rounded-full px-5 py-2.5"
              [class.text-red-500]="job()!.isFavorite"
              [class.bg-red-500/5]="job()!.isFavorite"
              (click)="toggleFavorite()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                [attr.fill]="job()!.isFavorite ? 'currentColor' : 'none'"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                />
              </svg>
              <span>{{ job()!.isFavorite ? 'Favoritada' : 'Favoritar' }}</span>
            </button>

            <!-- Fixed Company Import Button -->
            <button
              class="btn-secondary rounded-full px-5 py-2.5 text-amber-400 hover:bg-amber-400/10 border-amber-500/20"
              (click)="addToFixedCompanies()"
              title="Importar esta empresa como Empresa Fixa"
              [disabled]="!job()!.url"
            >
              ⭐ Empresa Fixa
            </button>

            <!-- Delete Button -->
            <button
              class="btn-secondary rounded-full px-5 py-2.5 hover:border-red-500/20 hover:text-red-400"
              (click)="openRejectModal()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span>Excluir</span>
            </button>

            @if (job()!.url) {
              <a
                class="btn-secondary rounded-full px-5 py-2.5"
                [href]="job()!.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <app-external-link-icon [size]="16" [strokeWidth]="2" />
                Abrir vaga original
              </a>
            }
          </div>
        </div>
      } @else {
        <!-- Empty State -->
        <div class="organic-card p-8 text-center">
          <div class="flex justify-center mb-4 text-text-muted/40">
            <app-search-icon [size]="48" [strokeWidth]="2" />
          </div>
          <p class="text-text-muted text-sm">Selecione uma vaga na lista para ver os detalhes.</p>
        </div>
      }
    </div>

    <!-- Confirm Modal -->
    @if (showConfirm()) {
      <div
        class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <div
          class="bg-dark-surface/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 max-w-sm w-full space-y-5"
        >
          <h3 class="text-xl font-bold text-white">Confirmar candidatura</h3>
          <p class="text-sm text-text-muted leading-relaxed">Deseja se candidatar para</p>
          <div class="bg-dark-surface/80 border border-white/5 rounded-xl p-4 space-y-1">
            <p class="text-sm font-semibold text-white">{{ job()!.title }}</p>
            <p class="text-xs text-text-muted/70">{{ job()!.company }}</p>
          </div>
          <p class="text-sm text-text-muted/70">
            Sua candidatura será registrada automaticamente no sistema.
          </p>
          <div class="flex gap-3 justify-end pt-1">
            <button
              (click)="showConfirm.set(false)"
              class="text-sm glass-v2 rounded-full px-5 py-2 text-text-muted hover:text-white hover:border-white/20 transition-all"
            >
              Cancelar
            </button>
            <button
              (click)="confirmApply()"
              class="btn-primary text-sm flex items-center gap-2 rounded-full px-5 py-2"
            >
              <app-send-icon [size]="14" [strokeWidth]="2" />
              Confirmar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Reject Modal -->
    @if (showRejectModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
        <div
          class="bg-dark-surface border border-dark-border rounded-2xl p-6 w-full max-w-md mx-4 space-y-4 shadow-2xl"
        >
          <h3 class="text-lg font-semibold text-white">Excluir vaga</h3>

          <div>
            <label class="text-sm text-text-muted mb-1 block">Motivo</label>
            <select
              class="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white focus:border-primary focus:outline-none"
              [ngModel]="rejectReason()"
              (ngModelChange)="rejectReason.set($event)"
            >
              @for (opt of rejectReasonOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
          </div>

          <div>
            <label class="text-sm text-text-muted mb-1 block">Notas (opcional)</label>
            <textarea
              class="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white h-20 resize-none focus:border-primary focus:outline-none"
              [ngModel]="rejectNotes()"
              (ngModelChange)="rejectNotes.set($event)"
              placeholder="Motivo adicional..."
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              (click)="showRejectModal.set(false)"
              class="px-4 py-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              (click)="confirmReject()"
              class="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 transition-colors font-medium"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class JobDetailComponent {
  private readonly jobsService = inject(JobsService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly companiesService = inject(CompaniesService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  id = input<string>('');

  job = signal<Job | null>(null);
  loading = signal(false);
  error = signal('');
  applying = signal(false);
  showConfirm = signal(false);
  showRejectModal = signal(false);
  rejectReason = signal('incompativel');
  rejectNotes = signal('');
  rejectReasonOptions = [
    { value: 'incompativel', label: 'Incompatível com perfil' },
    { value: 'empresa_ruim', label: 'Empresa não interessa' },
    { value: 'sem_remote', label: 'Sem trabalho remoto' },
    { value: 'salario_baixo', label: 'Salário abaixo do esperado' },
    { value: 'local_incompativel', label: 'Localização incompatível' },
    { value: 'outro', label: 'Outro' },
  ];

  isExpanded = signal(false);
  descriptionThreshold = 400;

  shouldShowReadMore = computed(() => {
    const desc = this.job()?.description;
    return desc ? desc.length > this.descriptionThreshold : false;
  });

  formattedDescription = computed(() => {
    const desc = this.job()?.description;
    if (!desc) return '';
    if (this.isExpanded() || desc.length <= this.descriptionThreshold) {
      return desc;
    }
    const truncated = desc.substring(0, this.descriptionThreshold);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace > 0 ? lastSpace : this.descriptionThreshold) + '...';
  });

  parsedRequirements = computed(() => {
    const req = this.job()?.requirements;
    if (!req) return [];
    try {
      const parsed = JSON.parse(req);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [req];
    }
  });

  private readonly _jobEffect = effect(() => {
    const id = this.id();
    if (id) {
      this.loadJob();
    } else {
      this.job.set(null);
      this.error.set('');
    }
  });

  loadJob(): void {
    const id = this.id();
    if (!id) return;

    this.loading.set(true);
    this.error.set('');

    this.jobsService
      .getJob(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (job) => {
          this.job.set(job);
          this.loading.set(false);
          if (job.status === 'Nova') {
            this.jobsService
              .updateJob(job.id, { status: 'Visualizada' })
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (updated) => this.job.set(updated),
                error: () => {}, // silently fail - non-critical
              });
          }
        },
        error: (err) => {
          this.error.set(err?.error?.detail || 'Não foi possível carregar os detalhes da vaga.');
          this.loading.set(false);
        },
      });
  }

  confirmApply(): void {
    this.showConfirm.set(false);
    this.apply();
  }

  apply(): void {
    const currentJob = this.job();
    if (!currentJob) return;

    this.applying.set(true);

    this.applicationsService
      .createApplication({ jobId: currentJob.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.job.set({ ...currentJob, status: 'Candidatou' });
          this.applying.set(false);
          this.toastService.success('Candidatura enviada com sucesso!');
        },
        error: (err) => {
          this.applying.set(false);
          this.toastService.error(err?.error?.detail || 'Erro ao enviar candidatura.');
        },
      });
  }

  toggleFavorite(): void {
    const currentJob = this.job();
    if (!currentJob) return;
    const newStatus = !currentJob.isFavorite;

    this.jobsService
      .updateJob(currentJob.id, { isFavorite: newStatus })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.job.set(updated);
          this.toastService.success(
            newStatus ? 'Vaga adicionada aos favoritos!' : 'Vaga removida dos favoritos.',
          );
        },
        error: () => this.toastService.error('Erro ao atualizar favorito.'),
      });
  }

  openRejectModal(): void {
    this.rejectReason.set('incompativel');
    this.rejectNotes.set('');
    this.showRejectModal.set(true);
  }

  confirmReject(): void {
    const currentJob = this.job();
    if (!currentJob) return;

    this.jobsService
      .deleteJob(currentJob.id, this.rejectReason(), this.rejectNotes() || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Vaga excluída');
          this.router.navigate(['/jobs']);
        },
        error: () => this.toastService.error('Erro ao excluir'),
      });
    this.showRejectModal.set(false);
  }

  addToFixedCompanies(): void {
    const currentJob = this.job();
    if (!currentJob) return;

    if (!currentJob.url) {
      this.toastService.error(
        'A vaga precisa ter uma URL válida para ser importada como Empresa Fixa.',
      );
      return;
    }

    const data = {
      name: currentJob.company,
      applicationUrl: currentJob.url,
      intervalDays: 30,
      notes: `Importada automaticamente a partir da vaga "${currentJob.title}".`,
    };

    this.companiesService
      .createCompany(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(
            `${currentJob.company} adicionada às Empresas Fixas com sucesso!`,
          );
        },
        error: (err) => {
          const detail = err?.error?.detail || 'Erro ao favoritar empresa.';
          this.toastService.error(detail);
        },
      });
  }
}
