# Specs — Frontend Components (Angular 21+)

## Convenções Gerais

- Todos os componentes usam **standalone components** (sem NgModules)
- Estado reativo via **signals** (`signal()`, `computed()`, `effect()`)
- Control flow: `@if`, `@for`, `@switch` — nunca `*ngIf` / `*ngFor`
- Inputs: `input()` signal-based — nunca `@Input()` decorator
- Outputs: `output()` — nunca `@Output()` / `EventEmitter`
- Change detection: **OnPush** em todos os componentes
- Lógica de negócio em `core/services/` — componentes apenas delegam

---

## 1. DashboardComponent

**Localização:** `features/dashboard/dashboard.component.ts`

### Responsabilidade
Painel principal com visão geral do sistema: métricas, vagas recentes e status do agendador.

### O que NÃO faz
- Não lista todas as vagas (isso é `JobsListComponent`)
- Não edita perfil (isso é `ProfileComponent`)

### Signals Internos
```typescript
// Carregados do serviço
stats = signal<DashboardStats>({ totalJobs: 0, sentApplications: 0, responseRate: 0 });
recentJobs = signal<Job[]>([]);
schedulerStatus = signal<SchedulerStatus>({ isRunning: false, lastScan: null, nextScan: null });

// Computed
activeJobsCount = computed(() => this.recentJobs().filter(j => j.status === 'Nova').length);
```

### Dependências
- `JobsService` — buscar vagas recentes e stats
- `ProfileService` — verificar se perfil está completo
- `SchedulerService` — status do agendador

### Template Outline
```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  <!-- Cards de métricas -->
  <app-stat-card label="Vagas Encontradas" [value]="stats().totalJobs" />
  <app-stat-card label="Currículos Enviados" [value]="stats().sentApplications" />
  <app-stat-card label="Taxa de Resposta" [value]="stats().responseRate" suffix="%" />

  <!-- Status do agendador -->
  <div class="col-span-full">
    @if (schedulerStatus().isRunning) {
      <span>Robô ativo — próxima varredura: {{ schedulerStatus().nextScan }}</span>
    } @else {
      <span>Robô pausado</span>
    }
  </div>

  <!-- Vagas recentes -->
  <div class="col-span-full">
    <h2>Vagas Recentes</h2>
    @for (job of recentJobs(); track job.id) {
      <div>{{ job.title }} — {{ job.company }} — <app-score-badge [score]="job.score" /></div>
    } @empty {
      <app-empty-state message="Nenhuma vaga encontrada ainda" />
    }
  </div>
</div>
```

---

## 2. JobsListComponent

**Localização:** `features/jobs/jobs-list/jobs-list.component.ts`

### Responsabilidade
Tabela paginada de vagas com filtros, score de compatibilidade e ação de candidatura.

### Signals Internos
```typescript
jobs = signal<Job[]>([]);
loading = signal(false);

// Filtros
searchTerm = signal('');
minScore = signal(0);
platformFilter = signal<string>('all');
statusFilter = signal<string>('all');

// Computed
filteredJobs = computed(() => {
  let result = this.jobs();
  const search = this.searchTerm().toLowerCase();
  if (search) result = result.filter(j =>
    j.title.toLowerCase().includes(search) || j.company.toLowerCase().includes(search)
  );
  if (this.minScore() > 0) result = result.filter(j => j.score >= this.minScore());
  if (this.platformFilter() !== 'all') result = result.filter(j => j.platform === this.platformFilter());
  if (this.statusFilter() !== 'all') result = result.filter(j => j.status === this.statusFilter());
  return result;
});
```

### Dependências
- `JobsService` — listar e filtrar vagas
- `ApplicationsService` — criar candidatura ao clicar "Candidatar-se"
- `Router` — navegar para `JobDetailComponent`

### Template Outline
```html
<!-- Filtros -->
<input type="text" placeholder="Buscar vaga..." (input)="searchTerm.set($event.target.value)" />
<select (change)="platformFilter.set($event.target.value)">
  <option value="all">Todas plataformas</option>
  <option value="linkedin">LinkedIn</option>
  <option value="gupy">Gupy</option>
  <option value="vagas">Vagas.com</option>
</select>

<!-- Tabela PrimeNG -->
<p-table [value]="filteredJobs()" [paginator]="true" [rows]="10">
  <ng-template pTemplate="header">
    <tr>
      <th>Cargo</th>
      <th>Empresa</th>
      <th>Plataforma</th>
      <th>Score</th>
      <th>Data</th>
      <th>Status</th>
      <th>Ações</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-job>
    <tr>
      <td>{{ job.title }}</td>
      <td>{{ job.company }}</td>
      <td>{{ job.platform }}</td>
      <td><app-score-badge [score]="job.score" /></td>
      <td>{{ job.foundAt | relativeTime }}</td>
      <td><app-status-chip [status]="job.status" /></td>
      <td>
        <button (click)="applyToJob(job)">Candidatar-se</button>
      </td>
    </tr>
  </ng-template>
</p-table>
```

