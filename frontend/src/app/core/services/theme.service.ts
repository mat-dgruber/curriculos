import { Injectable, signal, computed } from '@angular/core';

export type ThemeId = 'dark' | 'light' | 'capycro' | 'high-contrast';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Tema ativo (persistido em localStorage) */
  currentTheme = signal<ThemeId>('dark');

  /** Compatibilidade: true quando tema é dark */
  isDark = computed(() => this.currentTheme() === 'dark');

  /** Lista de temas disponíveis para o selector */
  readonly themes: { id: ThemeId; label: string; icon: string }[] = [
    { id: 'dark', label: 'Dark Tech', icon: '🌙' },
    { id: 'light', label: 'Light Fintech', icon: '☀️' },
    { id: 'capycro', label: 'Capycro Wellness', icon: '🌿' },
    { id: 'high-contrast', label: 'Alto Contraste', icon: '◐' },
  ];

  private static readonly STORAGE_KEY = 'jobhunter_theme';
  private static readonly THEME_CLASSES: ThemeId[] = ['dark', 'light', 'capycro', 'high-contrast'];

  constructor() {
    this.currentTheme.set(this._loadSaved());
    this._apply();
  }

  setTheme(theme: ThemeId): void {
    this.currentTheme.set(theme);
    localStorage.setItem(ThemeService.STORAGE_KEY, theme);
    this._apply();
  }

  /** Para compatibilidade com código legado que ainda chama toggle() */
  toggle(): void {
    const next = this.isDark() ? 'light' : 'dark';
    this.setTheme(next);
  }

  private _apply(): void {
    const root = document.documentElement;
    // Remove todas as classes de tema
    for (const cls of ThemeService.THEME_CLASSES) {
      root.classList.remove(cls);
    }
    // Aplica o tema ativo
    root.classList.add(this.currentTheme());
    // Define color-scheme para forms nativos
    root.style.colorScheme =
      this.currentTheme() === 'light' || this.currentTheme() === 'capycro'
        ? 'light'
        : 'dark';
  }

  private _loadSaved(): ThemeId {
    const raw = localStorage.getItem(ThemeService.STORAGE_KEY);
    if (raw && ThemeService.THEME_CLASSES.includes(raw as ThemeId)) {
      return raw as ThemeId;
    }
    // Migração: verificar formato antigo 'dark'/'light'
    if (raw === 'dark' || raw === 'light') {
      return raw as ThemeId;
    }
    return 'dark';
  }
}
