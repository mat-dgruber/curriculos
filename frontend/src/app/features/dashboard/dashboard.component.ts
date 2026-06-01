import { Component, inject, OnInit, signal } from '@angular/core';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ScoreBadgeComponent } from '../../shared/components/score-badge/score-badge.component';
import { TriangleAlertIconComponent } from '../../shared/components/triangle-alert-icon/triangle-alert-icon.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { JobsService } from '../../core/services/jobs.service';
import { ApplicationsService } from '../../core/services/applications.service';
import { SchedulerService } from '../../core/services/scheduler.service';
import { ToastService } from '../../core/services/toast.service';
import { Job } from '../../core/models/job.model';
import { SchedulerStatus } from '../../core/models/profile.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    StatCardComponent,
    ScoreBadgeComponent,
    TriangleAlertIconComponent,
    RelativeTimePipe,
    RouterLink,
  ],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-white mb-8">Dashboard</h1>

      @if (loading()) {
        <!-- Stats Skeleton -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          @for (i of [1, 2, 3]; track i) {
            <div class="bg-dark-surface border border-dark-border rounded-xl p-5 animate-pulse">
              <div class="h-3 bg-dark-border/60 rounded w-1/3 mb-4"></div>
              <div class="h-8 bg-dark-border/40 rounded w-1/2"></div>
            </div>
          }
        </div>
        <!-- Scheduler Skeleton -->
        <div class="bg-dark-surface border border-dark-border rounded-xl p-5 mb-8 animate-pulse">
          <div class="h-4 bg-dark-border/40 rounded w-1/4"></div>
        </div>
        <!-- Jobs Skeleton -->
        <div class="bg-dark-surface border border-dark-border rounded-xl p-5 animate-pulse">
          <div class="h-5 bg-dark-border/40 rounded w-1/4 mb-4"></div>
          @for (i of [1, 2, 3]; track i) {
            <div
              class="flex items-center justify-between py-3 border-b border-dark-border last:border-0"
            >
              <div class="space-y-2">
                <div class="h-4 bg-dark-border/40 rounded w-48"></div>
                <div class="h-3 bg-dark-border/30 rounded w-32"></div>
              </div>
              <div class="h-6 w-16 bg-dark-border/40 rounded-full"></div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="bg-dark-surface border border-error/20 rounded-xl p-8 text-center">
          <div class="text-error/60 flex justify-center mb-3">
            <app-triangle-alert-icon [size]="40" [strokeWidth]="1.5" />
          </div>
          <p class="text-error font-medium mb-1">{{ error() }}</p>
          <p class="text-text-muted text-sm mb-4">Tente novamente ou verifique sua conexão.</p>
          <button class="btn-primary text-sm" (click)="loadDashboard()">Tentar novamente</button>
        </div>
      } @else {
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <app-stat-card label="Vagas Encontradas" [value]="stats().totalJobs" suffix="vagas" />
          <app-stat-card label="Currículos Enviados" [value]="stats().sentApplications" />
          <app-stat-card label="Taxa de Resposta" [value]="stats().responseRate" suffix="%" />
        </div>

        <!-- Scheduler Status -->
        <div
          class="bg-dark-surface border border-dark-border rounded-xl p-5 mb-8 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            @if (schedulerStatus()?.isRunning) {
              <div
                class="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);"
              >
                <span class="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                <span class="text-xs font-medium text-success">Robô ativo</span>
              </div>
            } @else {
              <div
                class="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style="background: rgba(148,163,184,0.1); border: 1px solid rgba(148,163,184,0.15);"
              >
                <span class="w-2 h-2 bg-text-muted rounded-full"></span>
                <span class="text-xs font-medium text-text-muted">Robô pausado</span>
              </div>
            }
          </div>
          <a routerLink="/jobs" class="text-sm text-primary hover:text-accent transition-colors"
            >Ver vagas →</a
          >
        </div>

        <!-- Recent Jobs -->
        <div class="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-white">Vagas Recentes</h2>
            <a routerLink="/jobs" class="text-sm text-primary hover:text-accent transition-colors"
              >Ver todas →</a
            >
          </div>
          @for (job of recentJobs(); track job.id) {
            <div
              class="flex items-center justify-between py-3 border-b border-dark-border last:border-0 hover:bg-white/[0.02] rounded-lg px-2 transition-colors"
            >
              <div>
                <p class="text-white font-medium">{{ job.title }}</p>
                <p class="text-sm text-text-muted">{{ job.company }} · {{ job.location }}</p>
              </div>
              <div class="flex items-center gap-3">
                <app-score-badge [score]="job.score" />
                <span class="text-xs text-text-muted w-16 text-right">{{
                  job.foundAt | relativeTime
                }}</span>
              </div>
            </div>
          } @empty {
            <p class="text-text-muted py-4 text-center">Nenhuma vaga encontrada ainda.</p>
          }
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly jobsService = inject(JobsService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly schedulerService = inject(SchedulerService);
  private readonly toast = inject(ToastService);

  stats = signal({ totalJobs: 0, sentApplications: 0, responseRate: 0 });
  recentJobs = signal<Job[]>([]);
  schedulerStatus = signal<SchedulerStatus | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.jobsService.getJobs({ perPage: 5 }).subscribe({
      next: (res) => {
        this.stats.update((s) => ({ ...s, totalJobs: res.total }));
        this.recentJobs.set(res.items);
      },
      error: () => this.toast.error('Erro ao carregar vagas.'),
    });

    this.applicationsService.getApplications().subscribe({
      next: (res) => {
        const sent = res.items.filter((a) => a.status === 'Enviado').length;
        this.stats.update((s) => ({ ...s, sentApplications: sent }));
      },
      error: () => {},
    });

    this.schedulerService.getStatus().subscribe({
      next: (status) => {
        this.schedulerStatus.set(status);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar dashboard.');
        this.loading.set(false);
        this.toast.error('Erro ao carregar dashboard.');
      },
    });
  }
}