---

## 3. JobDetailComponent

**Localização:** `features/jobs/job-detail/job-detail.component.ts`

### Responsabilidade
Exibe detalhes completos de uma vaga e permite candidatura manual.

### Inputs
```typescript
jobId = input.required<string>(); // Via rota /jobs/:id
```

### Signals Internos
```typescript
job = signal<Job | null>(null);
loading = signal(false);
applying = signal(false);
```

### Dependências
- `JobsService` — buscar detalhe da vaga
- `ApplicationsService` — criar candidatura
- `ActivatedRoute` — ler jobId da rota
- `Router` — voltar para lista após ação

### Template Outline
```html
@if (job(); as job) {
  <div>
    <h1>{{ job.title }}</h1>
    <p>{{ job.company }} — {{ job.location }}</p>
    <app-score-badge [score]="job.score" />
    <app-status-chip [status]="job.status" />

    <div class="description">{{ job.description }}</div>

    <a [href]="job.url" target="_blank">Ver vaga original</a>

    @if (job.status === 'Nova') {
      <button (click)="apply()" [disabled]="applying()">
        @if (applying()) { Enviando... } @else { Candidatar-se agora }
      </button>
    }
  </div>
} @else {
  <app-empty-state message="Vaga não encontrada" />
}
```

---

## 4. ApplicationsComponent

**Localização:** `features/applications/applications.component.ts`

### Responsabilidade
Histórico completo de todas as candidaturas com filtros por status e data.

### Signals Internos
```typescript
applications = signal<Application[]>([]);
loading = signal(false);
statusFilter = signal<string>('all');
dateRange = signal<{ start: Date; end: Date } | null>(null);

// Computed
filteredApplications = computed(() => {
  let result = this.applications();
  if (this.statusFilter() !== 'all') {
    result = result.filter(a => a.status === this.statusFilter());
  }
  if (this.dateRange()) {
    const { start, end } = this.dateRange()!;
    result = result.filter(a => new Date(a.sentAt) >= start && new Date(a.sentAt) <= end);
  }
  return result;
});
```

### Dependências
- `ApplicationsService` — listar candidaturas, atualizar status

### Template Outline
```html
<!-- Filtros -->
<select (change)="statusFilter.set($event.target.value)">
  <option value="all">Todos os status</option>
  <option value="Pendente">Pendente</option>
  <option value="Enviado">Enviado</option>
  <option value="Falhou">Falhou</option>
  <option value="Arquivado">Arquivado</option>
</select>

<!-- Tabela -->
<p-table [value]="filteredApplications()">
  <ng-template pTemplate="header">
    <tr>
      <th>Vaga</th>
      <th>Empresa</th>
      <th>Data Envio</th>
      <th>Status</th>
      <th>Tipo</th>
      <th>Evidência</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-app>
    <tr>
      <td>{{ app.jobTitle }}</td>
      <td>{{ app.companyName }}</td>
      <td>{{ app.sentAt | relativeTime }}</td>
      <td><app-status-chip [status]="app.status" /></td>
      <td>{{ app.isRecurring ? 'Recorrente' : 'Único' }}</td>
      <td>
        @if (app.screenshotPath) {
          <a [href]="app.screenshotPath" target="_blank">Ver screenshot</a>
        }
      </td>
    </tr>
  </ng-template>
</p-table>
```

---

## 5. CompaniesComponent

**Localização:** `features/companies/companies.component.ts`

### Responsabilidade
CRUD de empresas fixas com envio recorrente mensal. Permite cadastrar, editar, pausar e remover empresas.

### Signals Internos
```typescript
companies = signal<FixedCompany[]>([]);
loading = signal(false);
showForm = signal(false);
editingCompany = signal<FixedCompany | null>(null);

// Form fields
formName = signal('');
formUrl = signal('');
formIntervalDays = signal(30);
```

### Dependências
- `CompaniesService` — CRUD de empresas fixas

