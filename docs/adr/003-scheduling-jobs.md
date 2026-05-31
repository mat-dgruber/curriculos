# ADR-003: Agendamento & Jobs

## Status

Accepted

---

## Contexto

O JobHunter precisa executar duas operações recorrentes de forma autônoma:

1. **Varredura periódica de vagas** — scraping em múltiplas plataformas para encontrar novas vagas compatíveis com o perfil do candidato.
2. **Envio recorrente de currículo para empresas fixas** — disparo mensal automático do mesmo currículo para empresas com banco de talentos, até que haja resposta ou o usuário pause.

Essas operações devem rodar sem intervenção manual, com confiabilidade suficiente para uso pessoal diário, e com mecanismos de controle (pausa, logs, notificações).

---

## Decisão

### 1. APScheduler vs Celery

**Decisão:** Usar **APScheduler** como motor de agendamento.

**Justificativa:**
- APScheduler roda **no mesmo processo** do FastAPI — não requer broker externo (Redis, RabbitMQ) nem worker separado.
- Celery é poderoso mas **overkill** para uma aplicação single-user: adiciona complexidade operacional (broker, result backend, monitoramento de filas) sem benefício proporcional no escopo atual.
- APScheduler suporta `IntervalTrigger` (varredura a cada N horas) e `CronTrigger` (envio mensal no dia X) nativamente.
- Se no futuro o sistema escalar para multi-user com necessidade de filas distribuídas, a migração para Celery pode ser feita isolando a lógica de job em funções puras.

**Alternativas rejeitadas:**
- **Celery + Redis:** Complexidade operacional desnecessária para uso pessoal.
- **crontab do sistema:** Gerenciamento externo ao app, difícil de controlar via API, sem pause/resume nativo.
- **asyncio.sleep loop:** Frágil, sem persistência de estado, sem mecanismo de recovery.

### 2. Jobs no Mesmo Processo

**Decisão:** Backend FastAPI e scheduler APScheduler rodando **no mesmo processo/container**.

**Justificativa:**
- Deployment simplificado: um único `uvicorn` ou `Dockerfile` gerencia tudo.
- Sem latência de rede entre scheduler e lógica de negócio.
- Compartilham a mesma sessão de banco de dados (async SQLAlchemy).
- Para MVP pessoal, a separação em processos distintos não traz vantagem.

### 3. Frequência de Varredura

**Decisão:** Varredura a cada **6 horas**, configurável via variável de ambiente `SCAN_INTERVAL_HOURS`.

**Justificativa:**
- 6 horas é um equilíbrio entre **frescor das vagas** (vagas surgem e somem em horas) e **carga no servidor** (scraping consome CPU/memória).
- Configurável para permitir ajuste: 3h para busca intensa, 12-24h para manutenção leve.
- Em produção (VPS), 6h é seguro contra rate limits da maioria das plataformas.

### 4. Envio Recorrente Mensal

**Decisão:** Envio recorrente no **dia 1 de cada mês**, configurável via `RECURRING_SEND_DAY`.

**Justificativa:**
- Muitas empresas com banco de talentos **priorizam currículos recentes** — reenvio mensal mantém o candidato no topo da fila.
- Dia 1 é arbitrário mas consistente — fácil de lembrar e previsível.
- Configurável para permitir ajuste por empresa (implementação futura: `interval_days` por FixedCompany).

### 5. Pause/Resume por Empresa

**Decisão:** Cada FixedCompany possui flag `is_active` (toggle individual). Existe também **pausa global** do agendador via endpoint `PUT /scheduler/pause`.

**Justificativa:**
- **Toggle individual:** O usuário pode pausar envio para uma empresa específica (ex: já está em processo seletivo com ela) sem afetar as demais.
- **Pausa global:** Útil para férias, períodos de negociação em andamento, ou quando o candidato não quer receber notificações temporariamente.
- A pausa global recebe uma data de expiração (`pause_until`) — o scheduler retoma automaticamente após essa data.

### 6. Idempotência na Inicialização

**Decisão:** Ao iniciar o backend, **verificar se jobs já estão registrados** no scheduler antes de criar novos.

