import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TriangleAlertIconComponent } from '../../shared/components/triangle-alert-icon/triangle-alert-icon.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { ApplicationsService } from '../../core/services/applications.service';
import { ToastService } from '../../core/services/toast.service';
import { Application } from '../../core/models/application.model';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    FormsModule,
    EmptyStateComponent,
    TriangleAlertIconComponent,
    StatusChipComponent,
    RelativeTimePipe,
  ],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-white mb-6">Candidaturas</h1>

      <div class="mb-6">
        <select
          class="input-field"
          [ngModel]="statusFilter()"
          (ngModelChange)="statusFilter.set($event); loadApplications()"
        >
          <option value="all">Todos os status</option>
          <option value="Pendente">Pendente</option>
          <option value="Enviado">Enviado</option>
          <option value="Falhou">Falhou</option>
          <option value="Arquivado">Arquivado</option>
        </select>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div
              class="bg-dark-surface border border-dark-border rounded-xl p-4 flex items-center gap-4"
            >
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-dark-border/60 rounded-md w-1/3 animate-pulse"></div>
                <div class="h-3 bg-dark-border/40 rounded-md w-1/5 animate-pulse"></div>
              </div>
              <div class="h-3 w-20 bg-dark-border/30 rounded-md animate-pulse"></div>
              <div class="h-6 w-20 bg-dark-border/40 rounded-full animate-pulse"></div>
              <div class="h-6 w-16 bg-dark-border/40 rounded-lg animate-pulse"></div>
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
          <button class="btn-primary text-sm" (click)="loadApplications()">Tentar novamente</button>
        </div>
      } @else if (applications().length === 0) {
        <app-empty-state
          message="Nenhuma candidatura registrada ainda."
          description="Envie currículos para vagas e elas aparecerão aqui."
          icon="inbox"
        />
      } @else {
        <div class="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
          <table class="w-full text-left text-sm text-text-main">
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
                <tr class="border-t border-dark-border hover:bg-dark-bg/50 transition-colors">
                  <td class="px-4 py-3 font-medium text-white">{{ app.jobId }}</td>
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
                      <span class="text-xs px-2 py-1 rounded bg-primary/20 text-primary"
                        >Recorrente</span
                      >
                    } @else {
                      <span class="text-xs px-2 py-1 rounded bg-dark-bg text-text-muted"
                        >Único</span
                      >
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <p class="text-sm text-text-muted mt-4">Total: {{ total() }} candidaturas</p>
      }
    </div>
  `,
})
export class ApplicationsComponent implements OnInit {
  private readonly applicationsService = inject(ApplicationsService);
  private readonly toast = inject(ToastService);

  applications = signal<Application[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  total = signal(0);
  statusFilter = signal('all');

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading.set(true);
    this.error.set(null);
    const params: Record<string, string | number> = {};
    if (this.statusFilter() !== 'all') {
      params['status'] = this.statusFilter();
    }

    this.applicationsService.getApplications(params).subscribe({
      next: (res) => {
        this.applications.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Erro ao carregar candidaturas.');
        this.toast.error('Erro ao carregar candidaturas.');
      },
    });
  }
}
