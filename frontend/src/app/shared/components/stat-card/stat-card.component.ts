import { Component, input } from '@angular/core';
import { TrendingUpIconComponent } from '../trending-up-icon/trending-up-icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [TrendingUpIconComponent],
  template: `
    <div class="bg-dark-surface border border-dark-border rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-medium text-text-muted uppercase tracking-wider">{{ label() }}</span>
        <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors text-primary">
          <app-trending-up-icon [size]="16" [strokeWidth]="2" />
        </div>
      </div>
      <div class="flex items-baseline gap-1">
        <span class="text-3xl font-bold text-white tracking-tight">{{ value() }}</span>
        @if (suffix()) {
          <span class="text-sm font-medium text-text-muted">{{ suffix() }}</span>
        }
      </div>
    </div>
  `
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<number>();
  suffix = input<string>('');
  icon = input<string>('');
}
