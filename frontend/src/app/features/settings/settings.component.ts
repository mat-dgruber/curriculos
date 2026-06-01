import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../core/services/toast.service';
import { TagIconComponent } from '../../shared/components/tag-icon/tag-icon.component';
import { BriefcaseIconComponent } from '../../shared/components/briefcase-icon/briefcase-icon.component';
import { MapPinIconComponent } from '../../shared/components/map-pin-icon/map-pin-icon.component';
import { CogIconComponent } from '../../shared/components/cog-icon/cog-icon.component';

import { TriangleAlertIconComponent } from '../../shared/components/triangle-alert-icon/triangle-alert-icon.component';
import { CheckIconComponent } from '../../shared/components/check-icon/check-icon.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, TagIconComponent, BriefcaseIconComponent, MapPinIconComponent, CogIconComponent, TriangleAlertIconComponent, CheckIconComponent],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-white mb-8">Configurações</h1>

      @if (loading()) {
        <!-- Skeleton -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          @for (i of [1,2,3,4]; track i) {
            <div class="bg-dark-surface border border-dark-border rounded-2xl p-6 animate-pulse">
              <div class="h-4 bg-dark-border/40 rounded w-1/3 mb-4"></div>
              <div class="flex gap-2 mb-3">
                <div class="h-7 bg-dark-border/30 rounded-full w-16"></div>
                <div class="h-7 bg-dark-border/30 rounded-full w-20"></div>
                <div class="h-7 bg-dark-border/30 rounded-full w-14"></div>
              </div>
              <div class="h-10 bg-dark-border/20 rounded-xl w-full"></div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="bg-dark-surface border border-error/20 rounded-xl p-8 text-center">
          <app-triangle-alert-icon [size]="40" [strokeWidth]="1.5" class="text-error/60 mx-auto mb-3"/>
          <p class="text-error font-medium mb-1">{{ error() }}</p>
          <button class="btn-primary text-sm mt-3" (click)="loadSettings()">Tentar novamente</button>
        </div>
      } @else {
        <!-- Bento Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

          <!-- Keywords Card -->
          <div class="bg-dark-surface border border-dark-border rounded-2xl p-6">
            <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
              <app-tag-icon [size]="20" [strokeWidth]="1.5" class="text-primary"/>
              Palavras-chave
            </h3>
            <div class="flex flex-wrap gap-2 mb-3">
              @for (kw of keywords(); track kw) {
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/20">
                  {{ kw }}
                  <button (click)="removeKeyword(kw)" class="hover:text-error transition-colors ml-0.5">✕</button>
                </span>
              } @empty {
                <span class="text-text-muted text-xs">Nenhuma palavra-chave adicionada</span>
              }
            </div>
            <div class="flex gap-2">
              <input type="text" class="input-field flex-1" placeholder="Nova palavra-chave"
                     [ngModel]="newKeyword()" (ngModelChange)="newKeyword.set($event)"
                     (keyup.enter)="addKeyword()" />
              <button class="btn-secondary text-sm shrink-0" (click)="addKeyword()">+ Adicionar</button>
            </div>
          </div>

          <!-- Target Roles Card -->
          <div class="bg-dark-surface border border-dark-border rounded-2xl p-6">
            <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
              <app-briefcase-icon [size]="20" [strokeWidth]="1.5" class="text-accent"/>
              Cargos alvo
            </h3>
            <div class="flex flex-wrap gap-2 mb-3">
              @for (role of targetRoles(); track role) {
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/20">
                  {{ role }}
                  <button (click)="removeRole(role)" class="hover:text-error transition-colors ml-0.5">✕</button>
                </span>
              } @empty {
                <span class="text-text-muted text-xs">Nenhum cargo adicionado</span>
              }
            </div>
            <div class="flex gap-2">
              <input type="text" class="input-field flex-1" placeholder="Novo cargo"
                     [ngModel]="newRole()" (ngModelChange)="newRole.set($event)"
                     (keyup.enter)="addRole()" />
              <button class="btn-secondary text-sm shrink-0" (click)="addRole()">+ Adicionar</button>
            </div>
          </div>

          <!-- Locations Card -->
          <div class="bg-dark-surface border border-dark-border rounded-2xl p-6">
            <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
              <app-map-pin-icon [size]="20" [strokeWidth]="1.5" class="text-success"/>
              Localizações preferidas
            </h3>
            <div class="flex flex-wrap gap-2 mb-3">
              @for (loc of preferredLocations(); track loc) {
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-success/15 text-success border border-success/20">
                  {{ loc }}
                  <button (click)="removeLocation(loc)" class="hover:text-error transition-colors ml-0.5">✕</button>
                </span>
              } @empty {
                <span class="text-text-muted text-xs">Nenhuma localização adicionada</span>
              }
            </div>
            <div class="flex gap-2">
              <input type="text" class="input-field flex-1" placeholder="Nova localização"
                     [ngModel]="newLocation()" (ngModelChange)="newLocation.set($event)"
                     (keyup.enter)="addLocation()" />
              <button class="btn-secondary text-sm shrink-0" (click)="addLocation()">+ Adicionar</button>
            </div>
          </div>

          <!-- Automation Card -->
          <div class="bg-dark-surface border border-dark-border rounded-2xl p-6">
            <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
              <app-cog-icon [size]="20" [strokeWidth]="1.5" class="text-warning"/>
              Automação
            </h3>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Frequência de varredura</label>
                <select class="input-field w-full" [ngModel]="scanInterval()"
                        (ngModelChange)="scanInterval.set($event)">
                  <option [value]="3">A cada 3 horas</option>
                  <option [value]="6">A cada 6 horas</option>
                  <option [value]="12">A cada 12 horas</option>
                  <option [value]="24">Diariamente</option>
                </select>
              </div>
              <div class="p-3 rounded-xl" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);">
                <label class="flex items-center gap-3 cursor-pointer">
                  <div class="relative">
                    <input type="checkbox" class="sr-only peer"
                           [ngModel]="autoApply()" (ngModelChange)="autoApply.set($event)" />
                    <div class="w-10 h-5 bg-dark-border rounded-full peer peer-checked:bg-primary transition-colors"></div>
                    <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                  </div>
                  <div>
                    <span class="text-text-main text-sm font-medium">Candidatura automática</span>
                    <p class="text-text-muted text-xs">Enviar currículo para vagas com score ≥ 80%</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

        </div>

        <!-- Save Button -->
        <div class="flex justify-end mt-6">
          <button class="btn-primary" (click)="saveSettings()" [disabled]="saving()">
            @if (saving()) { Salvando... } @else { Salvar Configurações }
          </button>
          @if (saved()) {
            <span class="text-success text-sm self-center ml-3 flex items-center gap-1">
              <app-check-icon [size]="16" [strokeWidth]="2"/>
              Configurações salvas!
            </span>
          }
        </div>
      }
    </div>
  `
})
export class SettingsComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  error = signal<string | null>(null);

  keywords = signal<string[]>([]);
  targetRoles = signal<string[]>([]);
  preferredLocations = signal<string[]>([]);
  scanInterval = signal(6);
  autoApply = signal(false);

  newKeyword = signal('');
  newRole = signal('');
  newLocation = signal('');

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);
    this.error.set(null);
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.keywords.set(profile.keywords || []);
        this.targetRoles.set(profile.targetRoles || []);
        this.preferredLocations.set(profile.preferredLocations || []);
        this.scanInterval.set(profile.scanIntervalHours);
        this.autoApply.set(profile.autoApply);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar configurações.');
        this.loading.set(false);
        this.toast.error('Erro ao carregar configurações.');
      },
    });
  }

  addKeyword(): void {
    const kw = this.newKeyword().trim();
    if (kw && !this.keywords().includes(kw)) {
      this.keywords.update(k => [...k, kw]);
      this.newKeyword.set('');
    }
  }

  removeKeyword(kw: string): void {
    this.keywords.update(k => k.filter(x => x !== kw));
  }

  addRole(): void {
    const role = this.newRole().trim();
    if (role && !this.targetRoles().includes(role)) {
      this.targetRoles.update(r => [...r, role]);
      this.newRole.set('');
    }
  }

  removeRole(role: string): void {
    this.targetRoles.update(r => r.filter(x => x !== role));
  }

  addLocation(): void {
    const loc = this.newLocation().trim();
    if (loc && !this.preferredLocations().includes(loc)) {
      this.preferredLocations.update(l => [...l, loc]);
      this.newLocation.set('');
    }
  }

  removeLocation(loc: string): void {
    this.preferredLocations.update(l => l.filter(x => x !== loc));
  }

  saveSettings(): void {
    this.saving.set(true);
    this.profileService.updateProfile({
      keywords: this.keywords(),
      targetRoles: this.targetRoles(),
      preferredLocations: this.preferredLocations(),
      scanIntervalHours: this.scanInterval(),
      autoApply: this.autoApply(),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        this.toast.success('Configurações salvas com sucesso!');
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Erro ao salvar configurações.');
      },
    });
  }
}
