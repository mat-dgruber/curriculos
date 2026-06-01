import { Component, input, output, signal } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="buttonClasses()"
      (click)="onClick($event)"
    >
      @if (loading()) {
        <svg class="animate-spin" [class]="iconSize()" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ loadingText() }}</span>
      } @else {
        <ng-content></ng-content>
      }
    </button>
  `,
  styles: [`
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-weight: 500;
      border-radius: 0.75rem;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
      white-space: nowrap;
      user-select: none;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Sizes */
    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      line-height: 1rem;
    }

    .btn-md {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      line-height: 1.25rem;
    }

    .btn-lg {
      padding: 0.625rem 1.25rem;
      font-size: 1rem;
      line-height: 1.5rem;
    }

    /* Primary */
    .btn-primary {
      background: linear-gradient(135deg, #2563eb, #38bdf8);
      color: white;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }

    /* Secondary */
    .btn-secondary {
      background: var(--bg-surface);
      border-color: var(--bg-border);
      color: var(--text-primary);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--bg-elevated);
      border-color: rgba(37, 99, 235, 0.3);
    }

    /* Ghost */
    .btn-ghost {
      background: transparent;
      color: var(--text-muted);
    }

    .btn-ghost:hover:not(:disabled) {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    /* Danger */
    .btn-danger {
      background: rgba(220, 38, 38, 0.1);
      border-color: rgba(220, 38, 38, 0.2);
      color: #dc2626;
    }

    .btn-danger:hover:not(:disabled) {
      background: rgba(220, 38, 38, 0.15);
      border-color: rgba(220, 38, 38, 0.3);
    }

    /* Icon only */
    .btn-icon {
      padding: 0.5rem;
    }

    /* Full width */
    .btn-full {
      width: 100%;
    }
  `]
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  loadingText = input<string>('Salvando...');
  iconOnly = input<boolean>(false);
  fullWidth = input<boolean>(false);

  clicked = output<Event>();

  iconSize(): string {
    const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };
    return sizes[this.size()];
  }

  buttonClasses(): string {
    const classes: string[] = ['btn', `btn-${this.variant()}`, `btn-${this.size()}`];
    if (this.iconOnly()) classes.push('btn-icon');
    if (this.fullWidth()) classes.push('btn-full');
    return classes.join(' ');
  }

  onClick(event: Event): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}
