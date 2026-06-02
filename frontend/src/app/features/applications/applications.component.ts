import { Component, effect, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TriangleAlertIconComponent } from '../../shared/components/triangle-alert-icon/triangle-alert-icon.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { InputComponent } from '../../shared/components/input/input.component';
import { ChevronLeftIconComponent } from '../../shared/components/chevron-left-icon/chevron-left-icon.component';
import { ChevronRightIconComponent } from '../../shared/components/chevron-right-icon/chevron-right-icon.component';
import { ApplicationsService } from '../../core/services/applications.service';
import { ToastService } from '../../core/services/toast.service';
import { Application, VALID_STATUS_TRANSITIONS, ApplicationStatus } from '../../core/models/application.model';

const SEARCH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    EmptyStateComponent,
    TriangleAlertIconComponent,
    StatusChipComponent,
    RelativeTimePipe,
    InputComponent,
    ChevronLeftIconComponent,
    ChevronRightIconComponent,
    SelectComponent,
  ],
  template: `
    <div class="p-4 md:p-6 relative overflow-hidden min-h-screen">
      <!-- Ambient background blobs -->
      <div class="blob-teal -top-12 -right-12 opacity-30 pointer-events-none"></div>
      <div class="blob-orange top-1/2 -left-20 opacity-20 pointer-events-none"></div>
      <div class="blob-gold bottom-12 right-1/4 opacity-15 pointer-events-none"></div>

      <div class="relative z-10">
        <div class="flex items-center justify-between mb-4 md:mb-6 animate-fade-in-up">
          <div>
            <h1 class="text-3xl md:text-4xl font-serif font-bold text-white">Candidaturas</h1>
            <p class="text-xs md:text-sm text-text-muted mt-1">{{ total() }} candidaturas</p>
          </div>
          <!-- View Toggle -->
          <div class="flex items-center glass-v2 rounded-full p-1">
            <button
              class="p-1.5 md:p-2 rounded-full transition-colors"
              [class]="viewMode() === 'list' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-primary/60'"
              (click)="viewMode.set('list')"
              title="Visualização em lista"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button
              class="p-1.5 md:p-2 rounded-full transition-colors"
              [class]="viewMode() === 'grid' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-white'"
              (click)="viewMode.set('grid')"
              title="Visualização em grade"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 mb-4 md:mb-6 animate-fade-in-up stagger-1 relative z-30">
          <div class="flex-1">
            <app-input
              placeholder="Buscar por vaga ou empresa..."
              [icon]="searchSvg"
              (valueChange)="onSearchChange($event)"
            />
          </div>
          <app-select
            [options]="statusOptions"
            [selectedValue]="statusFilter()"
            (valueChange)="statusFilter.set($event); currentPage.set(1); loadApplications()"
            class="w-full sm:w-48 block"
          />
        </div>

        @if (loading()) {
          <div class="space-y-3">
            @for (i of [1, 2, 3, 4, 5]; track i; let idx = $index) {
              <div
                [class]="'organic-card p-3 md:p-4 flex items-center gap-3 md:gap-4 animate-fade-in-up stagger-' + ((idx % 6) + 1)"
              >
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-dark-border/60 rounded-md w-1/3 animate-pulse"></div>
                  <div class="h-3 bg-dark-border/40 rounded-md w-1/5 animate-pulse"></div>
                </div>
                <div class="h-6 w-20 bg-dark-border/40 rounded-full animate-pulse"></div>
              </div>
            }
          </div>
        } @else if (error()) {
          <div class="organic-card p-6 md:p-8 text-center animate-fade-in-up">
            <div class="text-error/60 flex justify-center mb-3">
              <app-triangle-alert-icon [size]="40" [strokeWidth]="1.5" />
            </div>
            <p class="text-error font-serif font-semibold mb-1">{{ error() }}</p>
            <p class="text-text-muted text-sm mb-4">Tente novamente ou verifique sua conexão.</p>
            <button class="btn-primary text-sm" (click)="loadApplications()">Tentar novamente</button>
          </div>
        } @else if (applications().length === 0) {
          <app-empty-state
            message="Nenhuma candidatura registrada ainda."
            description="Envie currículos para vagas e elas aparecerão aqui."
            icon="inbox"
          />
        } @else {
          <!-- List View: Desktop Table -->
          @if (viewMode() === 'list') {
            <div class="bg-dark-surface border border-dark-border rounded-sm overflow-hidden hidden md:block animate-fade-in-up stagger-2">
              <table class="w-full text-left text-sm text-text-main font-sans">
                <thead class="bg-dark-bg text-text-muted uppercase text-xs">
                  <tr>
                    <th class="px-4 py-3">Vaga</th>
                    <th class="px-4 py-3">Empresa</th>
                    <th class="px-4 py-3">Data Envio</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  @for (app of applications(); track app.id) {
                    <tr
                      class="border-t border-dark-border hover:bg-dark-bg/50 transition-colors cursor-pointer"
                      [routerLink]="['/applications', app.id]"
                    >
                      <td class="px-4 py-3 font-serif font-medium text-white">{{ app.jobTitle }}</td>
                      <td class="px-4 py-3">{{ app.companyName }}</td>
                      <td class="px-4 py-3 text-text-muted text-xs">
                        @if (app.sentAt) {
                          {{ app.sentAt | relativeTime }}
                        } @else {
                          <span class="text-warning">Pendente</span>
                        }
                      </td>
                      <td class="px-4 py-3"><app-status-chip [status]="app.status" /></td>
                      <td class="px-4 py-3">
                        @if (app.isRecurring) {
                          <span class="text-xs px-2 py-1 rounded bg-primary/20 text-primary">Recorrente</span>
                        } @else {
                          <span class="text-xs px-2 py-1 rounded bg-dark-bg text-text-muted">Único</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- List View: Mobile Cards -->
            <div class="space-y-3 md:hidden">
              @for (app of applications(); track app.id; let idx = $index) {
                <a
                  [routerLink]="['/applications', app.id]"
                  [class]="'organic-card p-4 block animate-fade-in-up stagger-' + ((idx % 6) + 1)"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1 min-w-0 mr-3">
                      <p class="font-serif font-semibold text-white text-base truncate">{{ app.jobTitle }}</p>
                      <p class="text-xs text-text-muted mt-0.5">{{ app.companyName }}</p>
                    </div>
                    <app-status-chip [status]="app.status" />
                  </div>
                  <div class="flex items-center justify-between mt-3 pt-2 border-t border-dark-border/50">
                    <span class="text-xs text-text-muted">
                      @if (app.sentAt) {
                        {{ app.sentAt | relativeTime }}
                      } @else {
                        <span class="text-warning">Pendente</span>
                      }
                    </span>
                    @if (app.isRecurring) {
                      <span class="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary">Recorrente</span>
                    } @else {
                      <span class="text-[10px] px-2 py-0.5 rounded bg-dark-bg text-text-muted">Único</span>
                    }
                  </div>
                </a>
              }
            </div>
          }

          <!-- Grid View -->
          @if (viewMode() === 'grid') {
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in-up stagger-2">
              @for (app of applications(); track app.id; let idx = $index) {
                <a
                  [routerLink]="['/applications', app.id]"
                  [class]="'organic-card p-5 block hover:border-primary/30 transition-all animate-fade-in-up stagger-' + ((idx % 6) + 1)"
                >
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex-1 min-w-0 mr-3">
                      <p class="font-serif font-semibold text-white text-base truncate">{{ app.jobTitle }}</p>
                      <p class="text-sm text-text-muted mt-0.5">{{ app.companyName }}</p>
                    </div>
                    <app-status-chip [status]="app.status" />
                  </div>
                  <div class="flex items-center gap-4 text-xs text-text-muted">
                    <span>
                      @if (app.sentAt) {
                        {{ app.sentAt | relativeTime }}
                      } @else {
                        <span class="text-warning">Pendente</span>
                      }
                    </span>
                    @if (app.isRecurring) {
                      <span class="px-2 py-0.5 rounded bg-primary/20 text-primary">Recorrente</span>
                    } @else {
                      <span class="px-2 py-0.5 rounded bg-dark-bg text-text-muted">Único</span>
                    }
                  </div>
                  @if (app.errorMessage) {
                    <div class="mt-3 pt-3 border-t border-dark-border/50">
                      <p class="text-xs text-red-400/80 truncate">{{ app.errorMessage }}</p>
                    </div>
                  }
                </a>
              }
            </div>
          }

          @if (totalPages() > 1) {
            <div class="flex items-center justify-between mt-6 animate-fade-in-up">
              <span class="text-sm text-text-muted">
                Pagina {{ currentPage() }} de {{ totalPages() }}
              </span>
              <div class="flex gap-2">
                <button
                  class="btn-secondary text-sm flex items-center gap-1"
                  [disabled]="currentPage() <= 1"
                  (click)="currentPage.set(currentPage() - 1); loadApplications()"
                >
                  <app-chevron-left-icon [size]="16" [strokeWidth]="2" />
                  Anterior
                </button>
                <button
                  class="btn-secondary text-sm flex items-center gap-1"
                  [disabled]="currentPage() >= totalPages()"
                  (click)="currentPage.set(currentPage() + 1); loadApplications()"
                >
                  Proxima
                  <app-chevron-right-icon [size]="16" [strokeWidth]="2" />
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class ApplicationsComponent implements OnInit, OnDestroy {
  private readonly applicationsService = inject(ApplicationsService);
  private readonly toast = inject(ToastService);

  protected readonly searchSvg = SEARCH_SVG;

  statusOptions: SelectOption[] = [
    { value: 'all', label: 'Todos os status', icon: '💼' },
    { value: 'Pendente', label: 'Pendente', icon: '⏳' },
    { value: 'Enviado', label: 'Enviado', icon: '🚀' },
    { value: 'Falhou', label: 'Falhou', icon: '❌' },
    { value: 'Arquivado', label: 'Arquivado', icon: '📁' },
  ];

  applications = signal<Application[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  total = signal(0);
  totalPages = signal(0);
  currentPage = signal(1);
  statusFilter = signal('all');
  searchTerm = signal('');
  viewMode = signal<'list' | 'grid'>(
    (localStorage.getItem('applicationsViewMode') as 'list' | 'grid') || 'list',
  );

  constructor() {
    effect(() => {
      localStorage.setItem('applicationsViewMode', this.viewMode());
    });
  }

  private readonly search$ = new Subject<string>();
  private activeSub?: Subscription;

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.currentPage.set(1);
        this.loadApplications();
      });
    this.loadApplications();
  }

  onSearchChange(value: string): void {
    this.search$.next(value);
  }

  private buildParams(): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    if (this.statusFilter() !== 'all') {
      params['status'] = this.statusFilter();
    }
    if (this.searchTerm()) {
      params['search'] = this.searchTerm();
    }
    params['page'] = this.currentPage();
    params['per_page'] = 20;
    return params;
  }

  loadApplications(): void {
    this.activeSub?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    const params = this.buildParams();

    this.activeSub = this.applicationsService.getApplications(params).subscribe({
      next: (res) => {
        this.applications.set(res.items);
        this.total.set(res.total);
        this.totalPages.set(res.pages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Erro ao carregar candidaturas.');
        this.toast.error('Erro ao carregar candidaturas.');
      },
    });
  }

  ngOnDestroy(): void {
    this.activeSub?.unsubscribe();
  }
}
