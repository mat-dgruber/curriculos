# ADR-001: Stack & Ferramentas

## Status

Accepted

---

## Contexto

O projeto JobHunter é uma aplicação web de automação de candidaturas a vagas de emprego. O sistema precisa de um frontend interativo para configuração do perfil e visualização de vagas, um backend robusto para scraping, automação de formulários via browser headless, e agendamento de tarefas recorrentes.

A escolha da stack deve considerar:
- O desenvolvedor tem experiência primária em Angular e Python
- O uso inicial é pessoal (single-user), mas a arquitetura deve permitir escala futura
- O sistema depende fortemente de automação de browser (Playwright) e agendamento de jobs
- A manutenção deve ser mínima no dia a dia após o setup inicial

---

## Decisão

### 1. Frontend: Angular 21+ (Standalone Components + Signals)

**Alternativas consideradas:** React, Vue, Next.js

**Escolha:** Angular 21+ com standalone components, signals para estado reativo, e nova sintaxe de control flow (`@if`, `@for`, `@switch`).

**Justificativa:**
- Stack primária do desenvolvedor — produtividade imediata, sem curva de aprendizado
- Standalone components eliminam a complexidade de NgModules — arquitetura mais simples
- Signals (`signal()`, `computed()`, `effect()`) substituem RxJS Subject/BehaviorSubject para estado local, reduzindo boilerplate significativamente
- Ecossistema maduro com TypeScript strict mode nativo
- Angular CLI gera scaffold completo com build, test e deploy configurados

---

### 2. Styling: Tailwind CSS 3.4.17

**Alternativas consideradas:** Angular Material, Bootstrap, estilos inline

**Escolha:** Tailwind CSS 3.4.17 com design tokens definidos em `tailwind.config.js`.

**Justificativa:**
- Utility-first permite prototipagem rápida sem escrever CSS custom
- Mobile-first embutido — todas as classes começam no breakpoint menor e escalam com `md:`, `lg:`
- Design tokens centralizam cores, fontes e espaçamentos — consistência visual garantida
- Dark theme configurado via `tailwind.config.js` (background `#0a0f1e`, primário `#2563eb`, accent `#38bdf8`)
- Sem dependência de bibliotecas de componentes visuais — controle total do design
- PurgeCSS remove classes não utilizadas em produção — bundle mínimo

---

### 3. Componentes: PrimeNG 21+

**Alternativas consideradas:** Angular Material, CDK puro, componentes 100% customizados

**Escolha:** PrimeNG 21+ para componentes complexos (tabelas, overlays, toasts). Componentes simples são construídos como Angular customizados.

**Justificativa:**
- Integração nativa com Angular — não é um wrapper de biblioteca genérica
- Tabelas com paginação, ordenação e filtros prontos — economiza semanas de desenvolvimento
- Badges, chips e toasts padronizados — UX consistente sem esforço
- Regra: PrimeNG apenas quando economiza complexidade real; caso contrário, componente custom

---

### 4. Backend: Python 3.14+ com FastAPI

**Alternativas consideradas:** Django, Flask, Node.js/Express

**Escolha:** FastAPI com async/await nativo, Pydantic para validação, e SQLAlchemy 2.x como ORM.

**Justificativa:**
- Async nativo — essencial para operações concorrentes (scraping de múltiplas plataformas simultaneamente)
- Pydantic integrado — validação automática de request/response com geração de schema OpenAPI
- Documentação automática via Swagger UI — zero esforço para documentar endpoints
- Leve e focado em APIs REST — sem o overhead de Django (admin, ORM opinionado, etc.)
- Ecossistema de scraping (Playwright, BeautifulSoup, httpx) é nativo em Python
- FastAPI é o framework async mais performático do ecossistema Python

---

### 5. Package Manager: uv

**Alternativas consideradas:** pip, Poetry, PDM, pip-tools

**Escolha:** uv como gerenciador de pacotes do backend.

**Justificativa:**
- 10-100x mais rápido que pip em resolução e instalação de dependências
- Lockfile determinístico (`uv.lock`) — builds reproduzíveis
- Substitui tanto pip quanto poetry em uma única ferramenta
- Compatível com `pyproject.toml` (padrão PEP 621)
- Gerenciamento de versões do Python embutido (`uv python install 3.14`)

---

### 6. Banco de Dados: SQLite (dev e produção)

**Alternativas consideradas:** PostgreSQL desde o início, MongoDB, Supabase

**Escolha:** SQLite tanto para desenvolvimento quanto para produção (Oracle Cloud VM ARM). PostgreSQL via Supabase Free apenas se precisar escalar para multi-user no futuro.

**Justificativa:**
- SQLite: zero config, arquivo único, suficiente para single-user — funciona tanto em dev quanto na VM de produção
- A VM ARM da Oracle Cloud tem 200GB SSD — espaço mais que suficiente para anos de dados
- SQLAlchemy 2.x abstrai a diferença — trocar para PostgreSQL no futuro é mudar apenas a `DATABASE_URL`
- Alembic gerencia migrations — schema versionado com suporte a rollback
- PostgreSQL será necessário apenas quando houver múltiplos usuários — nesse caso, Supabase Free oferece 500MB gerenciados

---

