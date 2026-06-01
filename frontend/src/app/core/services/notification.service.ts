import { Injectable, signal, computed } from '@angular/core';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly MAX_NOTIFICATIONS = 50;
  private readonly STORAGE_KEY = 'jobhunter_notifications';

  notifications = signal<AppNotification[]>(this._load());
  unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  add(title: string, message: string, type: AppNotification['type'] = 'info'): void {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      title,
      message,
      type,
      read: false,
      createdAt: new Date(),
    };

    this.notifications.update((list) => {
      const updated = [notification, ...list];
      return updated.slice(0, this.MAX_NOTIFICATIONS);
    });
    this._save();
  }

  markAsRead(id: string): void {
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    this._save();
  }

  markAllRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
    this._save();
  }

  clear(): void {
    this.notifications.set([]);
    this._save();
  }

  private _load(): AppNotification[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw).map((n: AppNotification) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }));
    } catch {
      return [];
    }
  }

  private _save(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications()));
  }
}
