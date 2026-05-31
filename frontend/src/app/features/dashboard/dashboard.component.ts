import { Component, signal } from '@angular/core';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatCardComponent],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <app-stat-card label="Vagas Encontradas" [value]="stats().totalJobs" suffix="vagas" />
        <app-stat-card label="Currículos Enviados" [value]="stats().sentApplications" />
        <app-stat-card label="Taxa de Resposta" [value]="stats().responseRate" suffix="%" />
      </div>

      <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h2 class="text-lg font-semibold text-white mb-4">Vagas Recentes</h2>
        <p class="text-gray-500">Nenhuma vaga encontrada ainda. O robô fará a primeira varredura em breve.</p>
      </div>
    </div>
  `
})
export class DashboardComponent {
  stats = signal({ totalJobs: 0, sentApplications: 0, responseRate: 0 });
}
