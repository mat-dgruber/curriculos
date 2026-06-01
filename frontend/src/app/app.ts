import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { SchedulerService } from './core/services/scheduler.service';
import { SchedulerStatus } from './core/models/profile.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly schedulerService = inject(SchedulerService);
  protected readonly schedulerStatus = signal<SchedulerStatus | null>(null);

  ngOnInit(): void {
    this.schedulerService.getStatus().subscribe(status => {
      this.schedulerStatus.set(status);
    });
  }

  onScanNow(): void {
    this.schedulerService.triggerJob('scan_jobs').subscribe();
  }
}
