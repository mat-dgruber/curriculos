import { Component, computed, effect, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Subject,
  Subscription,
  interval,
  switchMap,
  takeWhile,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
} from 'rxjs';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { PlatformClassPipe } from '../../../shared/pipes/platform-class.pipe';
import { SelectComponent, SelectOption } from '../../../shared/components/select/select.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ChevronLeftIconComponent } from '../../../shared/components/chevron-left-icon/chevron-left-icon.component';
import { ChevronRightIconComponent } from '../../../shared/components/chevron-right-icon/chevron-right-icon.component';
import { ChevronDownIconComponent } from '../../../shared/components/chevron-down-icon/chevron-down-icon.component';
import { ChevronUpIconComponent } from '../../../shared/components/chevron-up-icon/chevron-up-icon.component';
import { XIconComponent } from '../../../shared/components/x-icon/x-icon.component';
import { SearchIconComponent } from '../../../shared/components/search-icon/search-icon.component';
import { SpinnerIconComponent } from '../../../shared/components/spinner-icon/spinner-icon.component';
import { TriangleAlertIconComponent } from '../../../shared/components/triangle-alert-icon/triangle-alert-icon.component';
import { JobsService } from '../../../core/services/jobs.service';
import { ToastService } from '../../../core/services/toast.service';
import { Job, JobFilters } from '../../../core/models/job.model';

