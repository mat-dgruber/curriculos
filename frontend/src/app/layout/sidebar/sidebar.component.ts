import { Component, input, output, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { PlugConnectedIconComponent } from '../../shared/components/plug-connected-icon/plug-connected-icon.component';
import { DashboardIconComponent } from '../../shared/components/dashboard-icon/dashboard-icon.component';
import { BriefcaseIconComponent } from '../../shared/components/briefcase-icon/briefcase-icon.component';
import { SendIconComponent } from '../../shared/components/send-icon/send-icon.component';
import { BuildingIconComponent } from '../../shared/components/building-icon/building-icon.component';
import { UserIconComponent } from '../../shared/components/user-icon/user-icon.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    PlugConnectedIconComponent,
    DashboardIconComponent,
    BriefcaseIconComponent,
    SendIconComponent,
    BuildingIconComponent,
    UserIconComponent,
  ],
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
  template: `
    <!-- Mobile backdrop -->
    @if (mobileOpen()) {
      <div
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        (click)="mobileClose.emit()"
      ></div>
    }

    <aside
      class="fixed z-50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
      [class.sidebar-desktop]="!isMobile()"
      [class.sidebar-mobile]="isMobile()"
      [class.sidebar-mobile-open]="isMobile() && mobileOpen()"
      [class.sidebar-collapsed]="!expanded() && !isMobile()"
      [class.sidebar-expanded]="expanded() && !isMobile()"
    >
      <!-- Logo -->
      <div class="p-4 flex items-center justify-center shrink-0">
        <div
          class="w-10 h-10 rounded-2xl logo-gradient logo-shadow flex items-center justify-center shrink-0"
        >
          <app-plug-connected-icon [size]="20" [strokeWidth]="2" class="text-white-absolute" />
        </div>
        @if (expanded() || isMobile()) {
          <div class="ml-3 overflow-hidden whitespace-nowrap">
            <h1 class="text-base font-bold text-white tracking-tight">JobHunter</h1>
            <p class="text-[9px] text-text-muted/60 uppercase tracking-[0.2em]">Assistente</p>
          </div>
        }
      </div>

      <div class="mx-3 h-px shrink-0" style="background: var(--glass-border);"></div>

      <!-- Navigation -->
      <nav class="flex-1 p-2.5 space-y-1 overflow-hidden shrink-0">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-primary/15 text-primary shadow-sm shadow-primary/10"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-white/5 border border-transparent transition-all duration-200 text-sm font-medium group relative"
            [class.justify-center]="!expanded() && !isMobile()"
            (click)="onNavClick()"
          >
            <span
              class="shrink-0 w-5 h-5 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity"
            >
              @switch (item.route) {
                @case ('/dashboard') {
                  <app-dashboard-icon [size]="20" [strokeWidth]="1.5" />
                }
                @case ('/jobs') {
                  <app-briefcase-icon [size]="20" [strokeWidth]="1.5" />
                }
                @case ('/applications') {
                  <app-send-icon [size]="20" [strokeWidth]="1.5" />
                }
                @case ('/companies') {
                  <app-building-icon [size]="20" [strokeWidth]="1.5" />
                }
                @case ('/profile') {
                  <app-user-icon [size]="20" [strokeWidth]="1.5" />
                }
              }
            </span>
            @if (expanded() || isMobile()) {
              <span class="overflow-hidden whitespace-nowrap text-sm">{{ item.label }}</span>
            }
            @if (!expanded() && !isMobile()) {
              <div
                class="absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-medium text-text-main whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none glass-strong"
              >
                {{ item.label }}
              </div>
            }
          </a>
        }
      </nav>

      <!-- Footer -->
      <div class="p-3 flex items-center justify-center shrink-0">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-success animate-pulse shrink-0"></span>
          @if (expanded() || isMobile()) {
            <span class="text-[10px] text-text-muted/50">v1.0.0</span>
          }
        </div>
      </div>
    </aside>
  `,
  styles: [`
    aside {
      transition: width 0.3s ease-in-out, transform 0.3s ease-in-out;
    }

    /* Desktop sidebar */
    .sidebar-desktop {
      top: 1.5rem;
      bottom: 1.5rem;
      left: 1.5rem;
      background: var(--glass-bg);
      backdrop-filter: blur(24px) saturate(1.8);
      -webkit-backdrop-filter: blur(24px) saturate(1.8);
      border: 1px solid var(--glass-border);
      border-radius: 28px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    }

    .sidebar-desktop.sidebar-collapsed {
      width: 4.5rem;
    }

    .sidebar-desktop.sidebar-expanded {
      width: 16rem;
    }

    /* Mobile sidebar */
    .sidebar-mobile {
      top: 0;
      bottom: 0;
      left: 0;
      width: 280px;
      transform: translateX(-100%);
      background: var(--bg-elevated);
      backdrop-filter: blur(24px) saturate(1.8);
      -webkit-backdrop-filter: blur(24px) saturate(1.8);
      border-right: 1px solid var(--bg-border);
      border-radius: 0 28px 28px 0;
      box-shadow: 8px 0 32px rgba(0,0,0,0.15);
    }

    .sidebar-mobile.sidebar-mobile-open {
      transform: translateX(0);
    }
  `],
})
export class SidebarComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  expanded = signal(false);
  mobileOpen = input<boolean>(false);
  mobileClose = output<void>();

  isMobile = signal(false);

  navItems = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Vagas', route: '/jobs' },
    { label: 'Candidaturas', route: '/applications' },
    { label: 'Empresas Fixas', route: '/companies' },
    { label: 'Meu Perfil', route: '/profile' },
  ];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const checkMobile = () => {
        this.isMobile.set(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);

      // Auto-close mobile sidebar on route change
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        if (this.isMobile()) {
          this.mobileClose.emit();
        }
      });
    }
  }

  onMouseEnter(): void {
    if (!this.isMobile()) {
      this.expanded.set(true);
    }
  }

  onMouseLeave(): void {
    if (!this.isMobile()) {
      this.expanded.set(false);
    }
  }

  onNavClick(): void {
    if (this.isMobile()) {
      this.mobileClose.emit();
    }
  }
}
