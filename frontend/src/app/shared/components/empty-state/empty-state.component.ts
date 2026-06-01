import { Component, input, output } from '@angular/core';
import { InboxIconComponent } from '../inbox-icon/inbox-icon.component';
import { SearchIconComponent } from '../search-icon/search-icon.component';
import { TriangleAlertIconComponent } from '../triangle-alert-icon/triangle-alert-icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [InboxIconComponent, SearchIconComponent, TriangleAlertIconComponent],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4">
      <div class="w-16 h-16 rounded-2xl bg-dark-border/30 flex items-center justify-center mb-4 text-text-muted/50">
        @switch (icon()) {
          @case ('inbox') {
            <app-inbox-icon [size]="32" [strokeWidth]="1.5" />
          }
          @case ('search') {
            <app-search-icon [size]="32" [strokeWidth]="1.5" />
          }
          @case ('error') {
            <app-triangle-alert-icon [size]="32" [strokeWidth]="1.5" />
          }
          @default {
            <app-inbox-icon [size]="32" [strokeWidth]="1.5" />
          }
        }
      </div>
      <p class="text-sm text-text-muted text-center max-w-sm mb-2">{{ message() }}</p>
      @if (description()) {
        <p class="text-xs text-text-muted/60 text-center max-w-sm mb-4">{{ description() }}</p>
      }
      @if (actionLabel()) {
        <button (click)="action.emit()" class="btn-primary text-sm flex items-center gap-2">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `
})
export class EmptyStateComponent {
  message = input.required<string>();
  description = input<string>('');
  icon = input<'inbox' | 'search' | 'error'>('inbox');
  actionLabel = input<string>('');
  action = output<void>();
}
