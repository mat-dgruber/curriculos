import { Component, computed, inject, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { XIconComponent } from '../x-icon/x-icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, XIconComponent],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      @for (toast of toasts(); track toast.id) {
        <div
          class="toast-item pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl min-w-[300px] max-w-md animate-slide-in"
          [class]="toastClass(toast.type)"
          role="alert"
          aria-live="polite"
        >
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="text-xs opacity-80 mt-0.5">{{ toast.message }}</p>
            }
          </div>
          <button
            class="shrink-0 opacity-50 hover:opacity-100 transition-opacity p-1"
            (click)="remove(toast.id)"
            aria-label="Fechar"
          >
            <app-x-icon [size]="16" [strokeWidth]="2.5" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --toast-success-bg: var(--success-bg, rgba(16, 185, 129, 0.1));
      --toast-success-border: var(--success-border, rgba(16, 185, 129, 0.2));
      --toast-success-text: var(--success-color, #10b981);
      --toast-error-bg: var(--error-bg, rgba(239, 68, 68, 0.1));
      --toast-error-border: var(--error-border, rgba(239, 68, 68, 0.2));
      --toast-error-text: var(--error-color, #ef4444);
      --toast-warning-bg: var(--warning-bg, rgba(245, 158, 11, 0.1));
      --toast-warning-border: var(--warning-border, rgba(245, 158, 11, 0.2));
      --toast-warning-text: var(--warning-color, #f59e0b);
      --toast-info-bg: var(--info-bg, rgba(59, 130, 246, 0.1));
      --toast-info-border: var(--info-border, rgba(59, 130, 246, 0.2));
      --toast-info-text: var(--info-color, #3b82f6);
    }

    .toast-item {
      background: var(--toast-bg);
      border: 1px solid var(--toast-border);
      color: var(--toast-text);
      backdrop-filter: blur(12px) saturate(1.2);
      -webkit-backdrop-filter: blur(12px) saturate(1.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }

    .toast-item.success {
      --toast-bg: var(--toast-success-bg);
      --toast-border: var(--toast-success-border);
      --toast-text: var(--toast-success-text);
    }

    .toast-item.error {
      --toast-bg: var(--toast-error-bg);
      --toast-border: var(--toast-error-border);
      --toast-text: var(--toast-error-text);
    }

    .toast-item.warning {
      --toast-bg: var(--toast-warning-bg);
      --toast-border: var(--toast-warning-border);
      --toast-text: var(--toast-warning-text);
    }

    .toast-item.info {
      --toast-bg: var(--toast-info-bg);
      --toast-border: var(--toast-info-border);
      --toast-text: var(--toast-info-text);
    }

    @keyframes slide-in {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `],
})
export class ToastComponent {
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  toasts = this.toastService.toasts;

  constructor() {
    this.toastService.setDestroyRef(this.destroyRef);
  }

  toastClass(type: Toast['type']): string {
    return type;
  }

  remove(id: string) {
    this.toastService.remove(id);
  }
}