**Justificativa:**
- Em desenvolvimento, o backend é reiniciado frequentemente (`--reload`). Sem verificação, jobs duplicados seriam criados a cada restart.
- APScheduler mantém jobs em memória — ao reiniciar, jobs antigos são perdidos e novos são criados. A verificação `if not scheduler.get_job(job_id)` previne duplicatas dentro da mesma sessão.
- Para persistência entre restarts (produção), considerar `jobstore='sqlite'` no futuro.

### 7. Parada Automática ao Receber Resposta

**Decisão:** Quando uma FixedCompany recebe status `"Respondeu"` (via detecção de e-mail ou flag manual), os envios recorrentes para essa empresa **param automaticamente**.

**Justificativa:**
- Enviar currículo para uma empresa que já respondeu (positiva ou negativamente) é contraproducente e pode parecer spam.
- A lógica do job recorrente verifica `company.status != "Respondeu" AND company.is_active == True` antes de cada envio.
- Se a empresa respondeu negativamente, o candidato pode reativar manualmente se desejar tentar novamente no futuro.

### 8. Logging como Auditoria

**Decisão:** Cada execução de job gera **log completo** com timestamp, resultado, vagas encontradas/enviadas e erros. Logs nunca são deletados — apenas arquivados.

**Justificativa:**
- Logs são a **trilha de auditoria** do sistema — permitem diagnosticar falhas (Captcha, timeout, seletores quebrados).
- Em caso de problema legal (LGPD, ToS de plataformas), logs documentam exatamente o que foi feito e quando.
- Para MVP pessoal, logs em arquivo (`./storage/logs/`). Em produção, considerar logging estruturado (JSON) para análise.

### 9. Threshold de Auto-Apply

**Decisão:** Se `auto_apply` estiver habilitado no perfil, vagas com **score ≥ 80%** disparam candidatura automática. Abaixo disso, o usuário deve aprovar manualmente.

**Justificativa:**
- Score ≥ 80% indica **alta compatibilidade** — vale o risco de envio automático.
- Scores menores podem incluir falsos positivos — melhor deixar o humano decidir.
- O threshold é fixo no MVP. Futuramente pode ser configurável por área de interesse.

### 10. Notificação por E-mail

**Decisão:** E-mail enviado após cada execução de job (varredura ou envio), contendo resumo do resultado.

**Justificativa:**
- Mantém o usuário informado sem precisar abrir o painel.
- Varredura: "Encontradas 5 novas vagas, 2 com score ≥ 80%".
- Envio: "Currículo enviado com sucesso para Empresa X" ou "Falha no envio para Empresa Y — Captcha detectado".
- E-mail de falha permite ação rápida (verificar screenshot, ajustar seletor).

---

## Consequências

### Positivas

- **Zero configuração externa:** Não precisa de Redis, RabbitMQ ou filas — roda em qualquer VPS com Python.
- **Controle granular:** Pause por empresa, pausa global, threshold configurável.
- **Auditoria completa:** Cada ação automatizada é registrada com timestamp e evidência (screenshot).
- **Recuperação graceful:** Em caso de falha (Captcha, timeout), o job continua para a próxima empresa/vaga — nunca trava o ciclo inteiro.
- **Notificação proativa:** Usuário sabe o que o robô fez sem precisar verificar manualmente.

### Negativas

- **Jobs em memória:** APScheduler padrão mantém jobs em memória — se o processo morre, jobs precisam ser re-registrados no startup.
- **Escopo limitado:** Single-process não escala horizontalmente (não é problema para uso pessoal).
- **Acoplamento:** Scheduler e backend no mesmo processo significa que um crash derruba ambos.
- **Sem retry automático:** Falhas em envio individual não são automaticamente retentadas (usuário pode retentar manualmente via painel).

### Riscos

- **Plataformas bloqueiam automação:** Captcha ou rate limit impedem envio → mitigado por logs + notificação de falha + screenshots como evidência.
- **Seletores HTML mudam:** Sites atualizam formulários → scrapers/applicators quebram → mitigado por documentação de seletores + monitoramento de falhas.
- **E-mail de notificação cai em spam:** Configuração SMTP incorreta → mitigado por validação no setup + testes de e-mail no deploy.
- **Scheduler não persiste entre restarts:** Em produção com `--reload`, jobs são perdidos → mitigado por lógica de re-registro no startup.
