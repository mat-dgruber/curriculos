import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-400">{{ label() }}</span>
      </div>
      <div class="mt-2">
        <span class="text-2xl font-bold text-white">{{ value() }}</span>
        @if (suffix()) {
          <span class="text-sm text-gray-400 ml-1">{{ suffix() }}</span>
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
