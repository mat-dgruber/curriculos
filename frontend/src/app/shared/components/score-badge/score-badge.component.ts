import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-score-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white" [class]="colorClass()">
      {{ score() }}%
    </span>
  `
})
export class ScoreBadgeComponent {
  score = input.required<number>();

  colorClass = computed(() => {
    const s = this.score();
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-yellow-500';
    if (s >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  });
}
