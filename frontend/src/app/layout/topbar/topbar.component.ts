import { Component, input, output } from '@angular/core';
import { SchedulerStatus } from '../../core/models/profile.model';

@Component({
  selector: 'app-topbar',
  standalone: true,
  template: `
    <header class="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <div class="flex items-center gap-3">
        @if (schedulerStatus()?.isRunning) {
          <span class="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
          <span class="text-sm text-green-400 font-medium">Robô ativo</span>
        } @else {
          <span class="w-2.5 h-2.5 bg-gray-500 rounded-full"></span>
          <span class="text-sm text-gray-500 font-medium">Robô pausado</span>
        }
      </div>
      <div class="flex items-center gap-4">
        <button (click)="scanNow.emit()"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <span>🔍</span>
          Buscar vagas agora
        </button>
        <button class="relative text-gray-400 hover:text-gray-200 transition-colors">
          <span class="text-xl">🔔</span>
          @if (notificationCount() > 0) {
            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {{ notificationCount() }}
            </span>
          }
        </button>
      </div>
    </header>
  `
})
export class TopbarComponent {
  schedulerStatus = input<SchedulerStatus | null>(null);
  notificationCount = input<number>(0);
  scanNow = output<void>();
}
