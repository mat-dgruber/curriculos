import { Component, signal } from '@angular/core';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [EmptyStateComponent, StatusChipComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-white">Empresas Fixas</h1>
        <button (click)="showForm.set(!showForm())"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Nova Empresa
        </button>
      </div>

      @if (showForm()) {
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <h3 class="text-white font-medium mb-3">Cadastrar Empresa</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Nome da empresa"
                   class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-500" />
            <input type="url" placeholder="URL do formulário de candidatura"
                   class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-500" />
            <input type="number" placeholder="Intervalo (dias)" value="30"
                   class="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:border-blue-500" />
          </div>
          <div class="flex gap-3 mt-4">
            <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Salvar</button>
            <button (click)="showForm.set(false)"
                    class="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
          </div>
        </div>
      }

      @if (companies().length === 0) {
        <app-empty-state message="Nenhuma empresa fixa cadastrada. Adicione empresas para envio recorrente mensal." />
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (company of companies(); track company.id) {
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-white font-semibold">{{ company.name }}</h3>
                <app-status-chip [status]="company.status" />
              </div>
              <p class="text-sm text-gray-400 mb-2">{{ company.applicationUrl }}</p>
              <p class="text-xs text-gray-500">Próximo envio: {{ company.nextSendAt || 'Calculando...' }}</p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class CompaniesComponent {
  companies = signal<{ id: string; name: string; applicationUrl: string; status: string; nextSendAt: string | null }[]>([]);
  showForm = signal(false);
}
