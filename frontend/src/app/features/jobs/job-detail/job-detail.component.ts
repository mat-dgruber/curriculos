import { Component, input } from '@angular/core';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-white mb-6">Detalhe da Vaga</h1>
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <p class="text-gray-400">Selecione uma vaga na lista para ver os detalhes.</p>
      </div>
    </div>
  `
})
export class JobDetailComponent {
  jobId = input<string>('');
}
