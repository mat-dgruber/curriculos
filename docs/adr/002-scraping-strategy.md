# ADR-002: Estratégia de Scraping

## Status
Accepted

---

## Contexto

O JobHunter precisa extrair vagas de múltiplas plataformas (LinkedIn, Gupy, Vagas.com) e automatizar o envio de currículos via formulários web. Cada plataforma possui mecanismos de defesa contra bots — Captchas, rate limiting, detecção de comportamento não-humano. Além disso, os seletores HTML dessas plataformas mudam frequentemente, exigindo manutenção constante dos scrapers.

O contexto é uso pessoal (single-user), o que reduz o risco legal comparado a uma ferramenta comercial, mas não elimina a responsabilidade de respeitar Termos de Serviço e a LGPD.

As decisões abaixo definem como o sistema lida com extração de dados, automação de formulários, tratamento de erros e manutenção dos seletores.

---

## Decisão

### 1. Playwright como ferramenta de automação (não Selenium)

**Escolha:** Playwright (Python) para automação de browser headless.

**Alternativas rejeitadas:**
- Selenium: API mais antiga, sem auto-wait nativo, setup mais complexo, sem suporte async nativo
- Requests + BeautifulSoup: limitado a HTML estático, não lida com SPAs ou conteúdo renderizado via JS

**Justificativa:**
- API moderna com auto-wait built-in (espera elemento existir antes de interagir)
- Suporte nativo a `async/await` — integração perfeita com FastAPI
- Melhor DX (Developer Experience) — seletores por texto, role, testid
- Multi-browser (Chromium, Firefox, WebKit) para testes cross-platform
- Comunidade ativa e documentação excelente

---

### 2. Priorizar API pública do Gupy sobre scraping HTML

**Escolha:** Quando a plataforma oferece API pública (como o Gupy), usá-la em vez de scraping HTML.

**Justificativa:**
- APIs públicas são mais estáveis — não dependem de seletores HTML que mudam
- Respostas em JSON — parsing mais simples e confiável
- Menor chance de bloqueio — requests HTTP simples vs. browser headless
- Performance superior — sem overhead de renderização de página

**Limitação:** Nem todas as plataformas oferecem API pública. LinkedIn e Vagas.com exigem scraping.

---

### 3. LinkedIn sem login (vagas públicas apenas)

**Escolha:** Scraping de vagas públicas do LinkedIn sem autenticação.

**Alternativas rejeitadas:**
- Login com credenciais do usuário: risco alto de banimento de conta
- API oficial do LinkedIn: requer aprovação de parceiro, inviável para uso pessoal
- APIs de terceiros (RapidAPI, etc.): custo recorrente, dependência externa

**Justificativa:**
- LinkedIn ban ativamente contas que fazem scraping autenticado
- Vagas públicas já contêm informações suficientes (título, empresa, localização, descrição)
- O perfil completo da vaga pode ser acessado manualmente pelo link original
- Risco zero para a conta do usuário

**Limitação:** Dados menos completos que vagas autenticadas (sem salário, menos detalhes).

---

### 4. Captcha: log + status "Falhou" (sem tentativa de bypass)

**Escolha:** Quando um Captcha é detectado, registrar log e marcar a candidatura como "Falhou".

**Alternativas rejeitadas:**
- Serviços de resolução de Captcha (2Captcha, Anti-Captcha): custo financeiro, lentidão, questionável eticamente
- IA para resolver Captchas: precisão insuficiente, dependência de modelos externos
- Tentar esconder automação: técnicas como stealth plugin, proxy rotation — complexidade alta, eficácia decrescente

**Justificativa:**
- Bypass de Captcha pode violar Termos de Serviço e leis (CFAA nos EUA, analogias no BR)
- Para uso pessoal, o custo/benefício não justifica — melhor focar em plataformas sem Captcha
- Status "Falhou" é transparente — o usuário sabe exatamente o que aconteceu
- Log permite identificar padrões (quais plataformas bloqueiam mais)

---

### 5. Estratégia de seletores: `aria-label` e `data-testid` sobre CSS

**Escolha:** Priorizar seletores semânticos (`aria-label`, `data-testid`, `role`) em vez de seletores CSS (`.class > div:nth-child(2)`).

**Justificativa:**
- Seletores CSS são frágeis — uma mudança de layout quebra a automação
- `aria-label` e `data-testid` são intencionalmente estáveis (usados para testes e acessibilidade)
- Melhor legibilidade do código — `[aria-label="Enviar currículo"]` é mais claro que `.form-actions > button:nth-child(3)`
- Facilita manutenção — quando o seletor quebra, o contexto está documentado no código

**Convenção:** Todo seletor usado no código deve ter comentário explicando qual elemento representa e por quê.

---

### 6. Retry strategy: 3 tentativas com delay aleatório

**Escolha:** 3 tentativas de retry com delay aleatório entre 1 e 3 segundos entre cada ação.

**Justificativa:**
- Falhas transitórias (timeout de rede, elemento carregando) são comuns em automação
- Delay aleatório (não fixo) evita padrão detectável por anti-bots
- 3 tentativas é suficiente para lidar com instabilidade sem desperdiçar tempo
- Após 3 falhas, o status é "Falhou" definitivo — não tentar infinitamente

