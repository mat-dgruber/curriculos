# Specs — Scraping & Automação

## Convenções Gerais

- Todo scraper herda de `BaseScraper` — nunca criar scrapers avulsos
- Todo applicator herda de `BaseApplicator` — nunca criar automações avulsas
- Delay aleatório entre ações: `random.uniform(1, 3)` — nunca clicar sem pausa
- Screenshot obrigatório após cada tentativa (sucesso ou falha)
- Atualizar status da candidatura no banco após execução — nunca deixar sem status
- Nunca armazenar credenciais de plataformas — agir como usuário logado via sessão de browser
- Tratar `TimeoutError` e `ElementNotFoundError` com log + status "Falhou"
- Priorizar seletores por `aria-label` ou `data-testid` — nunca usar `.class > div:nth-child(2)`
- Documentar no código qual seletor está sendo usado e por quê (seletores mudam com frequência)

---

## Scrapers

### 1. BaseScraper

**Arquivo:** `backend/app/services/scraper/base_scraper.py`

**Responsabilidade:** Interface comum para todos os scrapers. Define contrato, tratamento de erros, logs e ciclo de vida.

**Interface:**
```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from playwright.async_api import Page

@dataclass
class ScrapedJob:
    title: str
    company: str
    location: str
    description: str
    url: str
    platform: str
    salary_range: str | None = None
    raw_html: str | None = None

class BaseScraper(ABC):
    def __init__(self, page: Page, profile: CandidateProfile):
        self.page = page
        self.profile = profile
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    async def scrape(self, search_params: dict) -> list[ScrapedJob]:
        """Executa a varredura e retorna lista de vagas encontradas."""
        ...

    @abstractmethod
    def _build_search_url(self, params: dict) -> str:
        """Monta a URL de busca com os parâmetros do perfil."""
        ...

    async def _random_delay(self, min_s: float = 1.0, max_s: float = 3.0):
        """Delay aleatório entre ações para evitar detecção de bot."""
        delay = random.uniform(min_s, max_s)
        await asyncio.sleep(delay)

    async def _safe_goto(self, url: str, timeout: int = 30000):
        """Navega para URL com tratamento de timeout."""
        try:
            await self.page.goto(url, wait_until="domcontentloaded", timeout=timeout)
        except TimeoutError:
            self.logger.warning(f"Timeout ao acessar {url}")
            raise

    async def _take_screenshot(self, name: str) -> str:
        """Captura screenshot e retorna path do arquivo."""
        path = f"./storage/screenshots/{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        await self.page.screenshot(path=path)
        return path
```

**Tratamento de erros padrão:**
| Erro | Ação |
|---|---|
| `TimeoutError` | Log warning + retry se aplicável + pular item |
| `ElementNotFoundError` | Log warning + screenshot + pular item |
| `CaptchaDetectado` | Log erro + status "Falhou" + NÃO tentar burlar |
| `ConexaoPerdida` | Retry 1x após 5s + abortar se falhar |

---

### 2. LinkedInScraper

**Arquivo:** `backend/app/services/scraper/linkedin_scraper.py`

**Plataforma:** LinkedIn Jobs (vagas públicas, SEM login)

**Método de extração:** Playwright — navegação em páginas de busca pública do LinkedIn

**URL base:** `https://www.linkedin.com/jobs/search/?keywords={keywords}&location={location}&f_TPR=r604800`

**Dados extraídos:**
| Campo | Seletor | Observação |
|---|---|---|
| `title` | `[data-testid="job-title"]` ou `.job-search-card__title` | Título da vaga |
| `company` | `[data-testid="company-name"]` ou `.job-search-card__company-name` | Nome da empresa |
| `location` | `[data-testid="job-location"]` ou `.job-search-card__location` | Cidade/estado |
| `description` | `.show-more-less-html__markup` | Descrição completa (abre card) |
| `url` | `a[href*="/jobs/view/"]` | Link direto da vaga |
| `salary_range` | `.job-search-card__salary-info` | Quando disponível (muitas vezes vazio) |

