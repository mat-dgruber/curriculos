import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto px-4 py-3 rounded-xl border shadow-lg backdrop-blur-xl flex items-center gap-3 min-w-[280px] max-w-sm animate-slide-in"
          [class]="getToastClass(toast.type)"
          (click)="toastService.dismiss(toast.id)"
        >
          @switch (toast.type) {
            @case ('success') {
              <svg class="w-5 h-5 text-green-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            }
            @case ('error') {
              <svg class="w-5 h-5 text-red-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            }
            @case ('warning') {
              <svg class="w-5 h-5 text-yellow-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            }
            @default {
              <svg class="w-5 h-5 text-blue-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            }
          }
          <span class="text-sm font-medium">{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getToastClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'error': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      default: return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
  }
}
