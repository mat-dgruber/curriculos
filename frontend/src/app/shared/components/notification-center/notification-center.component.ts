import { Component, inject, signal, HostListener } from '@angular/core';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [RelativeTimePipe],
  template: `
    <div class="relative" (click)="$event.stopPropagation()">
      <!-- Bell Button -->
      <button
        (click)="togglePanel()"
        class="relative p-2.5 rounded-xl text-text-muted hover:text-text-main transition-all duration-200 hover:bg-white/5"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
        </svg>
        @if (notifService.unreadCount() > 0) {
          <span class="absolute -top-0.5 -right-0.5 bg-error text-white text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1 ring-2 ring-dark-surface">
            {{ notifService.unreadCount() > 9 ? '9+' : notifService.unreadCount() }}
          </span>
        }
      </button>

      <!-- Panel -->
      @if (isOpen()) {
        <div class="absolute right-0 top-full mt-2 w-80 max-h-96 rounded-2xl border border-dark-border overflow-hidden z-50 notif-panel">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-dark-border">
            <h3 class="text-sm font-semibold text-text-main">Notificações</h3>
            <div class="flex items-center gap-2">
              @if (notifService.unreadCount() > 0) {
                <button (click)="notifService.markAllRead()" class="text-xs text-primary hover:text-accent transition-colors">
                  Marcar todas como lidas
                </button>
              }
              @if (notifService.notifications().length > 0) {
                <button (click)="notifService.clear()" class="text-xs text-text-muted hover:text-error transition-colors">
                  Limpar
                </button>
              }
            </div>
          </div>

          <!-- Notification List -->
          <div class="overflow-y-auto max-h-72">
            @for (notif of notifService.notifications(); track notif.id) {
              <div
                (click)="notifService.markAsRead(notif.id)"
                class="flex items-start gap-3 px-4 py-3 border-b border-dark-border/50 cursor-pointer transition-colors notif-item"
                [class.notif-unread]="!notif.read"
              >
                <div class="mt-0.5 flex-shrink-0">
                  @switch (notif.type) {
                    @case ('success') {
                      <div class="w-7 h-7 rounded-lg flex items-center justify-center bg-success/15">
                        <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    }
                    @case ('error') {
                      <div class="w-7 h-7 rounded-lg flex items-center justify-center bg-error/15">
                        <svg class="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </div>
                    }
                    @case ('warning') {
                      <div class="w-7 h-7 rounded-lg flex items-center justify-center bg-warning/15">
                        <svg class="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                      </div>
                    }
                    @default {
                      <div class="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/15">
                        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                    }
                  }
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-text-main truncate">{{ notif.title }}</p>
                    @if (!notif.read) {
                      <span class="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                    }
                  </div>
                  <p class="text-xs text-text-muted mt-0.5 line-clamp-2">{{ notif.message }}</p>
                  <p class="text-[10px] text-text-muted/60 mt-1">{{ notif.createdAt | relativeTime }}</p>
                </div>
              </div>
            } @empty {
              <div class="px-4 py-8 text-center">
                <svg class="w-8 h-8 text-text-muted/30 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
                </svg>
                <p class="text-sm text-text-muted">Nenhuma notificação</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .notif-panel {
      background: var(--bg-elevated);
      border: 1px solid var(--bg-border);
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    }
    .notif-item:hover {
      background: var(--bg-hover);
    }
    .notif-unread {
      background: rgba(37,99,235,0.04);
    }
  `]
})
export class NotificationCenterComponent {
  notifService = inject(NotificationService);
  isOpen = signal(false);

  togglePanel(): void {
    this.isOpen.update((v) => !v);
  }

  @HostListener('document:click')
  closePanel(): void {
    this.isOpen.set(false);
  }
}
