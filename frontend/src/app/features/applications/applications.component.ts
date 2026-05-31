import { Component, signal } from '@angular/core';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [EmptyStateComponent, StatusChipComponent],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-white mb-6">Candidaturas</h1>

      @if (applications().length === 0) {
        <app-empty-state message="Nenhuma candidatura registrada ainda." />
      } @else {
        <div class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <table class="w-full text-left text-sm text-gray-300">
            <thead class="bg-gray-900 text-gray-400 uppercase text-xs">
              <tr>
                <th class="px-4 py-3">Vaga</th>
                <th class="px-4 py-3">Empresa</th>
                <th class="px-4 py-3">Data</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Tipo</th>
              </tr>
            </thead>
            <tbody>
              @for (app of applications(); track app.id) {
                <tr class="border-t border-gray-700 hover:bg-gray-750">
                  <td class="px-4 py-3 font-medium text-white">{{ app.jobTitle }}</td>
                  <td class="px-4 py-3">{{ app.companyName }}</td>
                  <td class="px-4 py-3">{{ app.sentAt || 'Pendente' }}</td>
                  <td class="px-4 py-3"><app-status-chip [status]="app.status" /></td>
                  <td class="px-4 py-3">{{ app.isRecurring ? 'Recorrente' : 'Único' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class ApplicationsComponent {
  applications = signal<{ id: string; jobTitle: string; companyName: string; status: string; sentAt: string | null; isRecurring: boolean }[]>([]);
}
