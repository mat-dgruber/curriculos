import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(true);

  constructor() {
    const saved = localStorage.getItem('theme');
    this.isDark.set(saved ? saved === 'dark' : true);
    this._apply();
  }

  toggle(): void {
    this.isDark.update((v) => !v);
    localStorage.setItem('theme', this.isDark() ? 'dark' : 'light');
    this._apply();
  }

  private _apply(): void {
    const root = document.documentElement;
    root.classList.toggle('dark', this.isDark());
    root.classList.toggle('light', !this.isDark());
  }
}
