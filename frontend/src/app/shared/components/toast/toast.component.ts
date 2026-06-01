import { Component, inject } from '@angular/core';
import { XIconComponent } from '../x-icon/x-icon.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [XIconComponent],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="flex items-start gap-3 px-4 py-3 rounded-lg shadow-2xl border backdrop-blur-sm animate-slide-in"
          [class]="getToastClasses(toast.type)"
          role="alert"
        >
          <span class="text-lg mt-0.5 shrink-0">{{ getIcon(toast.type) }}</span>
          <p class="text-sm font-medium flex-1">{{ toast.message }}</p>
          <button
            (click)="toastService.dismiss(toast.id)"
            class="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
          >
            <app-x-icon [size]="16" [strokeWidth]="2" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .animate-slide-in {
        animation: slideIn 0.3s ease-out;
      }
    `,
  ],
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  getToastClasses(type: string): string {
    const base = 'bg-dark-surface/95';
    switch (type) {
      case 'success':
        return `${base} border-success/40 text-success`;
      case 'error':
        return `${base} border-error/40 text-error`;
      case 'warning':
        return `${base} border-warning/40 text-warning`;
      case 'info':
        return `${base} border-primary/40 text-primary`;
      default:
        return `${base} border-dark-border text-text-main`;
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  }
}