**Fluxo de execução:**
1. Construir URL de busca com keywords do perfil
2. Navegar para a página de resultados
3. Scroll para carregar vagas (LinkedIn usa lazy loading)
4. Para cada card de vaga: extrair dados, aplicar filtros
5. Clicar no card para abrir descrição completa
6. Extrair descrição detalhada
7. Salvar `ScrapedJob` com `platform="linkedin"`
8. Paginar se houver próxima página (máx 5 páginas)

**Filtros aplicados:**
- Keywords do perfil do candidato (título, descrição)
- Localização preferida
- Data de publicação: últimos 7 dias (`f_TPR=r604800`)

**Tratamento de erros:**
| Erro | Ação |
|---|---|
| Página de login aparece | Abortar scraping + log "LinkedIn exige login" |
| Captcha/Verificação | Abortar + log + screenshot |
| Vaga removida | Pular + log warning |
| Descrição não carrega | Usar snippet disponível + log |

**Retry strategy:** 2 tentativas com delay de 3s entre cada. Se falhar 2x, pular item.

**Limitações conhecidas:**
- LinkedIn pode bloquear IP após muitas requisições sem login
- Descrições completas podem não carregar sem login
- Rate limit não documentado — estimado em ~100 requests/hora
- Seletores mudam frequentemente — manter testes de smoke

**Anti-bot:**
- Delay aleatório 2-4s entre ações (maior que outras plataformas)
- User-Agent de browser real
- Não fazer mais de 3 buscas por execução
- Variar keywords entre execuções

---

### 3. GupyScraper

**Arquivo:** `backend/app/services/scraper/gupy_scraper.py`

**Plataforma:** Gupy (API pública JSON — priorizar sobre scraping)

**Método de extração:** Requisição HTTP direta à API pública do Gupy

**Endpoint da API:** `https://api.gupy.io/api/job?search={keywords}&location={location}&page={page}`

**Dados extraídos:**
| Campo | Campo JSON | Observação |
|---|---|---|
| `title` | `job.name` | Título da vaga |
| `company` | `job.company.name` | Nome da empresa |
| `location` | `job.address.city` + `job.address.state` | Cidade/estado |
| `description` | `job.description` | Descrição em HTML (converter para texto) |
| `url` | `https://gupy.io/jobs/{job.id}` | Link da vaga |
| `salary_range` | `job.salary_range` | Quando disponível |

**Fluxo de execução:**
1. Construir query params com keywords e localização do perfil
2. Fazer GET na API pública (sem autenticação)
3. Parsear resposta JSON
4. Para cada vaga: extrair dados, aplicar filtros
5. Paginar (API retorna `total_pages`)
6. Salvar `ScrapedJob` com `platform="gupy"`

**Filtros aplicados:**
- Keywords do perfil (parâmetro `search`)
- Localização (parâmetro `location`)
- Apenas vagas ativas (`status === "active"`)

**Tratamento de erros:**
| Erro | Ação |
|---|---|
| HTTP 429 (rate limit) | Aguardar 60s + retry 1x |
| HTTP 500/503 | Retry 2x com delay 5s |
| JSON inválido | Log erro + abortar |
| Campo ausente | Usar valor padrão ("Não informado") |

**Retry strategy:** 3 tentativas com backoff exponencial (2s, 4s, 8s).

**Limitações conhecidas:**
- API pública pode ser descontinuada sem aviso
- Nem todas as vagas do Gupy estão na API pública
- Descrição em HTML precisa de limpeza (remover tags)

**Anti-bot:**
- Apenas 1 requisição a cada 3s
- Não mais de 10 páginas por execução

---

### 4. VagasScraper

**Arquivo:** `backend/app/services/scraper/vagas_scraper.py`

**Plataforma:** Vagas.com

**Método de extração:** Playwright + BeautifulSoup (página renderizada → parse HTML)

**URL base:** `https://www.vagas.com.br/vagas-de-{keywords}?pagina={page}`