**Implementação:**
```python
import random
import asyncio

for attempt in range(3):
    try:
        await action()
        break
    except (TimeoutError, ElementNotFoundError):
        if attempt < 2:
            await asyncio.sleep(random.uniform(1, 3))
        else:
            raise
```

---

### 7. Screenshots como evidência obrigatória

**Escolha:** Capturar screenshot após toda tentativa de envio (sucesso ou falha).

**Justificativa:**
- Evidência auditável — o usuário pode verificar o que aconteceu
- Debugging — quando algo falha, o screenshot mostra o estado real da página
- Transparência — candidatura "Enviada" tem prova visual
- LGPD — evidência de consentimento implícito (o sistema agiu em nome do usuário)

**Armazenamento:** `/storage/screenshots/YYYY-MM-DD_HH-MM.png` (timestamp no nome).

---

### 8. Rate limiting com comportamento humano

**Escolha:** Delays aleatórios entre ações para simular comportamento humano.

**Parâmetros:**
- Entre ações de clique: `random.uniform(1, 3)` segundos
- Entre páginas: `random.uniform(2, 5)` segundos
- Entre candidaturas: `random.uniform(5, 10)` segundos

**Justificativa:**
- Cliques sem pausa são o sinal mais óbvio de bot para anti-automation systems
- Delay fixo (ex: sempre 2s) é tão detectável quanto sem delay — precisa de aleatoriedade
- Parâmetros ajustáveis via `.env` para calibrar por plataforma

---

### 9. Padrão de classe base para scrapers e applicators

**Escolha:** Todos os scrapers herdam de `base_scraper.py`, todos os applicators herdam de `base_applicator.py`.

**Justificativa:**
- Consistência — todo scraper tem os mesmos métodos (`scrape()`, `parse()`, `save()`)
- Reutilização — logging, screenshots, retry, tratamento de erros no base
- Extensibilidade — adicionar nova plataforma = criar classe filha com métodos específicos
- Manutenção — correção no base propaga para todos os scrapers

---

### 10. Error handling: nunca crashar silenciosamente

**Escolha:** `TimeoutError` e `ElementNotFoundError` do Playwright resultam em log + status "Falhou".

**Justificativa:**
- Crash silencioso = candidatura sem status = dados corrompidos no banco
- Log estruturado permite debugging posterior
- Status "Falhou" é informativo — o usuário sabe que precisa intervir
- O processo nunca para — uma falha individual não derruba o scheduler

---

### 11. Nunca armazenar credenciais de plataformas

**Escolha:** O sistema NUNCA armazena senhas ou tokens de plataformas de vagas.

**Justificativa:**
- Segurança — credenciais armazenadas são vetor de ataque
- LGPD — dados de acesso a terceiros são dados sensíveis
- O sistema age como o usuário logado via sessão de browser (cookies)
- Para MVP pessoal, o usuário loga manualmente uma vez; o Playwright reusa a sessão

**Futuro:** Se multi-user, considerar OAuth ou browser profiles isolados por usuário.

---

### 12. Manutenção de seletores: documentação obrigatória no código

**Escolha:** Todo seletor usado em scrapers/applicators deve ter comentário documentando qual elemento HTML representa.

**Exemplo:**
```python
# Botão "Enviar candidatura" — seletor pode mudar se Gupy atualizar o form
await page.click('[data-testid="submit-application"]')
```

**Justificativa:**
- Seletores HTML de sites externos mudam sem aviso
- Sem documentação, o desenvolvedor futuro não sabe qual elemento o seletor representava
- Comentário com contexto reduz tempo de manutenção de horas para minutos

---

## Consequências

### Positivas

- **Robustez:** Playwright + auto-wait + retry cobre a maioria das falhas transitórias
- **Segurança:** Sem bypass de Captcha, sem armazenamento de credenciais, compliance LGPD
- **Manutenibilidade:** Seletores documentados + classe base = debugging rápido
- **Transparência:** Screenshots + logs = auditoria completa de cada ação
- **Extensibilidade:** Adicionar nova plataforma = criar classe filha, herdar comportamento comum
- **Performance:** API pública do Gupy > scraping HTML (quando disponível)

### Negativas

- **Cobertura limitada:** Sem login no LinkedIn = vagas menos detalhadas
- **Fragilidade:** Seletores HTML mudam — manutenção periódica inevitável
- **Velocidade:** Delays aleatórios tornam o processo mais lento (mas mais seguro)
- **Captchas:** Plataformas com Captcha forte ficam inacessíveis automaticamente

### Riscos

- **Mudanças de plataforma:** LinkedIn, Gupy ou Vagas.com podem mudar estrutura HTML, quebrando scrapers
- **Bloqueio de IP:** Mesmo com delays, uso frequente pode resultar em bloqueio temporário de IP
- **Termos de Serviço:** Scraping pode violar ToS de algumas plataformas — risco documentado mas não eliminado
- **Dependência de Playwright:** Se Playwright mudar API significativamente, adaptação necessária
- **LGPD:** Envio automatizado de dados pessoais para terceiros exige transparência com o usuário
