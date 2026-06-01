import { Component, inject, input, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { JobsService } from '../../../core/services/jobs.service';
import { ApplicationsService } from '../../../core/services/applications.service';
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

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    DatePipe,
    ScoreBadgeComponent,
    StatusChipComponent,
    SearchIconComponent,
    SendIconComponent,
    ExternalLinkIconComponent,
    ClockIconComponent,
    CheckIconComponent,
    TriangleAlertIconComponent,
    SpinnerIconComponent,
  ],
  template: `
    <div class="p-6">
      @if (loading()) {
        <!-- Skeleton Loading -->
        <div class="space-y-6">
          <div class="h-8 bg-dark-border/40 rounded-lg w-1/3 animate-pulse"></div>
          <div class="h-4 bg-dark-border/30 rounded-md w-1/4 animate-pulse"></div>

          <div class="bg-dark-surface border border-dark-border rounded-2xl p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="h-4 w-24 bg-dark-border/40 rounded-lg animate-pulse"></div>
              <div class="h-6 w-16 bg-dark-border/40 rounded-full animate-pulse"></div>
              <div class="h-6 w-20 bg-dark-border/40 rounded-lg animate-pulse"></div>
            </div>
            <div class="space-y-2">
              <div class="h-4 bg-dark-border/30 rounded-md w-full animate-pulse"></div>
              <div class="h-4 bg-dark-border/30 rounded-md w-5/6 animate-pulse"></div>
              <div class="h-4 bg-dark-border/30 rounded-md w-3/4 animate-pulse"></div>
            </div>
            <div class="space-y-2 mt-4">
              <div class="h-4 bg-dark-border/30 rounded-md w-full animate-pulse"></div>
              <div class="h-4 bg-dark-border/30 rounded-md w-4/5 animate-pulse"></div>
            </div>
          </div>
        </div>
      } @else if (error()) {
        <!-- Error State -->
        <div class="bg-dark-surface border border-red-500/20 rounded-2xl p-8 text-center">
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
            <h1 class="text-2xl font-bold text-white">{{ job()!.title }}</h1>
            <div class="flex items-center gap-2 mt-2 text-sm text-text-muted">
              <span>{{ job()!.company }}</span>
              <span class="text-text-muted/30">&middot;</span>
              <span>{{ job()!.location }}</span>
            </div>
          </div>

          <!-- Main Info Card -->
          <div class="bg-dark-surface border border-dark-border rounded-2xl p-6 space-y-5">
            <!-- Meta badges -->
            <div class="flex flex-wrap items-center gap-3">
              <app-score-badge [score]="job()!.score" />
              <app-status-chip [status]="job()!.status" />
              <span
                class="text-xs px-3 py-1 rounded-lg border"
                [class]="getPlatformClass(job()!.platform)"
              >
                {{ job()!.platform }}
              </span>
              @if (job()!.salaryRange) {
                <span
                  class="text-xs px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400"
                >
                  {{ job()!.salaryRange }}
                </span>
              }
            </div>

            <!-- Description -->
            <div>
              <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
                Descrição
              </h3>
              <p class="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                {{ job()!.description }}
              </p>
            </div>

            <!-- Requirements -->
            @if (job()!.requirements) {
              <div>
                <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Requisitos
                </h3>
                <p class="text-sm text-white/80 whitespace-pre-line leading-relaxed">
                  {{ job()!.requirements }}
                </p>
              </div>
            }

            <!-- Found date -->
            <div
              class="flex items-center gap-2 text-xs text-text-muted/70 pt-2 border-t border-dark-border"
            >
              <app-clock-icon [size]="14" [strokeWidth]="2" />
              <span>Encontrada em {{ job()!.foundAt | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            @if (job()!.status === 'Candidatou') {
              <div
                class="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5"
              >
                <app-check-icon [size]="16" [strokeWidth]="2" />
                <span>Já candidatado</span>
              </div>
            } @else {
              <button
                class="btn-primary flex items-center gap-2"
                [disabled]="applying()"
                (click)="apply()"
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
                class="btn-secondary flex items-center gap-2 text-sm"
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
        <div class="bg-dark-surface border border-dark-border rounded-2xl p-8 text-center">
          <div class="flex justify-center mb-4 text-text-muted/40">
            <app-search-icon [size]="48" [strokeWidth]="2" />
          </div>
          <p class="text-text-muted text-sm">Selecione uma vaga na lista para ver os detalhes.</p>
        </div>
      }
    </div>
  `,
})
export class JobDetailComponent {
  private readonly jobsService = inject(JobsService);
  private readonly applicationsService = inject(ApplicationsService);

  jobId = input<string>('');

  job = signal<Job | null>(null);
  loading = signal(false);
  error = signal('');
  applying = signal(false);

  private readonly _jobEffect = effect(() => {
    const id = this.jobId();
    if (id) {
      this.loadJob();
    } else {
      this.job.set(null);
      this.error.set('');
    }
  });

  loadJob(): void {
    const id = this.jobId();
    if (!id) return;

    this.loading.set(true);
    this.error.set('');

    this.jobsService.getJob(id).subscribe({
      next: (job) => {
        this.job.set(job);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Não foi possível carregar os detalhes da vaga.');
        this.loading.set(false);
      },
    });
  }

  apply(): void {
    const currentJob = this.job();
    if (!currentJob) return;

    this.applying.set(true);

    this.applicationsService.createApplication({ jobId: currentJob.id }).subscribe({
      next: () => {
        this.job.set({ ...currentJob, status: 'Candidatou' });
        this.applying.set(false);
      },
      error: (err) => {
        this.applying.set(false);
        this.error.set(err?.error?.detail || 'Erro ao enviar candidatura. Tente novamente.');
      },
    });
  }

  getPlatformClass(platform: string): string {
    switch (platform) {
      case 'linkedin':
        return 'bg-primary/10 border-primary/20 text-primary';
      case 'gupy':
        return 'bg-accent/10 border-accent/20 text-accent';
      case 'vagas':
        return 'bg-warning/10 border-warning/20 text-warning';
      default:
        return 'bg-text-muted/10 border-dark-border text-text-muted';
    }
  }
}