**Dados extraídos:**
| Campo | Seletor | Observação |
|---|---|---|
| `title` | `.vaga__title a` ou `[data-testid="vaga-titulo"]` | Título da vaga |
| `company` | `.vaga__empresa` ou `[data-testid="vaga-empresa"]` | Nome da empresa |
| `location` | `.vaga__localizacao` | Cidade/estado |
| `description` | `.vaga__descricao` (abre detalhe) | Descrição completa |
| `url` | `.vaga__title a[href]` | Link da vaga |
| `salary_range` | `.vaga__salario` | Quando exibido |

**Fluxo de execução:**
1. Construir URL de busca com keywords
2. Playwright navega até a página de resultados
3. Obter HTML da página após renderização
4. BeautifulSoup parseia o HTML
5. Para cada card de vaga: extrair dados, aplicar filtros
6. Paginar (seletor `.paginacao__proxima`)
7. Salvar `ScrapedJob` com `platform="vagas"`

**Filtros aplicados:**
- Keywords do perfil
- Localização (parâmetro de URL)
- Vagas publicadas nos últimos 7 dias

**Tratamento de erros:**
| Erro | Ação |
|---|---|
| Página não carrega | Retry 2x + screenshot |
| Captcha Cloudflare | Abortar + log + screenshot |
| Vaga sem descrição | Usar snippet + log |
| HTML estrutura mudou | Log erro + abortar + alerta |

**Retry strategy:** 2 tentativas com delay 5s.

**Limitações conhecidas:**
- Vagas.com usa Cloudflare — possível bloqueio de bots
- Estrutura HTML muda com frequência — seletores frágeis
- Pode exigir cookies de sessão para páginas avançadas
- Rate limit estimado em ~50 requests/hora

**Anti-bot:**
- Delay aleatório 2-4s entre páginas
- User-Agent real
- Máximo 3 páginas por execução
- Scroll gradual (não saltar para o fim)

---

## Applicators

### 1. BaseApplicator

**Arquivo:** `backend/app/services/automation/base_applicator.py`

**Responsabilidade:** Interface comum para todos os applicators. Define contrato, screenshots, logging e ciclo de vida.

**Interface:**
```python
from abc import ABC, abstractmethod
from playwright.async_api import Page

@dataclass
class ApplicationResult:
    success: bool
    status: str  # "Enviado" | "Falhou"
    screenshot_path: str | None = None
    error_message: str | None = None
    platform: str | None = None

class BaseApplicator(ABC):
    def __init__(self, page: Page, profile: CandidateProfile, cv_path: str):
        self.page = page
        self.profile = profile
        self.cv_path = cv_path
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    async def apply(self, job: Job) -> ApplicationResult:
        """Executa a candidatura automatizada para uma vaga."""
        ...

    @abstractmethod
    async def _fill_form(self, form_fields: dict) -> None:
        """Preenche o formulário com dados do perfil."""
        ...

    @abstractmethod
    async def _upload_cv(self, file_input_selector: str) -> None:
        """Anexa o currículo PDF ao formulário."""
        ...

    async def _random_delay(self, min_s: float = 1.0, max_s: float = 3.0):
        """Delay aleatório entre ações."""
        delay = random.uniform(min_s, max_s)
        await asyncio.sleep(delay)

    async def _take_screenshot(self, prefix: str, success: bool) -> str:
        """Captura screenshot como evidência. Sempre executa."""
        status = "success" if success else "fail"
        path = f"./storage/screenshots/{prefix}_{status}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        await self.page.screenshot(path=path, full_page=True)
        return path

    async def _safe_click(self, selector: str, timeout: int = 10000):
        """Click com tratamento de erro e delay."""
        await self._random_delay()
        try:
            await self.page.click(selector, timeout=timeout)
        except (TimeoutError, ElementNotFoundError):
            self.logger.warning(f"Elemento não encontrado: {selector}")
            raise

    async def _safe_fill(self, selector: str, value: str, timeout: int = 10000):
        """Preenche campo com tratamento de erro."""
        await self._random_delay()
        await self.page.fill(selector, value, timeout=timeout)

    async def _wait_for_navigation(self, timeout: int = 30000):
        """Aguarda navegação após submit."""
        try:
            await self.page.wait_for_load_state("networkidle", timeout=timeout)
        except TimeoutError:
            self.logger.warning("Timeout aguardando navegação")
```

