import { Component, input, output } from '@angular/core';
import { DateTimePipe } from '../../shared/pipes/date-time.pipe';
import { SchedulerStatus } from '../../core/models/profile.model';
import { SearchIconComponent } from '../../shared/components/search-icon/search-icon.component';
import { BellIconComponent } from '../../shared/components/bell-icon/bell-icon.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [DateTimePipe, SearchIconComponent, BellIconComponent],
  template: `
    <header class="sticky top-0 z-40 px-6 pt-4 pb-3">
      <div
        class="flex items-center justify-between px-5 py-3"
        style="background: rgba(17, 24, 39, 0.6);
               backdrop-filter: blur(20px) saturate(1.8);
               -webkit-backdrop-filter: blur(20px) saturate(1.8);
               border: 1px solid rgba(255,255,255,0.06);
               border-radius: 20px;
               box-shadow: 0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04);"
      >
        <!-- Left: Scheduler Status -->
        <div class="flex items-center gap-3">
          @if (schedulerStatus()?.isRunning) {
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);"
            >
              <span class="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span class="text-xs font-medium text-success">Robô ativo</span>
            </div>
          } @else {
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style="background: rgba(148,163,184,0.1); border: 1px solid rgba(148,163,184,0.15);"
            >
              <span class="w-2 h-2 bg-text-muted rounded-full"></span>
              <span class="text-xs font-medium text-text-muted">Robô pausado</span>
            </div>
          }

          @if (
            schedulerStatus()?.jobs &&
            schedulerStatus()!.jobs.length > 0 &&
            schedulerStatus()!.jobs[0].nextRun
          ) {
            <span class="text-[10px] text-text-muted/50 ml-2">
              Próxima: {{ schedulerStatus()!.jobs[0].nextRun | dateTime: 'relative' }}
            </span>
          }
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2">
          <button
            (click)="scanNow.emit()"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style="background: linear-gradient(135deg, #2563eb, #38bdf8);
                         box-shadow: 0 4px 12px rgba(37,99,235,0.3);"
          >
            <app-search-icon [size]="16" [strokeWidth]="2" />
            Buscar vagas
          </button>

          <!-- Notifications -->
          <button
            class="relative p-2.5 rounded-xl text-text-muted hover:text-text-main transition-all duration-200 hover:bg-white/5"
          >
            <app-bell-icon [size]="20" [strokeWidth]="1.5" />
            @if (notificationCount() > 0) {
              <span
                class="absolute -top-0.5 -right-0.5 bg-error text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-dark-surface"
              >
                {{ notificationCount() > 9 ? '9+' : notificationCount() }}
              </span>
            }
          </button>
        </div>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  schedulerStatus = input<SchedulerStatus | null>(null);
  notificationCount = input<number>(0);
  scanNow = output<void>();
}
