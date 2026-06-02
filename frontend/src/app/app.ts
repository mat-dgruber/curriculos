import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import { MobileBottomNavComponent } from './layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { SchedulerService } from './core/services/scheduler.service';
import { SchedulerStatus } from './core/models/profile.model';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, SidebarComponent, TopbarComponent, MobileBottomNavComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly schedulerService = inject(SchedulerService);
  protected readonly toastService = inject(ToastService);
  protected readonly schedulerStatus = this.schedulerService.status;

  ngOnInit(): void {
    this.schedulerService.getStatus().subscribe();
  }

  onScanNow(): void {
    this.toastService.info('Disparando varredura de vagas...');
    this.schedulerService.triggerJob('scan_jobs').subscribe({
      next: () => {
        this.toastService.success('Varredura de vagas iniciada com sucesso em segundo plano!');
      },
      error: () => {
        this.toastService.error('Erro ao disparar a varredura de vagas.');
      }
    });
  }
}
