import { Component, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DashboardIconComponent } from '../../shared/components/dashboard-icon/dashboard-icon.component';
import { BriefcaseIconComponent } from '../../shared/components/briefcase-icon/briefcase-icon.component';
import { SendIconComponent } from '../../shared/components/send-icon/send-icon.component';
import { BuildingIconComponent } from '../../shared/components/building-icon/building-icon.component';
import { UserIconComponent } from '../../shared/components/user-icon/user-icon.component';

@Component({
  selector: 'app-mobile-bottom-nav',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    DashboardIconComponent,
    BriefcaseIconComponent,
    SendIconComponent,
    BuildingIconComponent,
    UserIconComponent,
  ],
  template: `
    <nav
      class="fixed bottom-3 left-3 right-3 z-50 md:hidden safe-area-bottom glass-strong"
      style="border-radius: 24px;"
    >
      <div class="flex items-center justify-around px-2 py-2.5">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="nav-item-active"
            [class.nav-item-center]="item.route === '/jobs'"
            class="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[52px] nav-item"
          >
            <span class="nav-icon">
              @switch (item.route) {
                @case ('/dashboard') {
                  <app-dashboard-icon [size]="22" [strokeWidth]="1.8" />
                }
                @case ('/jobs') {
                  <app-briefcase-icon [size]="24" [strokeWidth]="2" />
                }
                @case ('/applications') {
                  <app-send-icon [size]="22" [strokeWidth]="1.8" />
                }
                @case ('/companies') {
                  <app-building-icon [size]="22" [strokeWidth]="1.8" />
                }
                @case ('/profile') {
                  <app-user-icon [size]="22" [strokeWidth]="1.8" />
                }
              }
            </span>
          </a>
        }
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
    }

    .nav-item {
      color: var(--text-muted);
    }

    .nav-item-active {
      color: #2563eb;
      background: rgba(37, 99, 235, 0.12);
    }

    .nav-item:not(.nav-item-active):hover {
      color: var(--text-primary);
    }

    .nav-item-center {
      transform: translateY(-4px);
    }

    .nav-item-center.nav-item-active {
      background: rgba(37, 99, 235, 0.18);
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);
    }

    :host-context(.light) .nav-item:not(.nav-item-active):hover {
      color: #1e293b;
    }

    :host-context(.light) .nav-item-active {
      background: rgba(37, 99, 235, 0.1);
    }

    .safe-area-bottom {
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
  `],
})
export class MobileBottomNavComponent {
  navItems = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Candidaturas', route: '/applications' },
    { label: 'Vagas', route: '/jobs' },
    { label: 'Empresas', route: '/companies' },
    { label: 'Perfil', route: '/profile' },
  ];
}