### Template Outline
```html
<button (click)="showForm.set(true)">+ Nova Empresa</button>

@if (showForm()) {
  <form (submit)="saveCompany()">
    <input type="text" placeholder="Nome da empresa" [value]="formName()" (input)="formName.set($event.target.value)" />
    <input type="url" placeholder="URL do formulário" [value]="formUrl()" (input)="formUrl.set($event.target.value)" />
    <input type="number" placeholder="Intervalo (dias)" [value]="formIntervalDays()" (input)="formIntervalDays.set($event.target.value)" />
    <button type="submit">Salvar</button>
    <button type="button" (click)="showForm.set(false)">Cancelar</button>
  </form>
}

@for (company of companies(); track company.id) {
  <div class="company-card">
    <h3>{{ company.name }}</h3>
    <a [href]="company.applicationUrl" target="_blank">{{ company.applicationUrl }}</a>
    <p>Último envio: {{ company.lastSentAt | relativeTime }}</p>
    <p>Próximo envio: {{ company.nextSendAt | relativeTime }}</p>
    <app-status-chip [status]="company.status" />

    <button (click)="toggleCompany(company)">
      {{ company.isActive ? 'Pausar' : 'Ativar' }}
    </button>
    <button (click)="editCompany(company)">Editar</button>
    <button (click)="deleteCompany(company)">Remover</button>
  </div>
} @empty {
  <app-empty-state message="Nenhuma empresa fixa cadastrada" />
}
```

---

## 6. ProfileComponent

**Localização:** `features/profile/profile.component.ts`

### Responsabilidade
Formulário de dados pessoais do candidato e upload do currículo em PDF.

### Signals Internos
```typescript
profile = signal<CandidateProfile | null>(null);
loading = signal(false);
uploading = signal(false);
cvFileName = signal<string | null>(null);
```

### Dependências
- `ProfileService` — buscar/atualizar perfil, upload de CV

### Template Outline
```html
<form (submit)="saveProfile()">
  <label>Nome completo</label>
  <input type="text" [value]="profile()?.name" (input)="updateField('name', $event.target.value)" />

  <label>Cargo alvo</label>
  <input type="text" [value]="profile()?.targetRole" (input)="updateField('targetRole', $event.target.value)" />

  <label>Localização</label>
  <input type="text" [value]="profile()?.location" (input)="updateField('location', $event.target.value)" />

  <label>E-mail</label>
  <input type="email" [value]="profile()?.email" (input)="updateField('email', $event.target.value)" />

  <label>Telefone</label>
  <input type="tel" [value]="profile()?.phone" (input)="updateField('phone', $event.target.value)" />

  <!-- Upload do CV -->
  <label>Currículo (PDF)</label>
  @if (cvFileName()) {
    <span>{{ cvFileName() }}</span>
  }
  <input type="file" accept=".pdf" (change)="uploadCV($event)" />

  <button type="submit" [disabled]="loading()">Salvar Perfil</button>
</form>
```

---

## 7. SettingsComponent

**Localização:** `features/settings/settings.component.ts`

### Responsabilidade
Configurações de busca: palavras-chave, cargos alvo, áreas de interesse, localização preferida.

### Signals Internos
```typescript
settings = signal<UserSettings>({
  keywords: [],
  targetRoles: [],
  preferredLocations: [],
  scanIntervalHours: 6,
  autoApply: false
});

newKeyword = signal('');
newRole = signal('');
newLocation = signal('');
```

### Dependências
- `ProfileService` — buscar/salvar configurações

### Template Outline
```html
<!-- Palavras-chave -->
<h3>Palavras-chave</h3>
@for (kw of settings().keywords; track kw) {
  <span class="tag">{{ kw }} <button (click)="removeKeyword(kw)">x</button></span>
}
<input type="text" placeholder="Nova palavra-chave" [value]="newKeyword()" (input)="newKeyword.set($event.target.value)" />
<button (click)="addKeyword()">Adicionar</button>

<!-- Cargos alvo -->
<h3>Cargos alvo</h3>
@for (role of settings().targetRoles; track role) {
  <span class="tag">{{ role }} <button (click)="removeRole(role)">x</button></span>
}
<input type="text" placeholder="Novo cargo" [value]="newRole()" (input)="newRole.set($event.target.value)" />
<button (click)="addRole()">Adicionar</button>

<!-- Localizações -->
<h3>Localizações preferidas</h3>
@for (loc of settings().preferredLocations; track loc) {
  <span class="tag">{{ loc }} <button (click)="removeLocation(loc)">x</button></span>
}
<input type="text" placeholder="Nova localização" [value]="newLocation()" (input)="newLocation.set($event.target.value)" />
<button (click)="addLocation()">Adicionar</button>

<!-- Frequência -->
<h3>Frequência de varredura</h3>
<select (change)="updateScanInterval($event.target.value)">
  <option value="3">A cada 3 horas</option>
  <option value="6">A cada 6 horas</option>
  <option value="12">A cada 12 horas</option>
  <option value="24">Diariamente</option>
</select>

<!-- Auto-apply -->
<label>
  <input type="checkbox" [checked]="settings().autoApply" (change)="toggleAutoApply()" />
  Candidatura automática para vagas com score ≥ 80%
</label>

<button (click)="saveSettings()">Salvar Configurações</button>
```

