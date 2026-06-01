import { Component, inject, input, output } from '@angular/core';
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
              class="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);"
            >
              <span class="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span class="text-xs font-medium text-success hidden sm:inline">Robô ativo</span>
            </div>
          } @else {
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style="background: rgba(148,163,184,0.1); border: 1px solid rgba(148,163,184,0.15);"
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
            class="flex items-center gap-2 px-3 py-2 md:px-4 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style="background: linear-gradient(135deg, #2563eb, #38bdf8);
                         box-shadow: 0 4px 12px rgba(37,99,235,0.3);"
          >
            <app-search-icon [size]="16" [strokeWidth]="2" />
            <span class="hidden sm:inline">Buscar vagas</span>
          </button>

          <!-- Theme Toggle -->
          <button
            (click)="themeService.toggle()"
            class="p-2.5 rounded-xl text-text-muted hover:text-text-main transition-all duration-200 hover:bg-white/5"
            [title]="themeService.isDark() ? 'Modo claro' : 'Modo escuro'"
          >
            @if (themeService.isDark()) {
              <!-- Sun icon -->
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            } @else {
              <!-- Moon icon -->
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            }
          </button>

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
}
