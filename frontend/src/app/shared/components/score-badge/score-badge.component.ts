import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-score-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center px-2.5 py-0.75 rounded-full text-xs font-bold transition-all duration-300 border" [class]="colorClass()">
      {{ score() }}%
    </span>
  `
})
export class ScoreBadgeComponent {
  score = input.required<number>();

  colorClass = computed(() => {
    const s = this.score();
    if (s >= 80) {
      return 'bg-success/15 text-success border-success/20';
    }
    if (s >= 60) {
      return 'bg-warning/15 text-warning border-warning/20';
    }
    if (s >= 40) {
      return 'bg-accent/15 text-accent border-accent/20';
    }
    return 'bg-error/15 text-error border-error/20';
  });
}