---

## 8. SidebarComponent

**Localização:** `layout/sidebar/sidebar.component.ts`

### Responsabilidade
Navegação lateral do app shell com links e indicador de rota ativa.

### Signals Internos
```typescript
navItems = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  { label: 'Vagas', icon: 'work', route: '/jobs' },
  { label: 'Candidaturas', icon: 'send', route: '/applications' },
  { label: 'Empresas Fixas', icon: 'business', route: '/companies' },
  { label: 'Meu Perfil', icon: 'person', route: '/profile' },
  { label: 'Configurações', icon: 'settings', route: '/settings' }
];

currentRoute = signal('');
```

### Dependências
- `Router` — navegação e detecção de rota ativa

### Template Outline
```html
<aside class="w-64 bg-gray-900 h-screen fixed left-0 top-0">
  <div class="p-4">
    <h1 class="text-xl font-bold text-blue-400">JobHunter</h1>
    <p class="text-sm text-gray-400">Assistente de Candidaturas</p>
  </div>

  <nav>
    @for (item of navItems; track item.route) {
      <a [routerLink]="item.route"
         [class.active]="currentRoute() === item.route"
         class="nav-link">
        <span class="icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </a>
    }
  </nav>
</aside>
```

---

## 9. TopbarComponent

**Localização:** `layout/topbar/topbar.component.ts`

### Responsabilidade
Barra superior com indicador de status do robô, notificações e ações rápidas.

### Inputs
```typescript
schedulerStatus = input<SchedulerStatus>({ isRunning: false, lastScan: null, nextScan: null });
```

### Signals Internos
```typescript
notifications = signal<Notification[]>([]);
showNotifications = signal(false);
```

### Dependências
- `SchedulerService` — status e ações do agendador
- `NotificationService` — buscar notificações

### Template Outline
```html
<header class="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
  <!-- Status do robô -->
  <div class="flex items-center gap-2">
    @if (schedulerStatus().isRunning) {
      <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
      <span class="text-sm text-green-400">Robô ativo</span>
    } @else {
      <span class="w-3 h-3 bg-gray-500 rounded-full"></span>
      <span class="text-sm text-gray-400">Robô pausado</span>
    }
  </div>

  <!-- Ações rápidas -->
  <div class="flex items-center gap-4">
    <button (click)="triggerScan()" title="Varredura manual">
      Buscar vagas agora
    </button>

    <!-- Notificações -->
    <div class="relative">
      <button (click)="showNotifications.set(!showNotifications())">
        @if (notifications().length > 0) {
          <span class="badge">{{ notifications().length }}</span>
        }
      </button>

      @if (showNotifications()) {
        <div class="notifications-dropdown">
          @for (notif of notifications(); track notif.id) {
            <div>{{ notif.message }}</div>
          } @empty {
            <p>Sem notificações</p>
          }
        </div>
      }
    </div>
  </div>
</header>
```

---

## 10. ScoreBadgeComponent

**Localização:** `shared/components/score-badge/score-badge.component.ts`

### Responsabilidade
Badge visual colorido representando score de compatibilidade (0-100%).

### Inputs
```typescript
score = input.required<number>(); // 0-100
```

### Computed
```typescript
colorClass = computed(() => {
  const s = this.score();
  if (s >= 80) return 'bg-green-500';    // Alta compatibilidade
  if (s >= 60) return 'bg-yellow-500';   // Média compatibilidade
  if (s >= 40) return 'bg-orange-500';   // Baixa compatibilidade
  return 'bg-red-500';                   // Muito baixa
});

label = computed(() => `${this.score()}%`);
```

