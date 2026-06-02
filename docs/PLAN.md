# PLAN.md — JobHunter

## Regras
- Faça UM passo por vez
- NÃO avance para o próximo passo até que o atual esteja marcado ✅ DONE
- Cada passo deve ser testado antes de ser marcado como completo
- Se um passo falhar, corrija antes de continuar

---

## Phase 1 — Project Setup

- [x] **Step 1:** Scaffold Angular 21+ com standalone components e TypeScript strict (`ng new jobhunter-frontend --standalone --strict`)
- [x] **Step 2:** Instalar e configurar Tailwind CSS 3.4.17 — confirmar que classe `bg-blue-900` aparece na tela
- [x] **Step 3:** Instalar PrimeNG 21+ e configurar provider/tema dark no `app.config.ts`
- [x] **Step 4:** Criar estrutura de pastas completa conforme `ARCHITECTURE.md` (`core/`, `features/`, `shared/`, `layout/`)
- [x] **Step 5:** Configurar tokens de design no `tailwind.config.js` (dark background `#0a0f1e`, azul primário `#2563eb`, azul accent `#38bdf8`, texto `#e2e8f0`)
- [x] **Step 6:** Configurar `environment.ts` e `environment.prod.ts` com `apiUrl`
- [x] **Step 7:** Inicializar backend FastAPI com `uv init jobhunter-backend` — confirmar `uvicorn app.main:app --reload` rodando na porta 8000
- [x] **Step 8:** Configurar CORS no FastAPI (`CORSMiddleware` com origin `http://localhost:4200`)
- [x] **Step 9:** Criar `core/config.py` com `pydantic-settings` lendo variáveis do `.env`
- [x] **Step 10:** Configurar banco SQLite com SQLAlchemy async — confirmar que tabelas são criadas no startup
- [x] **Step 11:** Deploy do frontend em branco no Firebase Hosting — confirmar URL pública acessível

---

## Phase 2 — Models & Database

- [x] **Step 12:** Criar SQLAlchemy model + Pydantic schema para `Job` (vaga)
- [x] **Step 13:** Criar SQLAlchemy model + Pydantic schema para `Application` (candidatura)
- [x] **Step 14:** Criar SQLAlchemy model + Pydantic schema para `FixedCompany` (empresa fixa)
- [x] **Step 15:** Criar SQLAlchemy model + Pydantic schema para `CandidateProfile`
- [x] **Step 16:** Criar migrations iniciais (Alembic) — confirmar que `alembic upgrade head` cria todas as tabelas
- [x] **Step 17:** Seed de dados fake no banco (3 vagas, 2 candidaturas, 1 empresa fixa) para uso nos steps seguintes

---

## Phase 3 — Backend: API Endpoints

- [x] **Step 18:** Criar `GET /jobs` e `GET /jobs/{id}` — testar com dados seed via Swagger UI
- [x] **Step 19:** Criar `POST /jobs/scan` — endpoint que dispara a varredura manualmente (retorna 202 Accepted)
- [x] **Step 20:** Criar `GET /applications` e `POST /applications` — testar criação de candidatura
- [x] **Step 21:** Criar `PUT /applications/{id}/status` — atualizar status de candidatura
- [x] **Step 22:** Criar CRUD completo de `GET/POST/PUT/DELETE /companies` (empresas fixas)
- [x] **Step 23:** Criar `GET /profile` e `PUT /profile` — atualização de dados do perfil
- [x] **Step 24:** Criar `POST /profile/cv` — upload de PDF (multipart/form-data), salvar em `CV_STORAGE_PATH`
- [x] **Step 25:** Criar `GET /scheduler/status` — retornar estado atual dos jobs agendados

---

## Phase 4 — Layout & Shell do App

- [x] **Step 26:** Construir `SidebarComponent` com logo, links de navegação e indicador de rota ativa
- [x] **Step 27:** Construir `TopbarComponent` com indicador de status do robô (ativo/pausado) e botão de ação rápida
- [x] **Step 28:** Montar o app shell no `app.component.ts` com `<router-outlet>` entre sidebar e topbar
- [x] **Step 29:** Configurar todas as rotas em `app.routes.ts` (dashboard, jobs, applications, companies, profile, settings)
- [x] **Step 30:** Testar navegação entre todas as rotas — mobile e desktop
- [x] **Step 31:** Construir componentes compartilhados: `ScoreBadgeComponent`, `StatusChipComponent`, `StatCardComponent`, `EmptyStateComponent`

---

## Phase 5 — Feature: Dashboard

- [x] **Step 32:** Criar `DashboardComponent` com layout de grid (cards de métricas no topo)
- [x] **Step 33:** Integrar `StatCardComponent` com dados reais da API (total de vagas, enviadas, taxa de resposta)
- [x] **Step 34:** Adicionar seção "Vagas Recentes" com as últimas 5 vagas encontradas
- [x] **Step 35:** Adicionar indicador visual de status do agendador (última varredura, próxima varredura)
- [x] **Step 36:** Testar dashboard no mobile — garantir que cards não quebram o layout

---

## Phase 6 — Feature: Vagas

