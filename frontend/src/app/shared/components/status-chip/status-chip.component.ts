import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  template: `
    <span
      class="inline-flex items-center px-2.5 py-0.75 rounded-full text-xs font-medium transition-all duration-300 border"
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
      Nova: 'bg-primary/15 text-primary border-primary/20',
      Visualizada: 'bg-accent/15 text-accent border-accent/20',
      Candidatou: 'bg-primary/10 text-primary border-primary/20',
      Pendente: 'bg-warning/15 text-warning border-warning/20',
      Enviado: 'bg-success/15 text-success border-success/20',
      Falhou: 'bg-error/15 text-error border-error/20',
      Arquivado: 'bg-dark-border/40 text-text-muted border-dark-border/50',
      Ativo: 'bg-success/15 text-success border-success/20',
      Pausado: 'bg-warning/15 text-warning border-warning/20',
      Respondeu: 'bg-accent/15 text-accent border-accent/20',
    };
    return colors[this.status()] || 'bg-dark-border/40 text-text-muted border-dark-border/50';
  });
}
