import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-12 text-gray-400">
      <span class="text-4xl mb-4">📭</span>
      <p class="text-lg mb-4">{{ message() }}</p>
      @if (actionLabel()) {
        <button (click)="action.emit()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `
})
export class EmptyStateComponent {
  message = input.required<string>();
  icon = input<string>('inbox');
  actionLabel = input<string>('');
  action = output<void>();
}
