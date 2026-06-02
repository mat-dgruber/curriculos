import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ScoreBadgeComponent } from '../../shared/components/score-badge/score-badge.component';
import { TriangleAlertIconComponent } from '../../shared/components/triangle-alert-icon/triangle-alert-icon.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { ChartBarComponent } from '../../shared/components/chart-bar/chart-bar.component';
import { SendIconComponent } from '../../shared/components/send-icon/send-icon.component';
import { JobsService } from '../../core/services/jobs.service';
import { ApplicationsService } from '../../core/services/applications.service';
import { SchedulerService } from '../../core/services/scheduler.service';
import { ToastService } from '../../core/services/toast.service';
import { Job } from '../../core/models/job.model';
import { Application } from '../../core/models/application.model';
import { RouterLink } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import { GslPageHelp } from '../../shared/components/gsl-page-help/gsl-page-help.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    StatCardComponent,
    ScoreBadgeComponent,
    TriangleAlertIconComponent,
    RelativeTimePipe,
    ChartBarComponent,
    RouterLink,
    SendIconComponent,
    GslPageHelp,
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="relative p-4 md:p-8 overflow-hidden">
      <!-- Ambient Blobs -->
      <div class="blob-teal" style="top: -60px; right: -40px;"></div>
      <div class="blob-orange" style="bottom: 10%; left: -30px;"></div>
      <div class="blob-gold" style="top: 40%; right: 10%;"></div>

      <div class="flex items-center gap-3 mb-6 md:mb-8 relative z-10 animate-fade-in-up">
        <h1 class="text-3xl md:text-4xl font-serif font-bold text-white">Dashboard</h1>
        <app-gsl-page-help document="dashboard.md" title="Manual: Painel de Métricas" />
      </div>

      @if (loading()) {
        <!-- Stats Skeleton -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          @for (i of [1, 2, 3]; track i) {
            <div class="organic-card p-5 animate-pulse">
              <div class="h-3 bg-dark-border/60 rounded w-1/3 mb-4"></div>
              <div class="h-8 bg-dark-border/40 rounded w-1/2"></div>
            </div>
          }
        </div>
        <!-- Scheduler Skeleton -->
        <div class="organic-card p-5 mb-8 animate-pulse">
          <div class="h-4 bg-dark-border/40 rounded w-1/4"></div>
        </div>
        <!-- Jobs Skeleton -->
        <div class="organic-card p-5 animate-pulse">
          <div class="h-5 bg-dark-border/40 rounded w-1/4 mb-4"></div>
          @for (i of [1, 2, 3]; track i) {
            <div class="flex items-center justify-between py-3 border-b border-dark-border last:border-0">
              <div class="space-y-2">
                <div class="h-4 bg-dark-border/40 rounded w-48"></div>
                <div class="h-3 bg-dark-border/30 rounded w-32"></div>
              </div>
              <div class="h-6 w-16 bg-dark-border/40 rounded-full"></div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="organic-card p-8 text-center relative z-10">
          <div class="text-error/60 flex justify-center mb-3">
            <app-triangle-alert-icon [size]="40" [strokeWidth]="1.5" />
          </div>
          <p class="text-error font-medium mb-1">{{ error() }}</p>
          <p class="text-text-muted text-sm mb-4">Tente novamente ou verifique sua conexão.</p>
          <button class="btn-primary text-sm" (click)="loadDashboard()">Tentar novamente</button>
        </div>
      } @else {
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 relative z-10">
          <div class="animate-fade-in-up stagger-1"><app-stat-card label="Vagas Encontradas" [value]="stats().totalJobs" suffix="vagas" /></div>
          <div class="animate-fade-in-up stagger-2"><app-stat-card label="Currículos Enviados" [value]="stats().sentApplications" /></div>
          <div class="animate-fade-in-up stagger-3"><app-stat-card label="Taxa de Resposta" [value]="stats().responseRate" suffix="%" /></div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 relative z-10">
          <div class="animate-fade-in-up stagger-4"><app-chart-bar
            title="Vagas por Plataforma"
            [data]="platformChartData()"
            [labels]="platformLabels()"
          /></div>
          <div class="animate-fade-in-up stagger-5"><app-chart-bar
            title="Candidaturas por Semana"
            [data]="weeklyChartData()"
            [labels]="weeklyLabels()"
          /></div>
        </div>

        <!-- Resumo -->
        <div class="organic-card p-5 mb-8 relative z-10 animate-fade-in-up stagger-3">
          <h2 class="text-lg font-semibold text-white mb-4">Resumo Geral</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <!-- Total -->
            <div class="flex flex-col justify-between p-4 rounded-2xl bg-white/[0.03] border border-dark-border relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
              <div>
                <p class="text-3xl font-extrabold text-primary mb-1">{{ totalApplications() }}</p>
                <p class="text-xs font-medium text-text-muted">Total de candidaturas</p>
              </div>
              <div class="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
                <div class="bg-primary h-full rounded-full transition-all duration-1000 ease-out" style="width: 100%"></div>
              </div>
            </div>

            <!-- Enviadas -->
            <div class="flex flex-col justify-between p-4 rounded-2xl bg-white/[0.03] border border-dark-border relative overflow-hidden group hover:border-success/20 transition-all duration-300">
              <div>
                <div class="flex items-baseline justify-between">
                  <p class="text-3xl font-extrabold text-success mb-1">{{ sentApplications() }}</p>
                  <span class="text-[10px] font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded-md">{{ sentPercentage() }}%</span>
                </div>
                <p class="text-xs font-medium text-text-muted">Enviadas com sucesso</p>
              </div>
              <div class="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
                <div class="bg-success h-full rounded-full transition-all duration-1000 ease-out" [style.width.%]="sentPercentage()"></div>
              </div>
            </div>

            <!-- Falharam -->
            <div class="flex flex-col justify-between p-4 rounded-2xl bg-white/[0.03] border border-dark-border relative overflow-hidden group hover:border-error/20 transition-all duration-300">
              <div>
                <div class="flex items-baseline justify-between">
                  <p class="text-3xl font-extrabold text-error mb-1">{{ failedApplications() }}</p>
                  <span class="text-[10px] font-semibold text-error bg-error/10 px-1.5 py-0.5 rounded-md">{{ failedPercentage() }}%</span>
                </div>
                <p class="text-xs font-medium text-text-muted">Falharam</p>
              </div>
              <div class="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
                <div class="bg-error h-full rounded-full transition-all duration-1000 ease-out" [style.width.%]="failedPercentage()"></div>
              </div>
            </div>

            <!-- Pendentes -->
            <div class="flex flex-col justify-between p-4 rounded-2xl bg-white/[0.03] border border-dark-border relative overflow-hidden group hover:border-warning/20 transition-all duration-300">
              <div>
                <div class="flex items-baseline justify-between">
                  <p class="text-3xl font-extrabold text-warning mb-1">{{ pendingApplications() }}</p>
                  <span class="text-[10px] font-semibold text-warning bg-warning/10 px-1.5 py-0.5 rounded-md">{{ pendingPercentage() }}%</span>
                </div>
                <p class="text-xs font-medium text-text-muted">Pendentes</p>
              </div>
              <div class="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
                <div class="bg-warning h-full rounded-full transition-all duration-1000 ease-out" [style.width.%]="pendingPercentage()"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scheduler Status -->
        <div class="organic-card p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 animate-fade-in-up stagger-4">
          <div class="flex items-center gap-3 flex-wrap">
            @if (schedulerStatus()?.isRunning) {
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <span class="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                <span class="text-xs font-medium text-success">Robô ativo</span>
              </div>
            } @else {
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-text-muted/10 border border-text-muted/15">
                <span class="w-2 h-2 bg-text-muted rounded-full"></span>
                <span class="text-xs font-medium text-text-muted">Robô pausado</span>
              </div>
            }

            <button
              (click)="toggleScheduler()"
              [disabled]="togglingScheduler()"
              class="btn-secondary text-xs flex items-center gap-1 py-1 px-3"
            >
              @if (togglingScheduler()) {
                Processando...
              } @else {
                {{ schedulerStatus()?.isRunning ? 'Pausar Automação' : 'Ativar Automação' }}
              }
            </button>

            <button
              (click)="triggerScan()"
              [disabled]="togglingScheduler() || schedulerStatus()?.isRunning === false"
              class="btn-secondary text-xs flex items-center gap-1.5 py-1 px-3 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Disparar busca manual de vagas em segundo plano agora"
            >
              <app-send-icon [size]="12" [strokeWidth]="2" />
              Buscar Vagas
            </button>
          </div>
          <a routerLink="/jobs" class="text-sm text-primary hover:text-accent transition-colors"
            >Ver vagas →</a
          >
        </div>

        <!-- Recent Jobs -->
        <div class="organic-card p-4 md:p-5 relative z-10 animate-fade-in-up stagger-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base md:text-lg font-semibold text-white">Vagas Recentes</h2>
            <a routerLink="/jobs" class="text-xs md:text-sm text-primary hover:text-accent transition-colors"
              >Ver todas →</a
            >
          </div>
          @for (job of recentJobs(); track job.id) {
            <div
              class="flex items-center justify-between py-3 border-b border-dark-border last:border-0 hover:bg-white/[0.02] rounded-lg px-2 transition-colors"
            >
              <div class="min-w-0 flex-1 mr-3">
                <p class="text-white font-medium text-sm md:text-base truncate">{{ job.title }}</p>
                <p class="text-xs md:text-sm text-text-muted truncate">{{ job.company }} · {{ job.location }}</p>
              </div>
              <div class="flex items-center gap-2 md:gap-3 shrink-0">
                <app-score-badge [score]="job.score" />
                <span class="text-[10px] md:text-xs text-text-muted hidden sm:block">{{
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
  allJobs = signal<Job[]>([]);
  allApplications = signal<Application[]>([]);
  schedulerStatus = this.schedulerService.status;
  loading = signal(true);
  error = signal<string | null>(null);
  togglingScheduler = signal(false);

  // -- Chart data: Vagas por Plataforma Dinâmico --
  platformLabels = computed(() => {
    const jobs = this.allJobs();
    const counts: Record<string, number> = {};

    jobs.forEach((j) => {
      const platform = j.platform ? j.platform.trim() : 'Outra';
      const formatted = platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
      counts[formatted] = (counts[formatted] || 0) + 1;
    });

    const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

    if (sorted.length > 5) {
      const top4 = sorted.slice(0, 4);
      return [...top4, 'Outras'];
    }
    return sorted.length > 0 ? sorted : ['Nenhuma'];
  });

  platformChartData = computed(() => {
    const jobs = this.allJobs();
    const labels = this.platformLabels();
    if (labels[0] === 'Nenhuma') return [0];

    const counts: Record<string, number> = {};
    let othersCount = 0;

    jobs.forEach((j) => {
      const platform = j.platform ? j.platform.trim() : 'Outra';
      const formatted = platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
      counts[formatted] = (counts[formatted] || 0) + 1;
    });

    const topLabels = labels.filter((l) => l !== 'Outras');
    const data = topLabels.map((l) => counts[l] || 0);

    if (labels.includes('Outras')) {
      const topSet = new Set(topLabels);
      Object.keys(counts).forEach((p) => {
        if (!topSet.has(p)) {
          othersCount += counts[p];
        }
      });
      data.push(othersCount);
    }

    return data;
  });

  // -- Chart data: Candidaturas por Semana com Fuso Horário Local --
  weeklyLabels = computed(() => {
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('pt-BR', { weekday: 'short' }));
    }
    return labels;
  });

  weeklyChartData = computed(() => {
    const apps = this.allApplications();
    const counts: number[] = [];

    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }

    dates.forEach((dateStr) => {
      const dayCount = apps.filter((a) => {
        if (!a.sentAt) return false;
        const appDate = new Date(a.sentAt);
        const appYear = appDate.getFullYear();
        const appMonth = String(appDate.getMonth() + 1).padStart(2, '0');
        const appDay = String(appDate.getDate()).padStart(2, '0');
        const appLocalStr = `${appYear}-${appMonth}-${appDay}`;
        return appLocalStr === dateStr;
      }).length;
      counts.push(dayCount);
    });

    return counts;
  });

  // -- Resumo stats --
  totalApplications = computed(() => this.allApplications().length);
  sentApplications = computed(() => this.allApplications().filter((a) => a.status === 'Enviado').length);
  failedApplications = computed(() => this.allApplications().filter((a) => a.status === 'Falhou').length);
  pendingApplications = computed(() => this.allApplications().filter((a) => a.status === 'Pendente').length);

  sentPercentage = computed(() => {
    const total = this.totalApplications();
    return total > 0 ? Math.round((this.sentApplications() / total) * 100) : 0;
  });

  failedPercentage = computed(() => {
    const total = this.totalApplications();
    return total > 0 ? Math.round((this.failedApplications() / total) * 100) : 0;
  });

  pendingPercentage = computed(() => {
    const total = this.totalApplications();
    return total > 0 ? Math.round((this.pendingApplications() / total) * 100) : 0;
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      jobs: this.jobsService.getJobs({ perPage: 200 }),
      applications: this.applicationsService.getApplications({ per_page: 500 }),
      scheduler: this.schedulerService.getStatus(),
    }).subscribe({
      next: ({ jobs, applications }) => {
        // Popula Vagas
        this.stats.update((s) => ({ ...s, totalJobs: jobs.total }));
        this.allJobs.set(jobs.items);
        this.recentJobs.set(jobs.items.slice(0, 5));

        // Popula Candidaturas
        this.allApplications.set(applications.items);
        const sent = applications.items.filter((a) => a.status === 'Enviado').length;
        const total = applications.total;
        const rate = total > 0 ? Math.round((sent / total) * 100) : 0;
        this.stats.update((s) => ({ ...s, sentApplications: sent, responseRate: rate }));

        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar o dashboard.');
        this.loading.set(false);
        this.toast.error('Erro ao carregar dashboard.');
      },
    });
  }

  toggleScheduler(): void {
    const status = this.schedulerStatus();
    if (!status) return;

    const isRunning = status.isRunning;
    this.togglingScheduler.set(true);

    const obs$ = isRunning ? this.schedulerService.pause() : this.schedulerService.resume();

    obs$.subscribe({
      next: () => {
        this.togglingScheduler.set(false);
        this.toast.success(
          isRunning ? 'Robô de automação pausado.' : 'Robô de automação ativado com sucesso!'
        );
      },
      error: () => {
        this.togglingScheduler.set(false);
        this.toast.error('Erro ao alterar status da automação.');
      },
    });
  }

  triggerScan(): void {
    this.togglingScheduler.set(true);
    this.schedulerService.triggerJob('scan_jobs').subscribe({
      next: () => {
        this.togglingScheduler.set(false);
        this.toast.success('Varredura de novas vagas iniciada com sucesso em segundo plano!');
      },
      error: () => {
        this.togglingScheduler.set(false);
        this.toast.error('Erro ao disparar busca de vagas.');
      },
    });
  }
}