### Template
```html
<span [class]="colorClass()" class="px-2 py-1 rounded-full text-xs font-bold text-white">
  {{ label() }}
</span>
```

---

## 11. StatusChipComponent

**Localização:** `shared/components/status-chip/status-chip.component.ts`

### Responsabilidade
Chip colorido representando status de uma candidatura ou vaga.

### Inputs
```typescript
status = input.required<string>(); // 'Nova' | 'Pendente' | 'Enviado' | 'Falhou' | 'Arquivado' | 'Ativo' | 'Pausado' | 'Respondeu'
```

### Computed
```typescript
colorClass = computed(() => {
  const colors: Record<string, string> = {
    'Nova': 'bg-blue-500',
    'Pendente': 'bg-yellow-500',
    'Enviado': 'bg-green-500',
    'Falhou': 'bg-red-500',
    'Arquivado': 'bg-gray-500',
    'Ativo': 'bg-green-500',
    'Pausado': 'bg-yellow-500',
    'Respondeu': 'bg-purple-500'
  };
  return colors[this.status()] || 'bg-gray-500';
});
```

### Template
```html
<span [class]="colorClass()" class="px-2 py-1 rounded text-xs font-medium text-white">
  {{ status() }}
</span>
```

---

## 12. StatCardComponent

**Localização:** `shared/components/stat-card/stat-card.component.ts`

### Responsabilidade
Card reutilizável para exibir uma métrica numérica (total vagas, enviados, taxa de resposta).

### Inputs
```typescript
label = input.required<string>();      // "Vagas Encontradas"
value = input.required<number>();       // 42
suffix = input<string>('');             // "%" ou " vagas"
icon = input<string>('');               // Nome do ícone opcional
trend = input<'up' | 'down' | null>(null); // Tendência (opcional)
```

### Template
```html
<div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
  <div class="flex items-center justify-between">
    <span class="text-sm text-gray-400">{{ label() }}</span>
    @if (trend()) {
      <span [class]="trend() === 'up' ? 'text-green-400' : 'text-red-400'">
        {{ trend() === 'up' ? '↑' : '↓' }}
      </span>
    }
  </div>
  <div class="mt-2">
    <span class="text-2xl font-bold text-white">{{ value() }}</span>
    @if (suffix()) {
      <span class="text-sm text-gray-400 ml-1">{{ suffix() }}</span>
    }
  </div>
</div>
```

---

## 13. EmptyStateComponent

**Localização:** `shared/components/empty-state/empty-state.component.ts`

### Responsabilidade
Componente de estado vazio com ícone, mensagem e call-to-action opcional.

### Inputs
```typescript
message = input.required<string>();  // "Nenhuma vaga encontrada"
icon = input<string>('inbox');       // Nome do ícone
actionLabel = input<string>('');     // "Buscar vagas" (opcional)
```

### Outputs
```typescript
action = output<void>(); // Emitido ao clicar no CTA
```

### Template
```html
<div class="flex flex-col items-center justify-center py-12 text-gray-400">
  <span class="text-4xl mb-4">{{ icon() }}</span>
  <p class="text-lg mb-4">{{ message() }}</p>
  @if (actionLabel()) {
    <button (click)="action.emit()" class="btn-primary">
      {{ actionLabel() }}
    </button>
  }
</div>
```

---

## Referências Cruzadas

| Componente | Serviços | Modelos | Outros Componentes |
|---|---|---|---|
| DashboardComponent | JobsService, SchedulerService | Job, DashboardStats | StatCardComponent, ScoreBadgeComponent, EmptyStateComponent |
| JobsListComponent | JobsService, ApplicationsService | Job | ScoreBadgeComponent, StatusChipComponent |
| JobDetailComponent | JobsService, ApplicationsService | Job, Application | ScoreBadgeComponent, StatusChipComponent, EmptyStateComponent |
| ApplicationsComponent | ApplicationsService | Application | StatusChipComponent, EmptyStateComponent |
| CompaniesComponent | CompaniesService | FixedCompany | StatusChipComponent, EmptyStateComponent |
| ProfileComponent | ProfileService | CandidateProfile | — |
| SettingsComponent | ProfileService | UserSettings | — |
| SidebarComponent | Router | — | — |
| TopbarComponent | SchedulerService, NotificationService | Notification | — |
| ScoreBadgeComponent | — | — | — |
| StatusChipComponent | — | — | — |
| StatCardComponent | — | — | — |
| EmptyStateComponent | — | — | — |
