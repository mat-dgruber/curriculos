import { Component, signal } from '@angular/core';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ScoreBadgeComponent } from '../../../shared/components/score-badge/score-badge.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';

@Component({
  selector: 'app-jobs-list',
  standalone: true,
  imports: [EmptyStateComponent, ScoreBadgeComponent, StatusChipComponent],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-white mb-6">Vagas</h1>

      <div class="mb-4">
        <input type="text"
               placeholder="Buscar vaga..."
               class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 w-full max-w-md focus:outline-none focus:border-blue-500" />
      </div>

      @if (jobs().length === 0) {
        <app-empty-state message="Nenhuma vaga encontrada ainda. O robô fará a primeira varredura em breve." />
      } @else {
        <div class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <table class="w-full text-left text-sm text-gray-300">
            <thead class="bg-gray-900 text-gray-400 uppercase text-xs">
              <tr>
                <th class="px-4 py-3">Cargo</th>
                <th class="px-4 py-3">Empresa</th>
                <th class="px-4 py-3">Plataforma</th>
                <th class="px-4 py-3">Score</th>
                <th class="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (job of jobs(); track job.id) {
                <tr class="border-t border-gray-700 hover:bg-gray-750">
                  <td class="px-4 py-3 font-medium text-white">{{ job.title }}</td>
                  <td class="px-4 py-3">{{ job.company }}</td>
                  <td class="px-4 py-3">{{ job.platform }}</td>
                  <td class="px-4 py-3"><app-score-badge [score]="job.score" /></td>
                  <td class="px-4 py-3"><app-status-chip [status]="job.status" /></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class JobsListComponent {
  jobs = signal<{ id: string; title: string; company: string; platform: string; score: number; status: string }[]>([]);
}
