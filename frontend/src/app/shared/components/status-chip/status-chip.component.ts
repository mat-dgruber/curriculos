import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium text-white"
      [class]="colorClass()"
    >
      {{ status() }}
    </span>
  `,
})
export class StatusChipComponent {
  status = input.required<string>();

  colorClass = computed(() => {
    const colors: Record<string, string> = {
      Nova: 'bg-blue-500',
      Visualizada: 'bg-blue-400',
      Candidatou: 'bg-blue-300',
      Pendente: 'bg-yellow-500',
      Enviado: 'bg-green-500',
      Falhou: 'bg-red-500',
      Arquivado: 'bg-gray-500',
      Ativo: 'bg-green-500',
      Pausado: 'bg-yellow-500',
      Respondeu: 'bg-purple-500',
    };
    return colors[this.status()] || 'bg-gray-500';
  });
}