- [x] **Step 37:** Construir `JobsListComponent` usando PrimeNG Table — colunas: cargo, empresa, plataforma, score, data, status
- [x] **Step 38:** Adicionar filtros: por score mínimo, por plataforma, por status
- [x] **Step 39:** Construir `JobDetailComponent` com todas as informações da vaga e botão "Candidatar-se agora"
- [x] **Step 40:** Integrar botão de candidatura com `POST /applications` — atualizar status na UI após confirmação
- [x] **Step 41:** Testar fluxo completo: ver vaga → clicar em candidatar → candidatura criada no banco

---

## Phase 7 — Feature: Histórico de Candidaturas

- [x] **Step 42:** Construir `ApplicationsComponent` com tabela de todas as candidaturas
- [x] **Step 43:** Adicionar filtros por status (Pendente, Enviado, Falhou, Arquivado) e por data
- [x] **Step 44:** Exibir screenshot de evidência quando disponível (candidaturas automatizadas)
- [x] **Step 45:** Testar ordenação e filtros com dados seed

---

## Phase 8 — Feature: Empresas Fixas

- [x] **Step 46:** Construir `CompaniesComponent` com lista de empresas cadastradas e seus status
- [x] **Step 47:** Adicionar formulário de cadastro de nova empresa (nome, URL do formulário, intervalo de envio)
- [x] **Step 48:** Implementar toggle para pausar/ativar envio recorrente de cada empresa
- [x] **Step 49:** Exibir histórico dos envios realizados para cada empresa fixa
- [x] **Step 50:** Testar CRUD completo de empresas via UI

---

## Phase 9 — Feature: Perfil

- [x] **Step 51:** Construir `ProfileComponent` com formulário de dados pessoais (nome, cargo alvo, localização, e-mail)
- [x] **Step 52:** Adicionar campo de upload do currículo em PDF com preview do nome do arquivo
- [x] **Step 53:** Integrar upload com `POST /profile/cv` — confirmar que PDF é salvo no servidor
- [x] **Step 54:** Construir `SettingsComponent` com campos: palavras-chave de interesse, cargos alvo, áreas, localização preferida
- [x] **Step 55:** Testar save do perfil e verificar que dados persistem após reload

---

## Phase 10 — Backend: Scraping

- [x] **Step 56:** Implementar `base_scraper.py` com interface comum (método `scrape()`, tratamento de erros, logs)
- [x] **Step 57:** Implementar `gupy_scraper.py` — Gupy tem API pública JSON, priorizar sobre scraping
- [x] **Step 58:** Implementar `vagas_scraper.py` — scraping via Playwright/BeautifulSoup
- [x] **Step 59:** Implementar `linkedin_scraper.py` — scraping de vagas públicas via Playwright (sem login)
- [x] **Step 60:** Integrar `matcher.py` com algoritmo de score (keyword matching entre descrição da vaga e perfil)
- [x] **Step 61:** Testar varredura manual via `POST /jobs/scan` — confirmar vagas aparecendo no banco e no painel

---

## Phase 11 — Backend: Automação de Envio

- [x] **Step 62:** Implementar `base_applicator.py` com interface comum e lógica de screenshot
- [x] **Step 63:** Implementar `gupy_applicator.py` — automatizar candidatura em vagas do Gupy com Playwright
- [x] **Step 64:** Implementar `generic_applicator.py` — preencher formulário genérico de "Trabalhe Conosco"
- [x] **Step 65:** Testar `gupy_applicator.py` em ambiente de desenvolvimento com uma vaga real de teste
- [x] **Step 66:** Confirmar que screenshot é salvo e status é atualizado no banco após execução

---

## Phase 12 — Agendamento & Notificações

- [x] **Step 67:** Implementar `scheduler_service.py` com APScheduler — job de varredura a cada `SCAN_INTERVAL_HOURS`
- [x] **Step 68:** Implementar job de envio recorrente mensal para empresas fixas ativas
- [x] **Step 69:** Implementar `notification_service.py` — enviar e-mail quando vaga compatível é encontrada
- [x] **Step 70:** Implementar e-mail de confirmação após cada envio automático
- [x] **Step 71:** Testar ciclo completo: job roda → vaga encontrada → e-mail recebido → candidatura registrada

---

## Phase 13 — QA & Launch

- [x] **Step 72:** QA completo no frontend — todas as telas no mobile (375px), tablet (768px) e desktop (1440px)
- [x] **Step 73:** Testar fluxo completo de ponta a ponta: perfil → upload CV → varredura → vaga encontrada → candidatura enviada → notificação recebida
- [x] **Step 74:** Testar fluxo de empresa fixa: cadastrar empresa → aguardar job mensal → confirmar envio no histórico
- [x] **Step 75:** Executar varredura real nas 3 plataformas configuradas — confirmar vagas chegando no painel
- [x] **Step 76:** Verificar logs de automação — confirmar que nenhum erro silencioso está ocorrendo
- [x] **Step 77:** Deploy do backend em produção (Oracle Cloud Always Free — VM ARM via Docker) — confirmar processo persistente rodando
- [x] **Step 78:** Atualizar `environment.prod.ts` com URL de produção do backend
- [x] **Step 79:** Deploy final do frontend no Firebase Hosting
- [x] **Step 80:** Confirmar site em produção acessível e funcionando end-to-end

---

✅ **PROJETO COMPLETO QUANDO:** O sistema em produção executar automaticamente a varredura, encontrar uma vaga compatível real, enviar o currículo sem intervenção manual, e você receber o e-mail de confirmação.
