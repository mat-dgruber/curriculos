import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../core/services/toast.service';
import { CandidateProfile, CandidateProfileUpdate } from '../../core/models/profile.model';
import { UserIconComponent } from '../../shared/components/user-icon/user-icon.component';
import { FileTextIconComponent } from '../../shared/components/file-text-icon/file-text-icon.component';
import { CircleCheckIconComponent } from '../../shared/components/circle-check-icon/circle-check-icon.component';
import { CloudUploadIconComponent } from '../../shared/components/cloud-upload-icon/cloud-upload-icon.component';
import { TriangleAlertIconComponent } from '../../shared/components/triangle-alert-icon/triangle-alert-icon.component';
import { CheckIconComponent } from '../../shared/components/check-icon/check-icon.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, UserIconComponent, FileTextIconComponent, CircleCheckIconComponent, CloudUploadIconComponent, TriangleAlertIconComponent, CheckIconComponent],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-white mb-8">Meu Perfil</h1>

      @if (loading()) {
        <!-- Skeleton -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div class="lg:col-span-2 bg-dark-surface border border-dark-border rounded-xl p-6 animate-pulse">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (i of [1,2,3,4,5,6]; track i) {
                <div>
                  <div class="h-3 bg-dark-border/40 rounded w-20 mb-2"></div>
                  <div class="h-10 bg-dark-border/30 rounded-xl w-full"></div>
                </div>
              }
            </div>
          </div>
          <div class="bg-dark-surface border border-dark-border rounded-xl p-6 animate-pulse">
            <div class="h-32 bg-dark-border/30 rounded-xl mb-4"></div>
            <div class="h-4 bg-dark-border/40 rounded w-1/2"></div>
          </div>
        </div>
      } @else if (error()) {
        <div class="bg-dark-surface border border-error/20 rounded-xl p-8 text-center">
          <app-triangle-alert-icon [size]="40" [strokeWidth]="1.5" class="text-error/60 mx-auto mb-3"/>
          <p class="text-error font-medium mb-1">{{ error() }}</p>
          <button class="btn-primary text-sm mt-3" (click)="loadProfile()">Tentar novamente</button>
        </div>
      } @else {
        <!-- Bento Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- Main Form -->
          <div class="lg:col-span-2 bg-dark-surface border border-dark-border rounded-2xl p-6">
            <h3 class="text-white font-semibold mb-5 flex items-center gap-2">
              <app-user-icon [size]="20" [strokeWidth]="1.5" class="text-primary"/>
              Dados Pessoais
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Nome completo</label>
                <input type="text" class="input-field w-full" placeholder="Seu nome"
                       [ngModel]="profileData().name" (ngModelChange)="updateField('name', $event)" />
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">E-mail</label>
                <input type="email" class="input-field w-full" placeholder="seu@email.com"
                       [ngModel]="profileData().email" (ngModelChange)="updateField('email', $event)" />
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Telefone</label>
                <input type="tel" class="input-field w-full" placeholder="+55 11 99999-0000"
                       [ngModel]="profileData().phone" (ngModelChange)="updateField('phone', $event)" />
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Localização</label>
                <input type="text" class="input-field w-full" placeholder="São Paulo, SP"
                       [ngModel]="profileData().location" (ngModelChange)="updateField('location', $event)" />
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Cargo alvo</label>
                <input type="text" class="input-field w-full" placeholder="Ex: Desenvolvedor Angular/Python"
                       [ngModel]="profileData().targetRole" (ngModelChange)="updateField('targetRole', $event)" />
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">LinkedIn</label>
                <input type="url" class="input-field w-full" placeholder="https://linkedin.com/in/seuusuario"
                       [ngModel]="profileData().linkedinUrl" (ngModelChange)="updateField('linkedinUrl', $event)" />
              </div>
            </div>
          </div>

          <!-- CV Upload Card -->
          <div class="bg-dark-surface border border-dark-border rounded-2xl p-6 flex flex-col">
            <h3 class="text-white font-semibold mb-5 flex items-center gap-2">
              <app-file-text-icon [size]="20" [strokeWidth]="1.5" class="text-accent"/>
              Currículo
            </h3>
            <div class="flex-1 flex flex-col items-center justify-center">
              @if (profileData().cvFilename) {
                <div class="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
                  <app-circle-check-icon [size]="32" [strokeWidth]="1.5" class="text-success"/>
                </div>
                <p class="text-white text-sm font-medium mb-1">{{ profileData().cvFilename }}</p>
                <p class="text-text-muted text-xs">PDF carregado</p>
              } @else {
                <div class="w-16 h-16 rounded-2xl bg-dark-border/30 flex items-center justify-center mb-3">
                  <app-cloud-upload-icon [size]="32" [strokeWidth]="1.5" class="text-text-muted/50"/>
                </div>
                <p class="text-text-muted text-sm">Nenhum CV carregado</p>
              }
              <input type="file" accept=".pdf" class="mt-3"
                     (change)="onFileSelected($event)" />
            </div>
          </div>

          <!-- Save Button -->
          <div class="lg:col-span-3 flex justify-end gap-3">
            <button class="btn-primary" (click)="saveProfile()" [disabled]="saving()">
              @if (saving()) { Salvando... } @else { Salvar Perfil }
            </button>
            @if (saved()) {
              <span class="text-success text-sm self-center flex items-center gap-1">
                <app-check-icon [size]="16" [strokeWidth]="2"/>
                Perfil salvo!
              </span>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);

  profileData = signal<Partial<CandidateProfile>>({});
  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profileData.set(profile);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar perfil.');
        this.loading.set(false);
        this.toast.error('Erro ao carregar perfil.');
      },
    });
  }

  updateField(field: keyof CandidateProfileUpdate, value: string): void {
    this.profileData.update(d => ({ ...d, [field]: value }));
    this.saved.set(false);
  }

  saveProfile(): void {
    this.saving.set(true);
    const { id, cvFilename, cvUploadedAt, createdAt, updatedAt, ...updateData } = this.profileData();
    this.profileService.updateProfile(updateData as CandidateProfileUpdate).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        this.toast.success('Perfil salvo com sucesso!');
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Erro ao salvar perfil.');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.profileService.uploadCV(file).subscribe({
        next: (res) => {
          this.profileData.update(d => ({ ...d, cvFilename: res.filename }));
          this.toast.success('Currículo carregado com sucesso!');
        },
        error: () => this.toast.error('Erro ao carregar currículo.'),
      });
    }
  }
}
