import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TriangleAlertIconComponent } from '../../shared/components/triangle-alert-icon/triangle-alert-icon.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { CompaniesService } from '../../core/services/companies.service';
import { ToastService } from '../../core/services/toast.service';
import { FixedCompany, FixedCompanyCreate } from '../../core/models/company.model';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [
    FormsModule,
    EmptyStateComponent,
    TriangleAlertIconComponent,
    StatusChipComponent,
    RelativeTimePipe,
  ],
  template: `
    <div class="p-4 md:p-6">
      <div class="flex items-center justify-between mb-4 md:mb-6">
        <h1 class="text-xl md:text-2xl font-bold text-white">Empresas Fixas</h1>
        <button (click)="showForm.set(!showForm())" class="btn-primary">
          @if (showForm()) {
            Fechar
          } @else {
            + Nova Empresa
          }
        </button>
      </div>

      @if (showForm()) {
        <div class="card mb-6">
          <h3 class="text-white font-medium mb-3">Cadastrar Empresa</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nome da empresa"
              class="input-field"
              [ngModel]="formName()"
              (ngModelChange)="formName.set($event)"
            />
            <input
              type="url"
              placeholder="URL do formulário"
              class="input-field"
              [ngModel]="formUrl()"
              (ngModelChange)="formUrl.set($event)"
            />
            <input
              type="number"
              placeholder="Intervalo (dias)"
              class="input-field"
              min="7"
              max="90"
              [ngModel]="formInterval()"
              (ngModelChange)="formInterval.set($event)"
            />
            <input
              type="text"
              placeholder="Notas (opcional)"
              class="input-field"
              [ngModel]="formNotes()"
              (ngModelChange)="formNotes.set($event)"
            />
          </div>
          <div class="flex gap-3 mt-4">
            <button class="btn-primary" (click)="saveCompany()" [disabled]="saving()">
              @if (saving()) {
                Salvando...
              } @else {
                Salvar
              }
            </button>
            <button class="btn-secondary" (click)="showForm.set(false)">Cancelar</button>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (i of [1, 2, 3]; track i) {
            <div class="bg-dark-surface border border-dark-border rounded-xl p-5">
              <div class="h-5 bg-dark-border/60 rounded-md w-1/2 animate-pulse mb-3"></div>
              <div class="h-3 bg-dark-border/40 rounded-md w-3/4 animate-pulse mb-2"></div>
              <div class="h-3 bg-dark-border/30 rounded-md w-1/3 animate-pulse mb-4"></div>
              <div class="flex gap-2">
                <div class="h-8 w-20 bg-dark-border/30 rounded-lg animate-pulse"></div>
                <div class="h-8 w-20 bg-dark-border/30 rounded-lg animate-pulse"></div>
              </div>
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
          <button class="btn-primary text-sm" (click)="loadCompanies()">Tentar novamente</button>
        </div>
      } @else if (companies().length === 0) {
        <app-empty-state
          message="Nenhuma empresa fixa cadastrada."
          description="Adicione empresas para envio recorrente mensal de currículos."
          icon="inbox"
        />
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (company of companies(); track company.id) {
            <div class="card">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-white font-semibold">{{ company.name }}</h3>
                <app-status-chip [status]="company.status" />
              </div>
              <p class="text-sm text-text-muted mb-2 truncate">{{ company.applicationUrl }}</p>
              <div class="flex items-center gap-4 text-xs text-text-muted mb-3">
                <span>Intervalo: {{ company.intervalDays }} dias</span>
                <span>Enviados: {{ company.totalSent }}</span>
              </div>
              <div class="flex items-center gap-4 text-xs text-text-muted mb-4">
                @if (company.lastSentAt) {
                  <span>Último: {{ company.lastSentAt | relativeTime }}</span>
                }
                @if (company.nextSendAt) {
                  <span>Próximo: {{ company.nextSendAt | relativeTime }}</span>
                }
              </div>
              <div class="flex gap-2">
                <button class="btn-secondary text-xs" (click)="toggleCompany(company)">
                  {{ company.isActive ? 'Pausar' : 'Ativar' }}
                </button>
                <button
                  class="btn-secondary text-xs text-error hover:bg-error/20"
                  (click)="deleteCompany(company)"
                >
                  Remover
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class CompaniesComponent implements OnInit {
  private readonly companiesService = inject(CompaniesService);
  private readonly toast = inject(ToastService);

  companies = signal<FixedCompany[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  saving = signal(false);
  showForm = signal(false);

  formName = signal('');
  formUrl = signal('');
  formInterval = signal(30);
  formNotes = signal('');

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loading.set(true);
    this.error.set(null);
    this.companiesService.getCompanies().subscribe({
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

  saveCompany(): void {
    if (!this.formName() || !this.formUrl()) return;
    this.saving.set(true);
    const data: FixedCompanyCreate = {
      name: this.formName(),
      applicationUrl: this.formUrl(),
      intervalDays: this.formInterval(),
      notes: this.formNotes() || undefined,
    };
    this.companiesService.createCompany(data).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.formName.set('');
        this.formUrl.set('');
        this.formInterval.set(30);
        this.formNotes.set('');
        this.loadCompanies();
        this.toast.success('Empresa cadastrada com sucesso!');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Erro ao cadastrar empresa.');
      },
    });
  }

  toggleCompany(company: FixedCompany): void {
    this.companiesService.toggleCompany(company.id).subscribe({
      next: () => {
        this.loadCompanies();
        this.toast.success(company.isActive ? 'Empresa pausada.' : 'Empresa ativada.');
      },
      error: () => this.toast.error('Erro ao alterar status da empresa.'),
    });
  }

  deleteCompany(company: FixedCompany): void {
    if (!confirm(`Remover "${company.name}"?`)) return;
    this.companiesService.deleteCompany(company.id).subscribe({
      next: () => {
        this.loadCompanies();
        this.toast.success('Empresa removida.');
      },
      error: () => this.toast.error('Erro ao remover empresa.'),
    });
  }
}