**Fluxo padrão de qualquer applicator:**
1. Navegar até a URL do formulário
2. Aguardar carregamento completo
3. Detectar campos do formulário
4. Preencher cada campo com dados do perfil
5. Anexar currículo PDF
6. Capturar screenshot antes de enviar
7. Clicar em enviar/submit
8. Aguardar confirmação ou erro
9. Capturar screenshot após envio
10. Retornar `ApplicationResult` com status e caminhos dos screenshots

---

### 2. GupyApplicator

**Arquivo:** `backend/app/services/automation/gupy_applicator.py`

**Plataforma:** Gupy

**Método:** Playwright automation em formulários de candidatura do Gupy

**Seletor:** `[data-testid="apply-button"]`, `[data-testid="input-name"]`, etc.

**Campos do formulário:**
| Campo | Seletor | Dados do Perfil | Observação |
|---|---|---|---|
| Nome | `[data-testid="input-name"]` | `profile.name` | Campo obrigatório |
| E-mail | `[data-testid="input-email"]` | `profile.email` | Campo obrigatório |
| Telefone | `[data-testid="input-phone"]` | `profile.phone` | Campo obrigatório |
| Currículo | `input[type="file"]` | `cv_path` | Upload PDF |
| LinkedIn | `[data-testid="input-linkedin"]` | `profile.linkedin_url` | Opcional |
| Cidade | `[data-testid="input-city"]` | `profile.location` | Pode ser select |

**Fluxo completo:**
1. Navegar para `https://gupy.io/jobs/{job_id}`
2. Clicar em "Candidatar-se" (`[data-testid="apply-button"]`)
3. Aguardar formulário aparecer
4. Preencher campos obrigatórios (nome, e-mail, telefone)
5. Anexar currículo PDF
6. Preencher campos opcionais (LinkedIn, cidade)
7. Screenshot antes de enviar
8. Clicar em "Enviar candidatura"
9. Aguardar mensagem de confirmação
10. Screenshot de confirmação
11. Retornar `ApplicationResult(success=True, status="Enviado")`

**Tratamento de erros:**
| Erro | Ação |
|---|---|
| Botão "Candidatar-se" não existe | Vaga não aceita mais candidaturas → status "Falhou" |
| Formulário com campos extras | Log campos extras + preencher os que conhece |
| Erro de validação no formulário | Capturar mensagem de erro + screenshot + status "Falhou" |
| Upload falha | Retry 1x + status "Falhou" se persistir |
| Timeout após submit | Screenshot + status "Falhou" + log |

**Retry strategy:** 1 retry para upload e submit. Sem retry para preenchimento de campos.

**Limitações conhecidas:**
- Gupy muda formulários entre empresas (campos variam)
- Algumas vagas exigem testes psicotécnicos antes da candidatura
- Gupy pode bloquear automação após muitas candidaturas
- Formulários multi-etapa exigem lógica adicional

---

### 3. GenericApplicator

**Arquivo:** `backend/app/services/automation/generic_applicator.py`

**Plataforma:** Sites genéricos de "Trabalhe Conosco" / páginas de candidatura

**Método:** Playwright heurístico — detecta campos por tipo/name/placeholder

**Detecção de campos (heurística):**
```python
FIELD_MAPPING = {
    "name": ['input[name*="nome"]', 'input[placeholder*="nome"]', 'input[name="name"]'],
    "email": ['input[type="email"]', 'input[name*="email"]'],
    "phone": ['input[type="tel"]', 'input[name*="phone"]', 'input[name*="telefone"]'],
    "cv": ['input[type="file"][accept*="pdf"]', 'input[type="file"]'],
    "message": ['textarea', 'input[name*="mensagem"]', 'input[name*="message"]'],
    "linkedin": ['input[name*="linkedin"]', 'input[placeholder*="linkedin"]'],
}
```

