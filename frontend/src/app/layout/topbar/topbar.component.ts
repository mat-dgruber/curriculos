import { Component, inject, input, output, signal } from '@angular/core';
import { DateTimePipe } from '../../shared/pipes/date-time.pipe';
import { SchedulerStatus } from '../../core/models/profile.model';
import { SearchIconComponent } from '../../shared/components/search-icon/search-icon.component';
import { NotificationCenterComponent } from '../../shared/components/notification-center/notification-center.component';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [DateTimePipe, SearchIconComponent, NotificationCenterComponent],
  template: `
    <header class="sticky top-0 z-30 px-3 pt-3 pb-2 md:px-6 md:pt-4 md:pb-3">
      <div
        class="flex items-center justify-between px-3 py-2.5 md:px-5 md:py-3 glass"
        style="border-radius: 20px;"
      >
        <!-- Left: Scheduler Status -->
        <div class="flex items-center gap-2 md:gap-3">
          @if (schedulerStatus()?.isRunning) {
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20"
            >
              <span class="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span class="text-xs font-medium text-success hidden sm:inline">Robô ativo</span>
            </div>
          } @else {
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-border/40 border border-dark-border/50"
            >
              <span class="w-2 h-2 bg-text-muted rounded-full"></span>
              <span class="text-xs font-medium text-text-muted hidden sm:inline">Robô pausado</span>
            </div>
          }

          @if (
            schedulerStatus()?.jobs &&
            schedulerStatus()!.jobs.length > 0 &&
            schedulerStatus()!.jobs[0].nextRun
          ) {
            <span class="text-[10px] text-text-muted/50 ml-2 hidden lg:inline">
              Próxima: {{ schedulerStatus()!.jobs[0].nextRun | dateTime: 'relative' }}
            </span>
          }
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2">
          <button
            (click)="scanNow.emit()"
            class="btn-primary flex items-center gap-2 px-3 py-2 md:px-4 text-sm font-medium"
          >
            <app-search-icon [size]="16" [strokeWidth]="2" />
            <span class="hidden sm:inline">Buscar vagas</span>
          </button>

          <!-- Theme Selector Dropdown -->
          <div class="relative">
            <button
              (click)="themeMenuOpen.update(v => !v)"
              class="p-2.5 rounded-xl text-text-muted hover:text-text-main transition-all duration-200 hover:bg-white/5"
              [title]="'Tema: ' + getCurrentThemeLabel()"
            >
              @switch (themeService.currentTheme()) {
                @case ('dark') {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                  </svg>
                }
                @case ('light') {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                }
                @case ('capycro') {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                }
                @case ('high-contrast') {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                }
              }
            </button>

            @if (themeMenuOpen()) {
              <!-- Backdrop -->
              <div class="fixed inset-0 z-40" (click)="themeMenuOpen.set(false)"></div>
              <!-- Dropdown -->
              <div class="absolute right-0 top-full mt-2 z-50 w-48 py-2 rounded-xl border border-dark-border bg-dark-surface/95 backdrop-blur-xl shadow-xl">
                @for (theme of themeService.themes; track theme.id) {
                  <button
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/5"
                    [class.text-primary]="themeService.currentTheme() === theme.id"
                    [class.font-medium]="themeService.currentTheme() === theme.id"
                    (click)="themeService.setTheme(theme.id); themeMenuOpen.set(false)">
                    <span class="text-base">{{ theme.icon }}</span>
                    <span class="flex-1">{{ theme.label }}</span>
                    @if (themeService.currentTheme() === theme.id) {
                      <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    }
                  </button>
                }
              </div>
            }
          </div>

          <!-- Notifications -->
          <app-notification-center />
        </div>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  themeService = inject(ThemeService);
  schedulerStatus = input<SchedulerStatus | null>(null);
  scanNow = output<void>();
  themeMenuOpen = signal(false);

  getCurrentThemeLabel(): string {
    const theme = this.themeService.themes.find(t => t.id === this.themeService.currentTheme());
    return theme?.label ?? '';
  }
}
