# Frontend -- JobHunter

Interface web do JobHunter, construida com Angular 21, Tailwind CSS e PrimeNG.

## Setup

### Pre-requisitos

- Node.js 20+
- npm 11+

### Instalacao

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar em modo dev
ng serve
```

O frontend estara disponivel em `http://localhost:4200`.

### Build para Producao

```bash
ng build --configuration production
```

O build sera gerado em `dist/frontend/`.

### Testes

```bash
ng test
```

Testes unitarios via Vitest.

---

## Estrutura

```
frontend/
├── src/
│   ├── index.html
│   ├── main.ts                     # Bootstrap Angular
│   ├── styles.css                  # Estilos globais + Tailwind
│   ├── environments/
│   │   ├── environment.ts          # Dev
│   │   └── environment.prod.ts     # Producao
│   └── app/
│       ├── app.ts                  # Root component
│       ├── app.html                # Template root
│       ├── app.css                 # Estilos root (glassmorphism)
│       ├── app.config.ts           # Providers (router, http, animations)
│       ├── app.routes.ts           # Definicao de rotas
│       ├── app.spec.ts             # Teste root
│       ├── core/
│       │   ├── models/
│       │   │   ├── job.model.ts
│       │   │   ├── application.model.ts
│       │   │   ├── company.model.ts
│       │   │   └── profile.model.ts
│       │   └── services/
│       │       ├── api.service.ts          # HTTP base
│       │       ├── jobs.service.ts         # CRUD vagas
│       │       ├── applications.service.ts # CRUD candidaturas
│       │       ├── companies.service.ts    # CRUD empresas fixas
│       │       ├── profile.service.ts      # Perfil do candidato
│       │       ├── scheduler.service.ts    # Scheduler
│       │       └── toast.service.ts        # Notificacoes toast
│       ├── features/
│       │   ├── dashboard/
│       │   │   ├── dashboard.component.ts
│       │   │   └── dashboard.component.spec.ts
│       │   ├── jobs/
│       │   │   ├── jobs-list/
│       │   │   │   └── jobs-list.component.ts
│       │   │   └── job-detail/
│       │   │       └── job-detail.component.ts
│       │   ├── applications/
│       │   │   └── applications.component.ts
│       │   ├── companies/
│       │   │   └── companies.component.ts
│       │   ├── profile/
│       │   │   └── profile.component.ts
│       │   └── settings/
│       │       └── settings.component.ts
│       ├── layout/
│       │   ├── sidebar/
│       │   │   └── sidebar.component.ts   # Sidebar retratil
│       │   └── topbar/
│       │       └── topbar.component.ts    # Barra superior
│       └── shared/
│           ├── components/
│           │   ├── status-chip/           # Chip de status colorido
│           │   ├── stat-card/             # Card de metrica
│           │   ├── skeleton/              # Loading skeleton
│           │   ├── toast/                 # Notificacao toast
│           │   ├── empty-state/           # Estado vazio
│           │   ├── score-badge/           # Badge de scoring 0-100%
│           │   └── select/                # Dropdown customizado
│           └── pipes/
│               ├── date-time.pipe.ts      # Formatacao de data
│               └── relative-time.pipe.ts  # "ha 5 minutos"
├── package.json
├── angular.json
├── tailwind.config.js
├── tsconfig.json
└── tsconfig.app.json
```

---

## Componentes

| Componente | Localizacao | Descricao |
|------------|-------------|-----------|
| `DashboardComponent` | `features/dashboard/` | Metricas, graficos e visao geral |
| `JobsListComponent` | `features/jobs/jobs-list/` | Lista de vagas com filtros e paginacao |
| `JobDetailComponent` | `features/jobs/job-detail/` | Detalhes de uma vaga especifica |
| `ApplicationsComponent` | `features/applications/` | Lista de candidaturas com status |
| `CompaniesComponent` | `features/companies/` | Gerenciamento de empresas fixas |
| `ProfileComponent` | `features/profile/` | Edicao do perfil do candidato |
| `SettingsComponent` | `features/settings/` | Configuracoes gerais |
| `SidebarComponent` | `layout/sidebar/` | Navegacao lateral retratil |
| `TopbarComponent` | `layout/topbar/` | Barra superior com acoes |
| `StatusChip` | `shared/components/status-chip/` | Badge colorido por status |
| `StatCard` | `shared/components/stat-card/` | Card de metrica com icone |
| `Skeleton` | `shared/components/skeleton/` | Loading skeleton |
| `Toast` | `shared/components/toast/` | Notificacao flutuante |
| `EmptyState` | `shared/components/empty-state/` | Mensagem quando nao ha dados |
| `ScoreBadge` | `shared/components/score-badge/` | Badge circular de scoring |
| `Select` | `shared/components/select/` | Dropdown customizado |

---

## Services

| Service | Descricao |
|---------|-----------|
| `ApiService` | HTTP base com URL da API e headers padrao |
| `JobsService` | CRUD de vagas, busca, filtros, trigger de scan |
| `ApplicationsService` | CRUD de candidaturas, atualizacao de status |
| `CompaniesService` | CRUD de empresas fixas, toggle ativo/inativo |
| `ProfileService` | Get/update do perfil, upload de CV |
| `SchedulerService` | Status do scheduler, trigger manual, pause/resume |
| `ToastService` | Exibicao de notificacoes toast |

---

## Rotas

| Rota | Componente | Descricao |
|------|-----------|-----------|
| `/dashboard` | `DashboardComponent` | Pagina inicial com metricas |
| `/jobs` | `JobsListComponent` | Lista de vagas |
| `/jobs/:id` | `JobDetailComponent` | Detalhe de uma vaga |
| `/applications` | `ApplicationsComponent` | Candidaturas |
| `/companies` | `CompaniesComponent` | Empresas fixas |
| `/profile` | `ProfileComponent` | Perfil do candidato |
| `/settings` | `SettingsComponent` | Configuracoes |
| `/**` | Redirect | Redireciona para `/dashboard` |

Todas as rotas usam **lazy loading** via `loadComponent`.

---

## Styling

- **Tailwind CSS 3.4** -- Utilitarios para layout, espacamento, cores
- **PrimeNG 21** -- Componentes UI (table, dialog, calendar, etc.)
- **Glassmorphism** -- Cards com backdrop-blur e transparencia
- **Pill shapes** -- Badges e botoes arredondados
- **Skeletons** -- Loading states em todos os componentes
- **Responsivo** -- Layout adaptavel para mobile e desktop

---

## Testes

```bash
ng test
```

Testes unitarios com Vitest. Cobertura em componentes, services e pipes.
