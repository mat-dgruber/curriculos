import { Injectable, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; callback: () => void };
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  private _destroyRef: DestroyRef | null = null;

  readonly toasts = computed(() => this._toasts());

  setDestroyRef(destroyRef: DestroyRef) {
    this._destroyRef = destroyRef;
  }

  show(toast: Omit<Toast, 'id' | 'createdAt'>) {
    const id = crypto.randomUUID();
    const newToast: Toast = {
      ...toast,
      id,
      createdAt: new Date(),
      duration: toast.duration ?? 5000,
    };

    this._toasts.update(toasts => [...toasts, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      if (this._destroyRef) {
        interval(newToast.duration).pipe(takeUntilDestroyed(this._destroyRef)).subscribe(() => {
          this.remove(id);
        });
      } else {
        setTimeout(() => this.remove(id), newToast.duration);
      }
    }
  }

  success(title: string, message?: string, duration?: number) {
    this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration?: number) {
    this.show({ type: 'error', title, message, duration: duration ?? 7000 });
  }

  warning(title: string, message?: string, duration?: number) {
    this.show({ type: 'warning', title, message, duration });
  }

  info(title: string, message?: string, duration?: number) {
    this.show({ type: 'info', title, message, duration });
  }

  remove(id: string) {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  clear() {
    this._toasts.set([]);
  }
}