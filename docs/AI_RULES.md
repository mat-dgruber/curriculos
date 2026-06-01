# AI_RULES.md — JobHunter

## ⚠️ Purpose

Este documento define as regras inegociáveis para qualquer assistente de IA trabalhando neste codebase. Estas regras existem para manter qualidade, consistência e prevenir regressões. Violá-las não é aceitável sob nenhuma circunstância.

---

## 🔴 ABSOLUTE RULES (Never Break These)

### Stack (NON-NEGOTIABLE)
- Frontend é sempre **Angular 21+** — nunca sugira React, Vue, Next.js ou qualquer outro framework
- Estilização é sempre **Tailwind CSS 3.4.17** — nunca use Angular Material, Bootstrap, ou estilos inline
- Quando um componente pré-pronto for necessário, use sempre **PrimeNG 21+** — nunca instale outras bibliotecas de componentes
- Prefira construir **componentes Angular customizados** primeiro — recorra ao PrimeNG apenas quando economizar tempo ou complexidade real (tabelas, carousels, overlays complexos)
- Backend é sempre **Python 3.14+ com FastAPI** — nunca use Node/Express, Django, ou Flask
- Gerenciamento de pacotes no backend é sempre **uv** — nunca use `pip install` ou `poetry` diretamente
- Sempre use **Angular standalone components** — nunca use NgModules

### Angular Code Quality
- Sempre use **signals** (`signal()`, `computed()`, `effect()`) para estado reativo — nunca use `RxJS Subject/BehaviorSubject` para estado local simples
- Sempre use a **nova sintaxe de control flow** (`@if`, `@for`, `@switch`) — nunca use `*ngIf`, `*ngFor`, ou `*ngSwitch`
- Sempre use **TypeScript strict mode** — nunca use o tipo `any`
- Nunca coloque lógica de negócio dentro de componentes — use serviços em `core/services/`
- Nunca pule interfaces tipadas — todas as respostas de API e inputs de componentes devem ser tipados
- Nunca use `ElementRef` para manipular o DOM diretamente — use Angular bindings
- Nunca adicione `console.log` em código commitado

### Arquitetura
- Nunca desvie da estrutura de pastas definida em `ARCHITECTURE.md`
- Nunca crie um novo componente se um existente em `shared/components/` pode ser reutilizado
- Nunca instale uma nova dependência (npm ou Python) sem aprovação explícita do usuário
- Todas as chamadas HTTP passam por um serviço em `core/services/` — nunca chame `HttpClient` diretamente de um componente

### Backend Code Quality
- Sempre defina formatos de request/response com **modelos Pydantic**
- Sempre use **pydantic-settings** para configuração de ambiente — nunca hardcode valores
- Nunca exponha detalhes internos de erro em respostas de API
- Sempre adicione **CORS middleware** configurado apenas para a origin do frontend
- Sempre use `async/await` nas rotas FastAPI — nunca use funções síncronas onde I/O está envolvido

### Scraping & Automação (NON-NEGOTIABLE)
- Todo scraper deve herdar de `base_scraper.py` — nunca crie scrapers avulsos
- Todo applicator deve herdar de `base_applicator.py` — nunca crie automações avulsas
- Sempre adicione delay aleatório entre ações do Playwright (`random.uniform(1, 3)`) — nunca faça cliques sem pausa
- Sempre salve screenshot como evidência após cada tentativa de envio (sucesso ou falha)
- Sempre atualize o status da candidatura no banco — nunca deixe uma candidatura sem status após execução
- Nunca armazene credenciais de plataformas de vagas — o sistema age como o usuário logado via sessão de browser
- Sempre trate `TimeoutError` e `ElementNotFoundError` do Playwright com log + status "Falhou" — nunca deixe o processo crashar silenciosamente

### Agendamento
- Todos os jobs do APScheduler são definidos e gerenciados em `scheduler_service.py` — nunca crie jobs em outros lugares
- Sempre verifique se um job já existe antes de criar (evitar duplicatas no restart)
- O job de envio recorrente NUNCA dispara se a empresa tiver status "respondeu" ou "pausado"

### Design & UX
- Paleta dark + azul tech definida em `tailwind.config.js` — nunca altere as cores primárias
- Nunca use mais de 2 famílias de fontes
- Sempre mantenha contraste WCAG AA
- **Mobile-first sempre** — nunca construa desktop-first
- Nunca reduza tamanho de fonte abaixo de 16px para texto de corpo

---

## 🟡 STRONG PREFERENCES (Siga, a não ser que explicitamente instruído ao contrário)

- Prefira `input()` signal-based em vez de `@Input()` decorator no Angular 21+
- Prefira `output()` em vez de `@Output()` / `EventEmitter`
- Mantenha componentes com menos de 150 linhas — divida se for maior
- Mantenha handlers de rotas FastAPI finos — delegue lógica à camada de service
- Sempre adicione texto `alt` em imagens
- Use estratégia de change detection `OnPush` em todos os componentes
- Prefira `async/await` a `.then()/.catch()` em todo código TypeScript assíncrono
- Para o Playwright, prefira seletores por `aria-label` ou `data-testid` — nunca use seletores por CSS frágeis (`.class > div:nth-child(2)`)

---

## ✅ REQUIRED BEHAVIOR

- Antes de qualquer mudança, declare o que vai fazer e por quê
- Após qualquer mudança, resuma o que foi alterado
- Se estiver em dúvida sobre o escopo, pergunte antes de construir
- Sempre trabalhe a partir do `PLAN.md` — não invente tarefas
- Não avance para o próximo passo do `PLAN.md` até que o passo atual seja confirmado completo
- Quando criar um novo scraper ou applicator, sempre documente no código qual seletor está sendo usado e por quê (seletores mudam com frequência — o contexto ajuda na manutenção)
- Ao reportar um erro de Playwright, sempre inclua o screenshot capturado e o HTML do elemento problemático se disponível

---

## 🟠 DOMÍNIO ESPECÍFICO — Regras do JobHunter

- O score de compatibilidade é calculado pelo `matcher.py` — nunca recalcule no frontend
- Uma candidatura com status `"Enviado"` nunca pode voltar para `"Pendente"` — o fluxo de status é unidirecional
- Empresas fixas com `status = "respondeu"` devem parar os envios recorrentes automaticamente — nunca ignore esse flag
- O PDF do currículo nunca é exposto em URL pública — sempre servido via endpoint autenticado
- Logs de automação são sagrados — nunca apague registros do histórico de envios, apenas arquive