### 7. Automação: Playwright

**Alternativas consideradas:** Selenium, Puppeteer, ferramentas no-code

**Escolha:** Playwright para automação de browser headless.

**Justificativa:**
- API moderna e intuitiva — menos código que Selenium para a mesma tarefa
- Auto-wait embutido — não precisa de `sleep()` manuais ou explicit waits
- Suporte nativo a Chromium, Firefox e WebKit — cross-browser se necessário
- Screenshots e vídeos de evidência — essencial para auditoria de envios
- Python SDK maduro (`playwright-python`) com sync e async
- Contextos de browser isolados — cada execução é independente

---

### 8. Agendamento: APScheduler

**Alternativas consideradas:** Celery, RQ, cron do sistema, schedule (Python)

**Escolha:** APScheduler rodando no mesmo processo do backend FastAPI.

**Justificativa:**
- Sem broker externo (Redis, RabbitMQ) — infraestrutura mais simples
- Roda no mesmo processo do backend — deploy único, sem workers separados
- Suporte a intervalos (varredura a cada 6h) e cron (envio mensal dia 1)
- Persistência de jobs via SQLAlchemy — jobs sobrevivem a restarts
- Suficiente para o volume de um usuário pessoal (poucos jobs, baixa frequência)
- Escala para Celery se necessário no futuro (múltiplos workers, filas)

---

### 9. Hosting: Firebase Hosting + Oracle Cloud Always Free

**Alternativas consideradas:** Railway, Render, Google Cloud, AWS, Vercel, Netlify, tudo em VPS pago

**Escolha:** Firebase Hosting para frontend estático + Oracle Cloud Always Free VM ARM para backend.

**Justificativa:**
- **Frontend (Firebase Hosting):** Angular gera build estático (HTML/CSS/JS) — Firebase Hosting é ideal com CDN global, HTTPS grátis, deploy com 1 comando. Spark plan gratuito com 10GB de transferência/mês — suficiente para uso pessoal
- **Backend (Oracle Cloud Always Free VM ARM):** VM Ampere A1 com até 4 OCPU, 24GB RAM e 200GB SSD — poder suficiente para Playwright e APScheduler. O Always Free não expira (diferente do trial do Google Cloud que dura 1 mês). Docker instalado na VM para containerizar o backend
- **Banco (SQLite local na VM):** Arquivo SQLite no filesystem da VM — zero latência, zero custo, 200GB de storage disponível. Para single-user, SQLite é mais que suficiente e elimina dependência de banco externo

**Por que NÃO outras opções:**
- Railway: free tier muito pequeno (US$1 de crédito, 0.5GB RAM, 0.5GB storage) — estoura em dias
- Google Cloud: free tier expira após 1 mês — depois disso, VM mínimo custa ~US$6-7/mês
- Render: free tier tem cold start de 50s — inviável para Playwright
- Firebase Functions/Cloud Run: serverless não roda Playwright nem APScheduler (processo precisa ser persistente)
- Vercel/Netlify: serverless — mesmo problema

**Alternativa futura:** Supabase Free (500MB PostgreSQL managed) se precisar de banco externo ou PostgreSQL para multi-user

---

## Consequências

### Positivas

- **Produtividade alta desde o dia 1:** Stack familiar (Angular + Python) elimina curva de aprendizado
- **Manutenção mínima:** SQLite + APScheduler no mesmo processo = menos pontos de falha
- **Path de escala claro:** SQLite → PostgreSQL, APScheduler → Celery, single-user → multi-user
- **Automação robusta:** Playwright é a melhor ferramenta para preenchimento de formulários web
- **Deploy simples:** Firebase Hosting (frontend) + Oracle Cloud VM ARM (backend) = deploy completo com custo zero
- **Documentação automática:** FastAPI gera Swagger UI sem esforço adicional

### Negativas

- **SQLite limitado para concorrência:** Funciona para single-user, mas bloqueia em writes simultâneos
- **APScheduler no mesmo processo:** Se o backend crasha, os param também
- **Playwright é pesado:** Consome ~200-400MB de RAM por browser instance — VPS precisa de memória adequada
- **Tailwind learning curve:** Para quem não conhece utility-first, o HTML fica verboso inicialmente

### Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Sites de vagas bloqueiam Playwright | Alta | Alto | Delay aleatório, user-agent realista, screenshots como evidência |
| APScheduler perde jobs em crash | Baixa | Médio | Persistência via SQLAlchemy, verificação de jobs no startup |
| SQLite corrompe em crash | Baixa | Alto | Backups periódicos, WAL mode habilitado |
| Firebase Hosting tem cold start | Baixa | Baixo | SPA com Angular service worker para cache |
| VPS sem memória suficiente para Playwright | Média | Alto | Monitorar RAM, limitar browser instances concorrentes |

---

## Referências

- [Angular 21 Standalone Components](https://angular.dev/guide/components)
- [Angular Signals](https://angular.dev/guide/signals)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [PrimeNG Documentation](https://primeng.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [uv - Python Package Manager](https://docs.astral.sh/uv/)
- [Playwright for Python](https://playwright.dev/python/)
- [APScheduler Documentation](https://apscheduler.readthedocs.io/)
- [SQLAlchemy 2.x Async](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