@Component({
  selector: 'app-jobs-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    EmptyStateComponent,
    ScoreBadgeComponent,
    StatusChipComponent,
    RelativeTimePipe,
    PlatformClassPipe,
    SelectComponent,
    ChevronLeftIconComponent,
    ChevronRightIconComponent,
    ChevronDownIconComponent,
    ChevronUpIconComponent,
    XIconComponent,
    SearchIconComponent,
    SpinnerIconComponent,
    TriangleAlertIconComponent,
    InputComponent
],
  template: `
    <div class="p-4 md:p-6">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-white">Vagas</h1>
          <p class="text-xs md:text-sm text-text-muted mt-1">{{ total() }} vagas encontradas</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- View Toggle -->
          <div
            class="flex items-center bg-dark-surface/80 backdrop-blur-sm border border-white/10 rounded-full p-1"
          >
            <button
              class="p-1.5 md:p-2 rounded-full transition-colors"
              [class]="
                viewMode() === 'list'
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-muted hover:text-primary/60'
              "
              (click)="viewMode.set('list')"
              title="Visualização em lista"
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
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
            <button
              class="p-1.5 md:p-2 rounded-full transition-colors"
              [class]="
                viewMode() === 'grid'
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-muted hover:text-white'
              "
              (click)="viewMode.set('grid')"
              title="Visualização em grade"
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
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
          </div>

          <button
            class="btn-primary flex items-center gap-2 text-sm"
            (click)="triggerScan()"
            [disabled]="scanning()"
          >
            @if (scanning()) {
              <app-spinner-icon [size]="16" />
              <span class="hidden sm:inline">Buscando...</span>
            } @else {
              <app-search-icon [size]="16" [strokeWidth]="2" />
              <span class="hidden sm:inline">Buscar vagas agora</span>
            }
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="relative z-20 bg-dark-surface/50 backdrop-blur-sm border border-white/5 rounded-2xl p-3 md:p-4 mb-4 md:mb-6"
      >
        <div class="flex flex-wrap gap-3">
          <!-- Search -->
          <div class="flex-1 min-w-0 sm:min-w-[240px] max-w-sm">
            <app-input
              placeholder="Buscar por titulo ou empresa..."
              [icon]="searchSvg"
              (valueChange)="onSearchChange($event)"
            />
            @if (searching()) {
              <div class="absolute right-3 top-1/2 -translate-y-1/2">
                <app-spinner-icon [size]="14" />
              </div>
            }
          </div>

          <!-- Platform -->
          <div class="w-full sm:w-48">
            <app-select
              [options]="platformOptions"
              [selectedValue]="platformFilter()"
              placeholder="Todas plataformas"
              (valueChange)="platformFilter.set($event); loadJobs()"
            />
          </div>

          <!-- Status -->
          <div class="w-full sm:w-44">
            <app-select
              [options]="statusOptions"
              [selectedValue]="statusFilter()"
              placeholder="Todos status"
              (valueChange)="statusFilter.set($event); loadJobs()"
            />
          </div>

          <!-- Score -->
          <div class="w-full sm:w-44">
            <app-select
              [options]="scoreOptions"
              [selectedValue]="minScore().toString()"
              placeholder="Score minimo"
              (valueChange)="onScoreChange($event)"
            />
          </div>

          <!-- Sort -->
          <div class="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <span class="text-xs text-text-muted whitespace-nowrap">Ordenar:</span>
            <div class="w-full sm:w-44 flex-1 sm:flex-initial">
              <app-select
                [options]="sortOptions"
                [selectedValue]="sortBy()"
                placeholder="Ordenar por"
                (valueChange)="sortBy.set($event); loadJobs()"
              />
            </div>
            <button
              class="btn-secondary text-sm px-3 h-10 flex items-center gap-1.5"
              (click)="sortOrder.set(sortOrder() === 'desc' ? 'asc' : 'desc'); loadJobs()"
              [title]="sortOrder() === 'desc' ? 'Maior primeiro' : 'Menor primeiro'"
            >
              @if (sortOrder() === 'desc') {
                <app-chevron-down-icon [size]="14" [strokeWidth]="2" />
                <span class="text-xs">Desc</span>
              } @else {
                <app-chevron-up-icon [size]="14" [strokeWidth]="2" />
                <span class="text-xs">Asc</span>
              }
            </button>
          </div>

          <!-- Clear Filters -->
          @if (hasActiveFilters()) {
            <button
              class="btn-secondary text-sm px-3 h-10 flex items-center gap-1"
              (click)="clearFilters()"
            >
              <app-x-icon [size]="14" [strokeWidth]="2" />
              Limpar filtros
            </button>
          }
        </div>
      </div>

      <!-- Error -->
      @if (error()) {
        <div
          class="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2"
        >
          <app-triangle-alert-icon [size]="16" [strokeWidth]="2" />
          <span class="text-sm text-red-400">{{ error() }}</span>
        </div>
      }

      <!-- Success -->
      @if (success()) {
        <div
          class="mb-4 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-2"
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
            class="text-green-400"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span class="text-sm text-green-400">{{ success() }}</span>
        </div>
      }

      <!-- Content -->
      @if (loading()) {
        <!-- Skeleton Loading -->
        <div class="space-y-4">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div
              class="relative z-10 bg-dark-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex items-start gap-4"
            >
              <!-- Accent bar skeleton -->
              <div class="w-1 self-stretch rounded-full bg-dark-border/40 animate-pulse mt-1"></div>
              <!-- Content -->
              <div class="flex-1 min-w-0 space-y-3">
                <!-- Title skeleton -->
                <div class="h-4 bg-dark-border/60 rounded-md w-2/5 animate-pulse"></div>
                <!-- Company/location skeleton -->
                <div class="h-3 bg-dark-border/40 rounded-md w-1/4 animate-pulse"></div>
                <!-- Badges row skeleton -->
                <div class="flex items-center gap-2 mt-2">
                  <div class="h-6 w-14 bg-dark-border/40 rounded-full animate-pulse"></div>
                  <div class="h-6 w-20 bg-dark-border/40 rounded-full animate-pulse"></div>
                  <div class="h-6 w-16 bg-dark-border/40 rounded-lg animate-pulse"></div>
                </div>
                <!-- Bottom row skeleton -->
                <div class="flex items-center justify-between mt-2">
                  <div class="h-3 w-24 bg-dark-border/30 rounded-md animate-pulse"></div>
                  <div class="h-4 w-4 bg-dark-border/30 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          }
        </div>
      } @else if (jobs().length === 0) {
        <app-empty-state
          message="Nenhuma vaga encontrada"
          description="Tente ajustar os filtros ou aguarde uma nova varredura do robo."
          icon="search"
          [actionLabel]="total() === 0 ? 'Buscar vagas agora' : ''"
          (action)="triggerScan()"
        />
      } @else {
        <!-- List View -->
        @if (viewMode() === 'list') {
          <div class="space-y-4">
            @for (job of jobs(); track job.id) {
              <a
                class="block relative z-10 bg-dark-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl p-3 md:p-5 hover:border-primary/30 hover:bg-dark-surface transition-all duration-200 cursor-pointer group no-underline"
                [routerLink]="['/jobs', job.id]"
              >
                <div class="flex items-start gap-4">
                  <!-- Left accent bar -->
                  <div
                    class="w-1 self-stretch rounded-full shrink-0 mt-1"
                    [class]="
                      job.score >= 80
                        ? 'bg-green-500'
                        : job.score >= 60
                          ? 'bg-yellow-500'
                          : job.score >= 40
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                    "
                  ></div>

                  <!-- Card content -->
                  <div class="flex-1 min-w-0">
                    <!-- Title -->
                    <p
                      class="text-base font-semibold text-white truncate group-hover:text-primary transition-colors"
                    >
                      {{ job.title }}
                    </p>
                    <!-- Company & Location -->
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-sm text-text-muted">{{ job.company }}</span>
                      <span class="text-text-muted/30">·</span>
                      <span class="text-sm text-text-muted/70">{{ job.location }}</span>
                    </div>
                    <!-- Badges row -->
                    <div class="flex items-center gap-2 mt-3">
                      <app-score-badge [score]="job.score" />
                      <app-status-chip [status]="job.status" />
                      <span
                        class="text-xs px-3 py-1 rounded-full border"
                        [class]="job.platform | platformClass"
                      >
                        {{ job.platform }}
                      </span>
                    </div>
                    <!-- Bottom row -->
                    <div
                      class="flex items-center justify-between mt-3 pt-3 border-t border-white/5"
                    >
                      <span class="text-xs text-text-muted">
                        Encontrado: {{ job.foundAt | relativeTime }}
                      </span>
                      <!-- Chevron right -->
                      <svg
                        class="w-4 h-4 text-text-muted/40 group-hover:text-primary/60 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </a>
            }
          </div>
        }

        <!-- Grid View -->
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            @for (job of jobs(); track job.id) {
              <a
                [routerLink]="['/jobs', job.id]"
                class="relative z-10 bg-dark-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-primary/30 hover:bg-dark-surface transition-all duration-200 cursor-pointer group flex flex-col"
              >
                <!-- Score accent bar top -->
                <div class="flex items-center gap-2 mb-3">
                  <div
                    class="h-1 flex-1 rounded-full"
                    [class]="
                      job.score >= 80
                        ? 'bg-green-500'
                        : job.score >= 60
                          ? 'bg-yellow-500'
                          : job.score >= 40
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                    "
                  ></div>
                </div>

                <!-- Title -->
                <h3
                  class="text-sm font-semibold text-white group-hover:text-primary transition-colors mb-1 line-clamp-2"
                >
                  {{ job.title }}
                </h3>

                <!-- Company -->
                <p class="text-xs text-text-muted mb-3">{{ job.company }}</p>

                <!-- Location -->
                <p class="text-xs text-text-muted/60 mb-4 flex items-center gap-1">
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
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {{ job.location }}
                </p>

                <!-- Badges row -->
                <div class="flex items-center gap-2 mt-auto">
                  <app-score-badge [score]="job.score" />
                  <app-status-chip [status]="job.status" />
                </div>

                <!-- Platform + Time -->
                <div class="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <span
                    class="text-xs px-2 py-0.5 rounded-full border"
                    [class]="job.platform | platformClass"
                    >{{ job.platform }}</span
                  >
                  <span class="text-xs text-text-muted/60">{{ job.foundAt | relativeTime }}</span>
                </div>
              </a>
            }
          </div>
        }

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex items-center justify-between mt-6">
            <span class="text-sm text-text-muted">
              Pagina {{ currentPage() }} de {{ totalPages() }}
            </span>
            <div class="flex gap-2">
              <button
                class="btn-secondary text-sm flex items-center gap-1"
                [disabled]="currentPage() <= 1"
                (click)="currentPage.set(currentPage() - 1); loadJobs()"
              >
                <app-chevron-left-icon [size]="16" [strokeWidth]="2" />
                Anterior
              </button>
              <button
                class="btn-secondary text-sm flex items-center gap-1"
                [disabled]="currentPage() >= totalPages()"
                (click)="currentPage.set(currentPage() + 1); loadJobs()"
              >
                Proxima
                <app-chevron-right-icon [size]="16" [strokeWidth]="2" />
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class JobsListComponent implements OnInit, OnDestroy {
  private readonly jobsService = inject(JobsService);
  private readonly toastService = inject(ToastService);
  private readonly search$ = new Subject<string>();
  private searchSub?: Subscription;
  private readonly scanStop$ = new Subject<void>();

  jobs = signal<Job[]>([]);
  loading = signal(false);
  searching = signal(false);
  scanning = signal(false);
  error = signal('');
  success = signal('');
  total = signal(0);
  currentPage = signal(1);
  totalPages = signal(0);

  searchTerm = signal('');
  platformFilter = signal('all');
  statusFilter = signal('all');
  minScore = signal(0);
  sortBy = signal('score');
  sortOrder = signal<'asc' | 'desc'>('desc');
  viewMode = signal<'list' | 'grid'>(
    (localStorage.getItem('jobsViewMode') as 'list' | 'grid') || 'list',
  );

  private readonly _viewModeEffect = effect(() => {
    localStorage.setItem('jobsViewMode', this.viewMode());
  });

  hasActiveFilters = computed(
    () =>
      this.searchTerm() !== '' ||
      this.platformFilter() !== 'all' ||
      this.statusFilter() !== 'all' ||
      this.minScore() > 0,
  );

  platformOptions: SelectOption[] = [
    { value: 'all', label: 'Todas plataformas' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'gupy', label: 'Gupy', icon: '🎯' },
    { value: 'vagas', label: 'Vagas.com', icon: '📋' },
  ];

  statusOptions: SelectOption[] = [
    { value: 'all', label: 'Todos status' },
    { value: 'Nova', label: 'Nova', icon: '✨' },
    { value: 'Visualizada', label: 'Visualizada', icon: '👁️' },
    { value: 'Candidatou', label: 'Candidatou', icon: '📤' },
  ];

  scoreOptions: SelectOption[] = [
    { value: '0', label: 'Score mínimo' },
    { value: '50', label: '≥ 50%' },
    { value: '60', label: '≥ 60%' },
    { value: '70', label: '≥ 70%' },
    { value: '80', label: '≥ 80%' },
  ];

  sortOptions: SelectOption[] = [
    { value: 'found_at', label: 'Data de encontro' },
    { value: 'score', label: 'Score' },
    { value: 'created_at', label: 'Data de criacao' },
  ];

  ngOnInit(): void {
    this.searchSub = this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.currentPage.set(1);
        this.searching.set(false);
        this.loadJobs();
      });
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.scanStop$.next();
    this.scanStop$.complete();
  }

  searchSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`;

  onSearchChange(value: string): void {
    this.searching.set(true);
    this.search$.next(value);
  }

  loadJobs(): void {
    this.loading.set(true);
    this.error.set('');
    const filters: JobFilters = {
      search: this.searchTerm() || undefined,
      platform: this.platformFilter() !== 'all' ? this.platformFilter() : undefined,
      status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
      minScore: this.minScore() > 0 ? this.minScore() : undefined,
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
      page: this.currentPage(),
      perPage: 20,
    };

    this.jobsService.getJobs(filters).subscribe({
      next: (res) => {
        this.jobs.set(res.items);
        this.total.set(res.total);
        this.totalPages.set(res.pages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Erro ao carregar vagas. Tente novamente.');
      },
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.platformFilter.set('all');
    this.statusFilter.set('all');
    this.minScore.set(0);
    this.currentPage.set(1);
    this.loadJobs();
  }

  triggerScan(): void {
    if (this.scanning()) return;
    this.scanning.set(true);
    this.error.set('');
    this.success.set('');
    this.jobsService.scanJobs().subscribe({
      next: () => this.pollScanStatus(),
      error: (err) => {
        this.scanning.set(false);
        if (err?.status === 409) {
          this.toastService.warning('Varredura ja esta em execucao. Aguarde.');
          this.pollScanStatus();
        } else {
          this.toastService.error('Erro ao iniciar varredura. Tente novamente.');
        }
      },
    });
  }

  private pollScanStatus(): void {
    this.scanStop$.next(); // Cancel any existing poll
    interval(2000)
      .pipe(
        switchMap(() => this.jobsService.getScanStatus()),
        takeWhile((s) => s.status === 'running', true),
        takeUntil(this.scanStop$),
      )
      .subscribe({
        next: (status) => {
          if (status.status !== 'running') {
            this.scanning.set(false);
            this.loadJobs();
            if (status.status === 'completed' && status.result) {
              const r = status.result;
              if (r.new_jobs > 0) {
                this.toastService.success(`${r.new_jobs} nova(s) vaga(s) encontrada(s)!`);
              } else {
                this.toastService.info('Nenhuma vaga nova encontrada.');
              }
            } else if (status.status === 'failed') {
              this.toastService.error(status.error || 'Varredura falhou.');
            }
          }
        },
        error: () => {
          this.scanning.set(false);
          this.toastService.error('Erro ao verificar status da varredura.');
        },
      });
  }

  onScoreChange(value: string): void {
    this.minScore.set(parseInt(value, 10));
    this.loadJobs();
  }
}
