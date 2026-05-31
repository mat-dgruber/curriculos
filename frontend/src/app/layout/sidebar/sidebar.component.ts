import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="fixed left-0 top-0 w-64 h-screen bg-gray-900 border-r border-gray-800 flex flex-col z-50">
      <div class="p-6 border-b border-gray-800">
        <h1 class="text-xl font-bold text-blue-400">JobHunter</h1>
        <p class="text-xs text-gray-500 mt-1">Assistente de Candidaturas</p>
      </div>
      <nav class="flex-1 p-4 space-y-1">
        @for (item of navItems; track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="bg-blue-600/20 text-blue-400 border-blue-500"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent transition-all text-sm font-medium">
            <span class="text-lg">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
      <div class="p-4 border-t border-gray-800">
        <p class="text-xs text-gray-600">v1.0.0 — MVP</p>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  navItems = [
    { label: 'Dashboard', icon: '📊', route: '/dashboard' },
    { label: 'Vagas', icon: '💼', route: '/jobs' },
    { label: 'Candidaturas', icon: '📤', route: '/applications' },
    { label: 'Empresas Fixas', icon: '🏢', route: '/companies' },
    { label: 'Meu Perfil', icon: '👤', route: '/profile' },
    { label: 'Configurações', icon: '⚙️', route: '/settings' }
  ];
}