**Fluxo completo:**
1. Navegar até `company.application_url`
2. Aguardar carregamento completo
3. Detectar campos do formulário via heurística
4. Para cada campo detectado: preencher com dados correspondentes do perfil
5. Se houver campo de upload: anexar currículo PDF
6. Se houver textarea: preencher com carta de apresentação padrão
7. Screenshot antes de enviar
8. Detectar botão de submit (`button[type="submit"]`, `input[type="submit"]`, etc.)
9. Clicar em submit
10. Aguardar resposta
11. Screenshot após envio
12. Retornar `ApplicationResult`

**Carta de apresentação padrão:**
```
Prezado(a) recrutador(a),

Gostaria de me candidatar a oportunidades em sua empresa.
Possuo experiência em [target_role do perfil] e acredito que minhas habilidades
são compatíveis com as necessidades da organização.

Meu currículo em anexo contém mais detalhes sobre minha experiência e formação.

Atenciosamente,
[nome do candidato]
```

**Tratamento de erros:**
| Erro | Ação |
|---|---|
| Nenhum campo detectado | Log + screenshot + status "Falhou" |
| Captcha presente | Log + screenshot + status "Falhou" + NÃO tentar burlar |
| Iframe de formulário | Mudar para iframe + retry detecção |
| Formulário multi-página | Detectar botão "Próximo" + avançar etapas |
| Upload não suportado | Log + preencher apenas campos de texto |
| Site fora do ar | Retry 2x + status "Falhou" |

**Retry strategy:** 2 tentativas com delay 5s para navegação. 1 retry para submit.

**Limitações conhecidas:**
- Heurística de detecção não é 100% precisa
- Formulários muito customizados podem não ser detectados
- Sites com JavaScript pesado podem não renderizar campos
- Iframes aninhados complicam detecção
- Rate limits desconhecidos — variam por site

**Anti-bot:**
- Delay aleatório 2-4s entre ações
- User-Agent real
- Não mais de 3 empresas por execução
- Respeitar `robots.txt` quando possível

---

## Serviços de Orquestração

### Matcher Service

**Arquivo:** `backend/app/services/matcher.py`

**Responsabilidade:** Calcula score de compatibilidade entre vaga e perfil.

**Algoritmo:**
```python
def calculate_score(job: Job, profile: CandidateProfile) -> int:
    score = 0

    # 1. Match de cargo (peso 40)
    if any(role.lower() in job.title.lower() for role in profile.target_roles):
        score += 40

    # 2. Match de keywords na descrição (peso 30)
    description_lower = job.description.lower()
    keyword_matches = sum(1 for kw in profile.keywords if kw.lower() in description_lower)
    keyword_score = min(30, keyword_matches * 6)  # max 5 keywords = 30 pts
    score += keyword_score

    # 3. Match de localização (peso 20)
    if any(loc.lower() in job.location.lower() for loc in profile.preferred_locations):
        score += 20

    # 4. Bônus plataforma confiável (peso 10)
    if job.platform in ("linkedin", "gupy"):
        score += 10

    return min(100, score)
```

---

### Scheduler Service

**Arquivo:** `backend/app/services/scheduler_service.py`

**Responsabilidade:** Gerencia jobs agendados via APScheduler.

**Jobs configurados:**
| Job ID | Trigger | Ação |
|---|---|---|
| `scan_jobs` | Interval (configurável, default 6h) | Executa todos os scrapers |
| `recurring_send` | Cron (dia 1 do mês, 10h) | Envia currículo para empresas fixas ativas |

**Regras:**
- Verificar se job já existe antes de criar (evitar duplicatas no restart)
- Job de envio recorrente NUNCA dispara se empresa tiver status "Respondeu" ou "Pausado"
- Cada execução gera log com timestamp, resultado e erros
- Suporte a pause/resume global e por empresa
