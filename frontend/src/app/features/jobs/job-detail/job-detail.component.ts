import { Component, computed, inject, input, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobsService } from '../../../core/services/jobs.service';
import { ApplicationsService } from '../../../core/services/applications.service';
import { ToastService } from '../../../core/services/toast.service';
import { Job } from '../../../core/models/job.model';
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

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
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
      <a routerLink="/jobs" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-white transition-colors mb-6 bg-dark-surface/80 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
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
            <div class="bg-dark-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-4 min-h-[200px]">
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
            <div class="bg-dark-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-3 min-h-[200px]">
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
        <div class="bg-dark-surface/80 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center">
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
              <span class="text-sm text-text-muted bg-dark-surface/80 backdrop-blur-sm border border-white/5 rounded-full px-3 py-1">{{ job()!.company }}</span>
              <span class="text-text-muted/30">&middot;</span>
              <span class="text-sm text-text-muted/70">{{ job()!.location }}</span>
            </div>
          </div>

          <!-- Bento Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left column: Score + Status + Platform -->
            <div class="bg-dark-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-3 min-h-[200px]">
              <h3 class="text-xs font-semibold text-text-muted/60 uppercase tracking-wider">Informações</h3>
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
                  <span class="text-xs px-3 py-1 rounded-lg border" [class]="job()!.platform | platformClass">{{ job()!.platform }}</span>
                </div>
                @if (job()!.salaryRange) {
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-text-muted/60 w-16">Salário</span>
                    <span class="text-xs px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">{{ job()!.salaryRange }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Right column: Description -->
            <div class="bg-dark-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 min-h-[200px]">
              <h3 class="text-xs font-semibold text-text-muted/60 uppercase tracking-wider mb-3">Descrição</h3>
              <p class="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                {{ job()!.description || 'Descrição não disponível para esta vaga.' }}
              </p>
            </div>
          </div>

          <!-- Requirements (full-width) -->
          @if (parsedRequirements().length > 0) {
            <div class="bg-dark-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
              <h3 class="text-xs font-semibold text-text-muted/60 uppercase tracking-wider mb-3">Requisitos</h3>
              <div class="flex flex-wrap gap-2">
                @for (req of parsedRequirements(); track req) {
                  <span class="text-xs px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
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
          <div class="flex items-center gap-3">
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
                  <app-spinner-icon [size]="16"/>
                  Enviando...
                } @else {
                  <app-send-icon [size]="16" [strokeWidth]="2" />
                  Candidatar-se
                }
              </button>
            }

            @if (job()!.url) {
              <a
                class="flex items-center gap-2 text-sm bg-dark-surface/80 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2.5 text-text-muted hover:text-white hover:border-white/20 transition-all"
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
        <div class="bg-dark-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl p-8 text-center">
          <div class="flex justify-center mb-4 text-text-muted/40">
            <app-search-icon [size]="48" [strokeWidth]="2" />
          </div>
          <p class="text-text-muted text-sm">Selecione uma vaga na lista para ver os detalhes.</p>
        </div>
      }
    </div>

    <!-- Confirm Modal -->
    @if (showConfirm()) {
      <div class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div class="bg-dark-surface/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 max-w-sm w-full space-y-5">
          <h3 class="text-xl font-bold text-white">Confirmar candidatura</h3>
          <p class="text-sm text-text-muted leading-relaxed">
            Deseja se candidatar para
          </p>
          <div class="bg-dark-surface/80 border border-white/5 rounded-xl p-4 space-y-1">
            <p class="text-sm font-semibold text-white">{{ job()!.title }}</p>
            <p class="text-xs text-text-muted/70">{{ job()!.company }}</p>
          </div>
          <p class="text-sm text-text-muted/70">
            Sua candidatura será registrada automaticamente no sistema.
          </p>
          <div class="flex gap-3 justify-end pt-1">
            <button (click)="showConfirm.set(false)" class="text-sm bg-dark-surface/80 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2 text-text-muted hover:text-white hover:border-white/20 transition-all">
              Cancelar
            </button>
            <button (click)="confirmApply()" class="btn-primary text-sm flex items-center gap-2 rounded-full px-5 py-2">
              <app-send-icon [size]="14" [strokeWidth]="2" />
              Confirmar
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
  private readonly toastService = inject(ToastService);

  id = input<string>('');

  job = signal<Job | null>(null);
  loading = signal(false);
  error = signal('');
  applying = signal(false);
  showConfirm = signal(false);

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

    this.jobsService.getJob(id).subscribe({
      next: (job) => {
        this.job.set(job);
        this.loading.set(false);
        if (job.status === 'Nova') {
          this.jobsService.updateJob(job.id, { status: 'Visualizada' }).subscribe({
            next: (updated) => this.job.set(updated),
            error: () => {} // silently fail - non-critical
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

    this.applicationsService.createApplication({ jobId: currentJob.id }).subscribe({
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

}
