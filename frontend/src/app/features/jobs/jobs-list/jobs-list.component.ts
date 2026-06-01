import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { SelectComponent, SelectOption } from '../../../shared/components/select/select.component';
import { ChevronLeftIconComponent } from '../../../shared/components/chevron-left-icon/chevron-left-icon.component';
import { ChevronRightIconComponent } from '../../../shared/components/chevron-right-icon/chevron-right-icon.component';
import { SearchIconComponent } from '../../../shared/components/search-icon/search-icon.component';
import { SpinnerIconComponent } from '../../../shared/components/spinner-icon/spinner-icon.component';
import { JobsService } from '../../../core/services/jobs.service';
import { Job, JobFilters } from '../../../core/models/job.model';

@Component({
  selector: 'app-jobs-list',
  standalone: true,
  imports: [
    FormsModule,
    EmptyStateComponent,
    ScoreBadgeComponent,
    StatusChipComponent,
    RelativeTimePipe,
    SelectComponent,
    ChevronLeftIconComponent,
    ChevronRightIconComponent,
    SearchIconComponent,
    SpinnerIconComponent,
  ],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">Vagas</h1>
          <p class="text-sm text-text-muted mt-1">{{ total() }} vagas encontradas</p>
        </div>
        <button
          class="btn-primary flex items-center gap-2"
          (click)="triggerScan()"
          [disabled]="scanning()"
        >
          @if (scanning()) {
            <app-spinner-icon [size]="16"/>
            Buscando...
          } @else {
            <app-search-icon [size]="16" [strokeWidth]="2"/>
            Buscar vagas agora
          }
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3 mb-6">
        <!-- Search -->
        <div class="relative flex-1 min-w-[240px] max-w-sm">
          <app-search-icon [size]="16" [strokeWidth]="2" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"/>
          <input
            type="text"
            placeholder="Buscar por título ou empresa..."
            class="input-field w-full pl-10"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event); loadJobs()"
          />
        </div>

        <!-- Platform -->
        <div class="w-48">
          <app-select
            [options]="platformOptions"
            [selectedValue]="platformFilter()"
            placeholder="Todas plataformas"
            (valueChange)="platformFilter.set($event); loadJobs()"
          />
        </div>

        <!-- Status -->
        <div class="w-44">
          <app-select
            [options]="statusOptions"
            [selectedValue]="statusFilter()"
            placeholder="Todos status"
            (valueChange)="statusFilter.set($event); loadJobs()"
          />
        </div>

        <!-- Score -->
        <div class="w-44">
          <app-select
            [options]="scoreOptions"
            [selectedValue]="minScore().toString()"
            placeholder="Score mínimo"
            (valueChange)="onScoreChange($event)"
          />
        </div>
      </div>

      <!-- Content -->
      @if (loading()) {
        <!-- Skeleton Loading -->
        <div class="space-y-3">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div
              class="bg-dark-surface border border-dark-border rounded-xl p-4 flex items-center gap-4"
            >
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-dark-border/60 rounded-md w-1/3 animate-pulse"></div>
                <div class="h-3 bg-dark-border/40 rounded-md w-1/5 animate-pulse"></div>
              </div>
              <div class="h-6 w-16 bg-dark-border/40 rounded-full animate-pulse"></div>
              <div class="h-6 w-20 bg-dark-border/40 rounded-lg animate-pulse"></div>
              <div class="h-3 w-20 bg-dark-border/30 rounded-md animate-pulse"></div>
            </div>
          }
        </div>
      } @else if (jobs().length === 0) {
        <app-empty-state
          message="Nenhuma vaga encontrada"
          description="Tente ajustar os filtros ou aguarde uma nova varredura do robô."
          icon="search"
          [actionLabel]="total() === 0 ? 'Buscar vagas agora' : ''"
        />
      } @else {
        <div class="space-y-2">
          @for (job of jobs(); track job.id) {
            <div
              class="bg-dark-surface border border-dark-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer group"
            >
              <!-- Job Info -->
              <div class="flex-1 min-w-0">
                <p
                  class="text-white font-medium truncate group-hover:text-primary transition-colors"
                >
                  {{ job.title }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-sm text-text-muted">{{ job.company }}</span>
                  <span class="text-text-muted/30">·</span>
                  <span class="text-xs text-text-muted/70">{{ job.location }}</span>
                </div>
              </div>

              <!-- Platform Badge -->
              <span
                class="shrink-0 text-xs px-3 py-1 rounded-lg border"
                [class]="getPlatformClass(job.platform)"
              >
                {{ job.platform }}
              </span>

              <!-- Score -->
              <app-score-badge [score]="job.score" />

              <!-- Time -->
              <span class="shrink-0 text-xs text-text-muted w-20 text-right">{{
                job.foundAt | relativeTime
              }}</span>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex items-center justify-between mt-6">
            <span class="text-sm text-text-muted">
              Página {{ currentPage() }} de {{ totalPages() }}
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
                Próxima
                <app-chevron-right-icon [size]="16" [strokeWidth]="2" />
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class JobsListComponent implements OnInit {
  private readonly jobsService = inject(JobsService);

  jobs = signal<Job[]>([]);
  loading = signal(false);
  scanning = signal(false);
  total = signal(0);
  currentPage = signal(1);
  totalPages = signal(0);

  searchTerm = signal('');
  platformFilter = signal('all');
  statusFilter = signal('all');
  minScore = signal(0);

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

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.loading.set(true);
    const filters: JobFilters = {
      search: this.searchTerm() || undefined,
      platform: this.platformFilter() !== 'all' ? this.platformFilter() : undefined,
      status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
      minScore: this.minScore() > 0 ? this.minScore() : undefined,
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
      error: () => this.loading.set(false),
    });
  }

  triggerScan(): void {
    this.scanning.set(true);
    this.jobsService.scanJobs().subscribe({
      next: () => {
        setTimeout(() => {
          this.scanning.set(false);
          this.loadJobs();
        }, 3000);
      },
      error: () => this.scanning.set(false),
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

  onScoreChange(value: string): void {
    this.minScore.set(parseInt(value, 10));
    this.loadJobs();
  }
}
