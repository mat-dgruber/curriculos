import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PlugConnectedIconComponent } from '../../shared/components/plug-connected-icon/plug-connected-icon.component';
import { DashboardIconComponent } from '../../shared/components/dashboard-icon/dashboard-icon.component';
import { BriefcaseIconComponent } from '../../shared/components/briefcase-icon/briefcase-icon.component';
import { SendIconComponent } from '../../shared/components/send-icon/send-icon.component';
import { BuildingIconComponent } from '../../shared/components/building-icon/building-icon.component';
import { UserIconComponent } from '../../shared/components/user-icon/user-icon.component';
import { CogIconComponent } from '../../shared/components/cog-icon/cog-icon.component';

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
    CogIconComponent,
  ],
  host: {
    '(mouseenter)': 'expanded.set(true)',
    '(mouseleave)': 'expanded.set(false)',
  },
  template: `
    <aside
      class="fixed left-6 top-6 bottom-6 z-50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
      [class.w-18]="!expanded()"
      [class.w-64]="expanded()"
      style="background: rgba(17, 24, 39, 0.65);
             backdrop-filter: blur(24px) saturate(1.8);
             -webkit-backdrop-filter: blur(24px) saturate(1.8);
             border: 1px solid rgba(255,255,255,0.07);
             border-radius: 28px;
             box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);"
    >
      <!-- Logo -->
      <div class="p-4 flex items-center justify-center shrink-0">
        <div
          class="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 shrink-0"
        >
          <app-plug-connected-icon [size]="20" [strokeWidth]="2" class="text-white" />
        </div>
        @if (expanded()) {
          <div class="ml-3 overflow-hidden whitespace-nowrap">
            <h1 class="text-base font-bold text-white tracking-tight">JobHunter</h1>
            <p class="text-[9px] text-text-muted/60 uppercase tracking-[0.2em]">Assistente</p>
          </div>
        }
      </div>

      <div class="mx-3 h-px bg-white/5 shrink-0"></div>

      <!-- Navigation -->
      <nav class="flex-1 p-2.5 space-y-1 overflow-hidden shrink-0">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-primary/15 text-primary shadow-sm shadow-primary/10"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-white/5 border border-transparent transition-all duration-200 text-sm font-medium group relative"
            [class.justify-center]="!expanded()"
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
                @case ('/settings') {
                  <app-cog-icon [size]="20" [strokeWidth]="1.5" />
                }
              }
            </span>
            @if (expanded()) {
              <span class="overflow-hidden whitespace-nowrap text-sm">{{ item.label }}</span>
            }
            @if (!expanded()) {
              <div
                class="absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none"
                style="background: rgba(17, 24, 39, 0.95); border: 1px solid rgba(255,255,255,0.1);"
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
          @if (expanded()) {
            <span class="text-[10px] text-text-muted/50">v1.0.0</span>
          }
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  expanded = signal(false);

  navItems = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Vagas', route: '/jobs' },
    { label: 'Candidaturas', route: '/applications' },
    { label: 'Empresas Fixas', route: '/companies' },
    { label: 'Meu Perfil', route: '/profile' },
    { label: 'Configurações', route: '/settings' },
  ];
}
