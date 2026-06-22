# Guia de Infraestrutura — Producao JobHunter

> Documento completo da infraestrutura de producao do JobHunter.
> Custo total: **$0/mes**. Tudo roda em tiers Always Free.

---

## 1. Ambiente de Producao Atual

### 1.1 Arquitetura Resumida

```
┌──────────────────┐     HTTPS      ┌──────────────────────────────────────┐
│   Firebase       │ ◄────────────► │   Oracle Cloud Always Free VM ARM   │
│   Hosting        │                │   (Ampere A1 — VM.Standard.A1.Flex) │
│                  │                │                                      │
│  Angular SPA     │  REST/JSON     │  Docker Container: jobhunter         │
│  (estatico)      │ ◄────────────► │  ├── FastAPI (:8000)                │
│                  │                │  ├── APScheduler (in-process)        │
│  jobhunter       │                │  └── Playwright Chromium            │
│  .web.app        │                │                                      │
└──────────────────┘                │  Volumes Docker (persistentes):      │
                                    │  ├── ./data/jobhunter.db            │
                                    │  ├── ./storage/cv/                  │
                                    │  └── ./storage/screenshots/         │
                                    │                                      │
                                    │  Custo: $0/mes                      │
                                    └──────────────────────────────────────┘
```

### 1.2 VM Oracle Cloud — Especificacoes

| Recurso | Valor (alocado) | Alocado / max na conta | Limite Always Free |
|---|---|---|---|
| Shape | VM.Standard.A1.Flex | — | — |
| OCPU | 1 | **1 / 4** | 4 |
| RAM | 956 MiB (~1 GiB) | **956 MiB / 24 GiB** | 24 GiB |
| Swap (file-based) | 2 GiB | — | — |
| Boot Volume | 47 GB | — | 200 GB |
| Imagem | Ubuntu 22.04 (aarch64) | — | — |
| Regiao | sa-saopaulo-1 (recomendado) | — | — |
| Saida de rede | 10 TB/mes | — | 10 TB/mes |

> **Estado real (jun/2026)**: apenas 1 OCPU e 956 MiB estāo alocados (a categoria "alocado" do OCI indica apenas 1 vCPU e ~1 GB; o restante da cota Always Free de 4 OCPU/24 GB RAM estāo disponíveis mas nao provisionados). Swap de 2 GiB adicionado via `/swapfile` para absorver picos do Chromium durante varreduras.

> **Memória é o gargalo principal**: scrapers que rodam Playwright/Chromium podem consumir 100-150 MB de RSS por navegador aberto. Por isso a politica atual (`mem_limit: 700m`, `PLAYWRIGHT_SLOW_MO=0`, scrapers sequenciais) é obrigatória — vide secao 7 (Incidentes) abaixo.

### 1.3 Portas e Rede

```
Porta   Servico              Observacao
─────   ───────────────────  ──────────────────────────
22      SSH                  Acesso remoto (chave apenas)
8000    FastAPI              API REST (HTTP direto)
443     Nginx (opcional)     HTTPS via Certbot/Let's Encrypt
```

**Oracle Cloud Security List (Ingress Rules):**

| Protocol | Source CIDR | Port | Descricao |
|---|---|---|---|
| TCP | 0.0.0.0/0 | 22 | SSH |
| TCP | 0.0.0.0/0 | 8000 | FastAPI |
| TCP | 0.0.0.0/0 | 443 | HTTPS (Nginx) |
| ICMP | 0.0.0.0/0 | — | Ping (diagnostico) |

**Oracle Cloud Security List (Egress Rules):**

| Protocol | Dest CIDR | Port | Descricao |
|---|---|---|---|
| TCP | 0.0.0.0/0 | 80 | HTTP (sites alvo para scraping) |
| TCP | 0.0.0.0/0 | 443 | HTTPS (sites alvo para scraping) |
| TCP | 0.0.0.0/0 | 587 | SMTP (envio de e-mail via Gmail) |

### 1.4 Docker

#### Dockerfile

```dockerfile
FROM python:3.14-slim

# Dependencias do Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Playwright + Chromium
RUN pip install playwright && playwright install --with-deps chromium

# uv (gerenciador de pacotes)
RUN pip install uv

WORKDIR /app

# Cache de layers — dependencias primeiro
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Codigo da aplicacao
COPY . .

# Diretorios de storage
RUN mkdir -p /app/data /app/storage/cv /app/storage/screenshots /app/backups

EXPOSE 8000

# Health check integrado ao Docker
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: .
    container_name: jobhunter
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - ./storage:/app/storage
      - ./backups:/app/backups
    env_file: .env
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**Volumes persistentes:**

| Volume | Caminho no Host | Caminho no Container | Conteudo |
|---|---|---|---|
| data | ./data/ | /app/data/ | jobhunter.db + WAL + SHM |
| storage | ./storage/ | /app/storage/ | CVs e screenshots |
| backups | ./backups/ | /app/backups/ | Backups diarios do .db |

### 1.5 Environment Variables (.env)

Arquivo: `backend/.env`

```env
# ═══════════════════════════════════════════
# BANCO DE DADOS
# ═══════════════════════════════════════════
DATABASE_URL=sqlite+aiosqlite:///./data/jobhunter.db

# ═══════════════════════════════════════════
# APLICACAO
# ═══════════════════════════════════════════
ENVIRONMENT=production
SECRET_KEY=<gerar-com-comando-abaixo>
FRONTEND_URL=https://<project-id>.web.app

# ═══════════════════════════════════════════
# ARMazenAMENTO
# ═══════════════════════════════════════════
CV_STORAGE_PATH=./storage/cv
SCREENSHOTS_PATH=./storage/screenshots

# ═══════════════════════════════════════════
# PLAYWRIGHT
# ═══════════════════════════════════════════
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_SLOW_MO=100

# ═══════════════════════════════════════════
# AGENDAMENTO
# ═══════════════════════════════════════════
SCAN_INTERVAL_HOURS=6
RECURRING_SEND_DAY=1

# ═══════════════════════════════════════════
# E-MAIL (SMTP)
# ═══════════════════════════════════════════
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<seu-email>@gmail.com
SMTP_PASSWORD=<app-password-do-gmail>
NOTIFICATION_EMAIL=<seu-email>@gmail.com
```

**Gerar SECRET_KEY:**

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

**Gerar App Password do Gmail:**

1. Acessar https://myaccount.google.com/apppasswords
2. Selecionar "Outro (nome custom)" e digitar "JobHunter"
3. Copiar a senha de 16 caracteres
4. Colar em `SMTP_PASSWORD` no `.env`

**Variaveis do Frontend (environment.prod.ts):**

```typescript
export const environment = {
  production: true,
  apiUrl: 'http://<IP_PUBLICO_VM>:8000'
};
```

---

## 2. Conexao com Banco de Dados

### 2.1 SQLite — Configuracao Atual

**Arquivo:** `/data/jobhunter.db` (dentro do container, mapeado para `./data/` no host)

**Arquivos auxiliares:**

```
/data/jobhunter.db         ← Banco principal
/data/jobhunter.db-wal     ← Write-Ahead Log
/data/jobhunter.db-shm     ← Shared memory
```

**WAL Mode (Write-Ahead Logging):**

O SQLite esta configurado em WAL mode para melhor performance de leitura simultanea com o APScheduler. WAL permite que leituras e escritas ocorram ao mesmo tempo, reduzindo contention.

```bash
# Verificar se WAL mode esta ativo
sqlite3 ./data/jobhunter.db "PRAGMA journal_mode;"
# Saida esperada: wal

# Ativar WAL mode manualmente (caso nao esteja)
sqlite3 ./data/jobhunter.db "PRAGMA journal_mode=WAL;"
```

**PRAGmas recomendados para producao:**

```bash
# Executar no shell do container ou no host
sqlite3 ./data/jobhunter.db <<EOF
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA busy_timeout=5000;
PRAGMA cache_size=-64000;
PRAGMA foreign_keys=ON;
EOF
```

| PRAGMA | Valor | Efeito |
|---|---|---|
| `journal_mode` | WAL | Escrita nao bloqueia leitura |
| `synchronous` | NORMAL | Balance entre seguranca e performance |
| `busy_timeout` | 5000 | Aguarda 5s antes de retornar "database locked" |
| `cache_size` | -64000 | 64MB de cache em memoria |
| `foreign_keys` | ON | Enforce referential integrity |

### 2.2 Backup do Banco

**Backup manual:**

```bash
# No host da VM
cp ./data/jobhunter.db ./backups/jobhunter_$(date +%Y%m%d_%H%M%S).db
```

**Backup via crontab (automatizado):**

```bash
# Editar crontab
crontab -e

# Adicionar esta linha — backup diario as 3h da manha, manter 30 dias
0 3 * * * cp /home/ubuntu/jobhunter/backend/data/jobhunter.db /home/ubuntu/jobhunter/backend/backups/jobhunter_$(date +\%Y\%m\%d).db && find /home/ubuntu/jobhunter/backend/backups/ -name "jobhunter_*.db" -mtime +30 -delete
```

**Verificar crontab ativo:**

```bash
crontab -l
```

**Backup para Oracle Cloud Object Storage (opcional, 10GB gratis):**

```bash
# Instalar OCI CLI (primeira vez)
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install.sh)"

# Configurar
oci setup config

# Upload
oci os object put \
  --bucket-name jobhunter-backups \
  --file ./backups/jobhunter_$(date +%Y%m%d).db
```

### 2.3 Restore do Banco

```bash
# 1. Parar o container
docker stop jobhunter

# 2. Backup do arquivo atual (seguranca)
cp ./data/jobhunter.db ./data/jobhunter_$(date +%Y%m%d_%H%M%S)_before_restore.db

# 3. Copiar o backup desejado
cp ./backups/jobhunter_20250601.db ./data/jobhunter.db

# 4. Limpar arquivos auxiliares
rm -f ./data/jobhunter.db-wal ./data/jobhunter.db-shm

# 5. Reiniciar
docker start jobhunter

# 6. Verificar
curl http://localhost:8000/health
```

### 2.4 Quando Migrar para PostgreSQL

Migrar quando **pelo menos uma** destas condicoes for verdadeira:

| Condicao | Detalhe |
|---|---|
| Multi-user | Segundo usuario querendo usar o sistema |
| Concurrent writes | SQLite bloqueia escrita quando alguem esta escrevendo |
| JSON queries | Necessidade de consultar campos JSON complexos |
| Full-text search | Busca textual avancada (FTS5 nao e suficiente) |
| 500MB+ de dados | Proximo do limite pratico do SQLite |

### 2.5 Migration SQLite para Supabase — Passo a Passo

**Pre-requisitos:**
- Conta no Supabase (https://supabase.com) — plano Free (500MB PostgreSQL managed)
- Alembic configurado no projeto

**Passo 1: Exportar dados do SQLite**

```bash
# Shell no container
docker exec -it jobhunter bash

# Dump do SQLite para SQL
sqlite3 /app/data/jobhunter.db .dump > /app/backups/dump.sql

# Verificar tamanho do dump
ls -lh /app/backups/dump.sql

# Copiar dump para o host
docker cp jobhunter:/app/backups/dump.sql ./dump.sql
```

**Passo 2: Criar projeto no Supabase**

1. Acessar https://supabase.com e criar conta
2. Criar novo projeto: nome = "jobhunter", senha do DB = anotar em local seguro
3. No painel, ir em **Settings > Database** e anotar:
   - Host: `db.<project-ref>.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: (a definir)

**Passo 3: Preparar o dump para PostgreSQL**

```bash
# Limpar o dump do SQLite (remover comandos SQLite-specific)
# O dump do SQLite tem comandos que PostgreSQL nao entende.
# Opcao mais simples: usar Alembic para criar as tabelas no PostgreSQL
# e depois importar apenas os dados.

# Verificar tabelas que existem no SQLite
sqlite3 ./data/jobhunter.db ".tables"
# Saida: applications  fixed_companies  jobs  profiles
```

**Passo 4: Configurar Alembic para PostgreSQL**

```bash
# No diretorio do backend
cd backend

# Instalar driver asyncpg (PostgreSQL async)
uv add asyncpg
```

Atualizar `alembic.ini`:

```ini
# alembic.ini
[alembic]
script_location = alembic
sqlalchemy.url = postgresql+asyncpg://postgres:<SENHA>@db.<project-ref>.supabase.co:5432/postgres
```

Ou, melhor ainda, usar a env var (ja esta no `alembic/env.py`):

```python
# alembic/env.py — deve usar a DATABASE_URL do .env
import os
from alembic import context
from app.core.config import settings

target_metadata = Base.metadata

def run_migrations_online():
    connectable = create_async_engine(settings.database_url)
    # ...
```

**Passo 5: Gerar e rodar migration**

```bash
# Gerar migration do schema atual
docker exec jobhunter uv run alembic revision --autogenerate -m "migrate to postgresql"

# Rodar migration no Supabase
docker exec jobhunter uv run alembic upgrade head
```

**Passo 6: Importar dados**

```bash
# Converter dump SQLite para formato compativel com PostgreSQL
# Usar o tool sqlite-to-postgres (ou copiar tabela por tabela)

# Opcao manual — inserir dados via Python
python3 << 'PYEOF'
import sqlite3
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def migrate():
    # Ler do SQLite
    sqlite_conn = sqlite3.connect('./data/jobhunter.db')
    sqlite_cursor = sqlite_conn.cursor()

    # Escrever no PostgreSQL
    pg_engine = create_async_engine(
        'postgresql+asyncpg://postgres:<SENHA>@db.<ref>.supabase.co:5432/postgres'
    )

    tables = ['profiles', 'jobs', 'applications', 'fixed_companies']

    async with pg_engine.begin() as conn:
        for table in tables:
            sqlite_cursor.execute(f'SELECT * FROM {table}')
            rows = sqlite_cursor.fetchall()
            cols = [desc[0] for desc in sqlite_cursor.description]
            print(f'Migrando {len(rows)} registros de {table}...')

            for row in rows:
                values = dict(zip(cols, row))
                placeholders = ', '.join([f':{c}' for c in cols])
                columns = ', '.join(cols)
                await conn.execute(
                    text(f'INSERT INTO {table} ({columns}) VALUES ({placeholders})'),
                    values
                )

    sqlite_conn.close()
    await pg_engine.dispose()
    print('Migracao concluida!')

asyncio.run(migrate())
PYEOF
```

**Passo 7: Atualizar .env**

```env
# Trocar de:
DATABASE_URL=sqlite+aiosqlite:///./data/jobhunter.db

# Para:
DATABASE_URL=postgresql+asyncpg://postgres:<SENHA>@db.<project-ref>.supabase.co:5432/postgres
```

**Passo 8: Rebuild do container**

```bash
docker compose down
docker compose up -d --build
docker exec jobhunter uv run alembic upgrade head
curl http://localhost:8000/health
```

### 2.6 Alembic — Configuracao

**Instalar (ja vem no projeto):**

```bash
uv add alembic asyncpg  # asyncpg necessario para PostgreSQL futuro
```

**Estrutura:**

```
backend/
├── alembic.ini          # Configuracao do Alembic
├── alembic/
│   ├── env.py           # Conexao com o banco (usa DATABASE_URL do .env)
│   ├── script.py.mako   # Template para migrations
│   └── versions/        # Arquivos de migration
│       └── 001_initial.py
```

**Comandos Alembic:**

```bash
# Criar nova migration apos alterar models
docker exec jobhunter uv run alembic revision --autogenerate -m "descricao_da_mudanca"

# Rodar todas as migrations pendentes
docker exec jobhunter uv run alembic upgrade head

# Voltar 1 migration (rollback)
docker exec jobhunter uv run alembic downgrade -1

# Verificar versao atual
docker exec jobhunter uv run alembic current

# Ver historico
docker exec jobhunter uv run alembic history
```

---

## 3. Deploy e CI/CD

### 3.1 GitHub Actions — Workflow Completo

Arquivo: `.github/workflows/deploy.yml`

```yaml
name: Deploy JobHunter

on:
  push:
    branches: [main]

jobs:
  # ═══════════════════════════════════════
  # ETAPA 1: Testes
  # ═══════════════════════════════════════
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.14'

      - name: Instalar uv e dependencias
        run: |
          cd backend
          pip install uv
          uv sync

      - name: Rodar testes
        run: |
          cd backend
          uv run pytest -v --tb=short

  # ═══════════════════════════════════════
  # ETAPA 2: Deploy Frontend (Firebase)
  # ═══════════════════════════════════════
  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Build Angular
        run: |
          cd frontend
          npm ci
          ng build --configuration production

      - name: Deploy Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SA }}'
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT }}

  # ═══════════════════════════════════════
  # ETAPA 3: Deploy Backend (Oracle VM)
  # ═══════════════════════════════════════
  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH + Docker
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VM_IP }}
          username: ubuntu
          key: '${{ secrets.SSH_PRIVATE_KEY }}'
          script: |
            cd ~/jobhunter/backend
            git pull origin main
            docker compose up -d --build
            docker exec jobhunter uv run alembic upgrade head
            sleep 5
            curl -f http://localhost:8000/health || exit 1
```

### 3.2 Secrets Necessarios no GitHub

| Secret | Descricao | Como obter |
|---|---|---|
| `VM_IP` | IP publico da VM Oracle Cloud | Painel Oracle Cloud > Instances |
| `SSH_PRIVATE_KEY` | Chave SSH privada | Conteudo de `~/.ssh/id_ed25519` |
| `FIREBASE_SA` | Service Account do Firebase | Firebase Console > Project Settings > Service Accounts |
| `FIREBASE_PROJECT` | ID do projeto Firebase | Firebase Console > Project Settings |

### 3.3 Deploy Frontend (Firebase)

**Setup inicial (uma vez):**

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar no diretorio do frontend
cd frontend
firebase init hosting
# Public directory: dist/jobhunter/browser
# Single-page app: Yes
```

**Build e deploy manual:**

```bash
# Build
ng build --configuration production

# Deploy
firebase deploy --only hosting
```

**firebase.json:**

```json
{
  "hosting": {
    "public": "dist/jobhunter/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      }
    ]
  }
}
```

### 3.4 Deploy Backend (SSH + Docker)

**Deploy manual via SSH:**

```bash
# Conectar
ssh ubuntu@<VM_IP>

# Entrar no diretorio
cd ~/jobhunter/backend

# Atualizar codigo
git pull origin main

# Rebuild e reiniciar
docker compose up -d --build

# Rodar migrations
docker exec jobhunter uv run alembic upgrade head

# Verificar
curl http://localhost:8000/health
```

**Deploy via um unico comando (sem SSH interativo):**

```bash
ssh ubuntu@<VM_IP> "cd ~/jobhunter/backend && git pull origin main && docker compose up -d --build && sleep 5 && curl -f http://localhost:8000/health"
```

### 3.5 Rollback

**Rollback do codigo (reverter ultimo commit):**

```bash
ssh ubuntu@<VM_IP>

cd ~/jobhunter/backend

# Ver historico
git log --oneline

# Reverter ultimo commit
git revert HEAD

# Rebuild
docker compose up -d --build

# Se a migration tambem precisa ser revertida
docker exec jobhunter uv run alembic downgrade -1
```

**Rollback do banco (restaurar backup):**

```bash
# Parar container
docker stop jobhunter

# Restaurar backup
cp ./backups/jobhunter_20250601.db ./data/jobhunter.db
rm -f ./data/jobhunter.db-wal ./data/jobhunter.db-shm

# Reiniciar
docker start jobhunter
```

### 3.6 Health Checks

**Endpoint:**

```bash
curl http://localhost:8000/health
# Resposta: {"status": "ok"}
```

**Health check do Docker (no docker-compose.yml):**

```yaml
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

**Status do container:**

```bash
# Verificar se esta healthy
docker inspect jobhunter --format='{{.State.Health.Status}}'
# Saida: healthy | unhealthy | starting

# Ver historico de health checks
docker inspect jobhunter --format='{{json .State.Health}}' | python3 -m json.tool
```

---

## 4. Seguranca

### 4.1 SSL/TLS com Nginx

**Instalar Nginx na VM:**

```bash
sudo apt update && sudo apt install -y nginx
```

**Configurar Nginx reverse proxy:**

```nginx
# /etc/nginx/sites-available/jobhunter

server {
    listen 443 ssl;
    server_name api.seudominio.com;

    ssl_certificate /etc/letsencrypt/live/api.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.seudominio.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Upload limit para CVs
        client_max_body_size 10M;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
        proxy_send_timeout 60s;
    }
}

server {
    listen 80;
    server_name api.seudominio.com;
    return 301 https://$server_name$request_uri;
}
```

**Ativar o site:**

```bash
sudo ln -s /etc/nginx/sites-available/jobhunter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4.2 Certbot — Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d api.seudominio.com

# Testar renovacao automatica
sudo certbot renew --dry-run

# Verificar timer
sudo systemctl status certbot.timer
```

O Certbot configura renovacao automatica via cron. O certificado expira a cada 90 dias e e renovado automaticamente.

### 4.3 UFW Firewall

```bash
# Instalar UFW
sudo apt install -y ufw

# Regras
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP (redirect para HTTPS)
sudo ufw allow 443/tcp    # HTTPS

# Ativar
sudo ufw enable

# Ver status
sudo ufw status verbose
```

> **Nota:** Nao abra a porta 8000 no UFW quando Nginx estiver ativo. O Nginx faz proxy para 127.0.0.1:8000 internamente.

### 4.4 Fail2ban

```bash
# Instalar
sudo apt install -y fail2ban

# Criar configuracao local
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = ssh
filter  = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

# Ativar
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Verificar status
sudo fail2ban-client status sshd
```

### 4.5 SSH — Chave Publica Apenas

**Desabilitar login por senha:**

```bash
# Editar configuracao do SSH
sudo nano /etc/ssh/sshd_config

# Alterar/adicionar:
PasswordAuthentication no
PermitRootLogin prohibit-password
PubkeyAuthentication yes

# Reiniciar SSH
sudo systemctl restart sshd
```

**Adicionar chave publica (se ainda nao tiver):**

```bash
# No seu computador local
ssh-copy-id ubuntu@<VM_IP>

# Ou manualmente
cat ~/.ssh/id_ed25519.pub | ssh ubuntu@<VM_IP> "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 4.6 CORS

Configurado no `main.py` do FastAPI:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],  # Apenas o frontend autorizado
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Em producao, `FRONTEND_URL` deve ser:**

```env
FRONTEND_URL=https://<project-id>.web.app
```

### 4.7 Rate Limiting

**Opcao 1 — Via Nginx (recomendado):**

```nginx
# Dentro do bloco server do Nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

location / {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://127.0.0.1:8000;
    # ... resto da configuracao
}
```

**Opcao 2 — Via FastAPI middleware:**

```python
# Adicionar ao main.py (se necessario)
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/health")
@limiter.limit("100/minute")
async def health():
    return {"status": "ok"}
```

---

## 5. Monitoramento e Logs

### 5.1 Docker Log Rotation

Configurado no `docker-compose.yml`:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"   # Maximo 10MB por arquivo de log
    max-file: "3"     # Maximo 3 arquivos (total: 30MB)
```

**Verificar tamanho dos logs:**

```bash
# Tamanho total
docker inspect jobhunter --format='{{.LogPath}}' | xargs ls -lh

# Ou diretamente
ls -lh /var/lib/docker/containers/<container-id>-json.log
```

**Limpar logs manualmente:**

```bash
# Truncar logs (sem parar o container)
truncate -s 0 $(docker inspect jobhunter --format='{{.LogPath}}')
```

### 5.2 Comandos de Logs

```bash
# Logs em tempo real (ultimas 100 linhas)
docker logs jobhunter --tail 100 -f

# Logs das ultimas 24 horas
docker logs jobhunter --since 24h

# Logs com filtro de erro
docker logs jobhunter 2>&1 | grep -i ERROR

# Logs com timestamp
docker logs jobhunter -t --tail 50

# Salvar logs em arquivo
docker logs jobhunter --since 24h > /tmp/jobhunter_logs_$(date +%Y%m%d).txt 2>&1
```

### 5.3 Endpoint /health

**Verificacao basica:**

```bash
curl -s http://localhost:8000/health | python3 -m json.tool
# Resposta: {"status": "ok"}
```

**Verificacao completa (sugestao de evolucao):**

```bash
# Health detalhado (quando implementado)
curl -s http://localhost:8000/api/v1/scheduler/status | python3 -m json.tool
```

### 5.4 Uptime Monitoring

**UptimeRobot (gratuito, 50 monitors):**

1. Criar conta em https://uptimerobot.com
2. Adicionar monitor:
   - Type: HTTP(s)
   - URL: `http://<VM_IP>:8000/health`
   - Interval: 5 minutos
   - Alertas: e-mail quando cair

**Alternative — cron local de verificacao:**

```bash
# Verificar se o container esta rodando a cada 5 minutos
# Crontab:
*/5 * * * * docker inspect jobhunter --format='{{.State.Running}}' | grep -q true || docker start jobhunter && echo "JobHunter restarted at $(date)" >> /var/log/jobhunter-watchdog.log
```

### 5.5 Scripts de Monitoramento

**Verificacao de disco:**

```bash
#!/bin/bash
# /home/ubuntu/scripts/check_disk.sh

THRESHOLD=80
USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "ALERTA: Disco ${USAGE}% usado em $(date)" >> /var/log/jobhunter-monitor.log
    # Enviar e-mail (opcional)
    # echo "Disco JobHunter em ${USAGE}%" | mail -s "Alerta Disco" seu@email.com
fi
```

**Verificacao de memoria:**

```bash
#!/bin/bash
# /home/ubuntu/scripts/check_memory.sh

USAGE=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')

if [ "$USAGE" -gt 90 ]; then
    echo "ALERTA: Memoria ${USAGE}% em $(date)" >> /var/log/jobhunter-monitor.log
fi
```

**Tamanho do banco de dados:**

```bash
#!/bin/bash
# /home/ubuntu/scripts/check_db_size.sh

DB_SIZE=$(ls -lh /home/ubuntu/jobhunter/backend/data/jobhunter.db | awk '{print $5}')
echo "Tamanho do banco: $DB_SIZE em $(date)" >> /var/log/jobhunter-monitor.log
```

**Agendar os scripts (crontab):**

```bash
crontab -e

# Adicionar:
*/5 * * * * /home/ubuntu/scripts/check_disk.sh
*/5 * * * * /home/ubuntu/scripts/check_memory.sh
0 * * * * /home/ubuntu/scripts/check_db_size.sh
```

### 5.6 Alertas

| Evento | Acao |
|---|---|
| Container parou | watchdog reinicia automaticamente |
| Disco > 80% | Log + alerta |
| Memoria > 90% | Log + alerta |
| Health check falha 3x seguidas | UptimeRobot envia e-mail |
| Backup falhou | Verificar crontab e logs |

---

## 6. Manutencao

### 6.1 Security Updates

```bash
# Atualizar pacotes do sistema (semana)
sudo apt update && sudo apt upgrade -y

# Atualizar apenas pacotes de seguranca
sudo unattended-upgrades --dry-run
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 6.2 Renovacao SSL

O Certbot configura renovacao automatica. Para verificar:

```bash
# Ver proxima renovacao
sudo certbot certificates

# Testar renovacao
sudo certbot renew --dry-run

# Renovacao manual (se necessario)
sudo certbot renew
```

### 6.3 Limpeza de Logs

```bash
# Limpar logs do Docker (sao rotacionados, mas pode limpar manualmente)
truncate -s 0 $(docker inspect jobhunter --format='{{.LogPath}}')

# Limpar logs do sistema
sudo journalctl --vacuum-time=7d

# Limpar apt cache
sudo apt autoremove -y
sudo apt clean
```

### 6.4 SQLite VACUUM

```bash
# Executar mensalmente para otimizar espaco
docker exec jobhunter uv run python3 -c "
import sqlite3
conn = sqlite3.connect('/app/data/jobhunter.db')
conn.execute('VACUUM')
conn.close()
print('VACUUM concluido')
"

# Ou via shell
docker exec jobhunter sqlite3 /app/data/jobhunter.db "VACUUM;"
```

> **Importante:** VACUUM precisa de espaco livre em disco igual ao tamanho do banco. Verifique antes.

### 6.5 Integrity Check

```bash
# Verificar integridade do banco
docker exec jobhunter sqlite3 /app/data/jobhunter.db "PRAGMA integrity_check;"
# Saida esperada: ok

# Se retornar erro, restaurar do backup:
# (ver secao 2.3 Restore do Banco)
```

### 6.6 Limpeza de Screenshots Antigos

```bash
# Remover screenshots com mais de 90 dias
find /home/ubuntu/jobhunter/backend/storage/screenshots/ -name "*.png" -mtime +90 -delete

# Ou via crontab (mensal)
0 4 1 * * find /home/ubuntu/jobhunter/backend/storage/screenshots/ -name "*.png" -mtime +90 -delete
```

### 6.7 Checklist de Manutencao Mensal

| Tarefa | Comando | Frequencia |
|---|---|---|
| Security updates | `sudo apt update && sudo apt upgrade` | Semanal |
| Renovar SSL | `sudo certbot renew` | Automatico (90 dias) |
| VACUUM SQLite | `sqlite3 ... "VACUUM;"` | Mensal |
| Integrity check | `sqlite3 ... "PRAGMA integrity_check;"` | Mensal |
| Verificar backups | `ls -lh ./backups/` | Semanal |
| Limpar screenshots antigos | `find ... -mtime +90 -delete` | Mensal |
| Verificar espaco em disco | `df -h` | Semanal |
| Verificar logs do container | `docker logs --since 24h` | Diario |

---

## 7. Comandos Uteis (Cheat Sheet)

### SSH e Acesso

```bash
# Conectar na VM
ssh ubuntu@<VM_IP>

# Conectar com chave especifica
ssh -i ~/.ssh/minha_chave ubuntu@<VM_IP>

# Executar comando remoto sem entrar
ssh ubuntu@<VM_IP> "docker ps"
```

### Docker

```bash
# Status dos containers
docker ps

# Build e iniciar (rebuild completo)
docker compose up -d --build

# Parar e remover containers
docker compose down

# Reiniciar o container
docker restart jobhunter

# Logs em tempo real
docker logs jobhunter --tail 100 -f

# Shell dentro do container
docker exec -it jobhunter bash

# Verificar uso de recursos
docker stats jobhunter --no-stream

# Verificar health
docker inspect jobhunter --format='{{.State.Health.Status}}'
```

### Banco de Dados

```bash
# Shell do SQLite
docker exec -it jobhunter sqlite3 /app/data/jobhunter.db

# Dentro do SQLite:
.tables                    # Listar tabelas
.schema jobs               # Ver estrutura da tabela
SELECT COUNT(*) FROM jobs; # Contar registros
.quit                      # Sair

# Backup
cp ./data/jobhunter.db ./backups/jobhunter_$(date +%Y%m%d).db

# Restore
docker stop jobhunter
cp ./backups/jobhunter_20250601.db ./data/jobhunter.db
rm -f ./data/jobhunter.db-wal ./data/jobhunter.db-shm
docker start jobhunter
```

### Alembic

```bash
# Gerar migration
docker exec jobhunter uv run alembic revision --autogenerate -m "descricao"

# Rodar migrations
docker exec jobhunter uv run alembic upgrade head

# Rollback 1 migration
docker exec jobhunter uv run alembic downgrade -1

# Versao atual
docker exec jobhunter uv run alembic current
```

### Monitoramento

```bash
# Health check
curl -s http://localhost:8000/health

# Uso de disco
df -h

# Uso de memoria
free -h

# Tamanho do banco
ls -lh ./data/jobhunter.db

# Tamanho dos logs
docker inspect jobhunter --format='{{.LogPath}}' | xargs ls -lh

# Processos do container
docker exec jobhunter ps aux
```

### Deploy

```bash
# Deploy completo do backend (via SSH)
cd ~/jobhunter/backend && git pull origin main && docker compose up -d --build

# Deploy do frontend
cd frontend && ng build --configuration production && firebase deploy --only hosting

# Verificar deploy
curl -s http://localhost:8000/health | python3 -m json.tool
```

### Debug

```bash
# Verificar se o container esta rodando
docker ps | grep jobhunter

# Verificar portas
ss -tlnp | grep 8000

# Testar conexao do banco
docker exec jobhunter python3 -c "import sqlite3; print(sqlite3.connect('/app/data/jobhunter.db').execute('SELECT 1').fetchone())"

# Verificar variaveis de ambiente do container
docker exec jobhunter env | grep DATABASE

# Verificar espaco em disco
du -sh ~/jobhunter/backend/data/
du -sh ~/jobhunter/backend/storage/
du -sh ~/jobhunter/backend/backups/
```

---

## 8. Troubleshooting

### 8.1 Container Nao Inicia

**Sintomas:** `docker ps` nao mostra o container, ou status `Restarting`.

**Diagnostico:**

```bash
# Ver logs de erro
docker logs jobhunter --tail 50

# Verificar se a imagem foi buildada
docker images | grep jobhunter

# Verificar se o .env existe
ls -la ~/jobhunter/backend/.env
```

**Solucoes comuns:**

```bash
# 1. Rebuild completo
docker compose down
docker compose up -d --build

# 2. Verificar se o .env esta correto
cat ~/jobhunter/backend/.env

# 3. Verificar se as portas estao livres
ss -tlnp | grep 8000
# Se algo estiver usando a porta 8000:
sudo lsof -i :8000 | grep LISTEN
sudo kill -9 <PID>

# 4. Verificar permissoes dos volumes
ls -la ~/jobhunter/backend/data/
chmod -R 755 ~/jobhunter/backend/data/
```

### 8.2 Disco Cheio

**Sintomas:** Container nao inicia, erros de escrita, health check falha.

**Diagnostico:**

```bash
# Verificar espaco
df -h

# Ver o que esta consumindo espaco
du -sh ~/jobhunter/backend/* | sort -rh | head -10

# Tamanho dos logs Docker
docker system df
```

**Solucoes:**

```bash
# 1. Limpar logs do Docker
docker system prune -f
truncate -s 0 $(docker inspect jobhunter --format='{{.LogPath}}')

# 2. Limpar backups antigos (manter so os ultimos 15)
ls -t ~/jobhunter/backend/backups/jobhunter_*.db | tail -n +16 | xargs rm -f

# 3. Limpar screenshots antigos
find ~/jobhunter/backend/storage/screenshots/ -name "*.png" -mtime +60 -delete

# 4. VACUUM no SQLite (libera espaco)
docker exec jobhunter sqlite3 /app/data/jobhunter.db "VACUUM;"
```

### 8.3 SQLite Database Locked

**Sintomas:** Erros `database is locked` nos logs.

**Causa:** Mais de uma thread tentando escrever simultaneamente (raro em single-user, mas pode acontecer com APScheduler + request simultaneo).

**Solucoes:**

```bash
# 1. Verificar WAL mode
docker exec jobhunter sqlite3 /app/data/jobhunter.db "PRAGMA journal_mode;"
# Se nao for "wal", ativar:
docker exec jobhunter sqlite3 /app/data/jobhunter.db "PRAGMA journal_mode=WAL;"

# 2. Aumentar busy_timeout (no codigo Python ou via PRAGMA)
docker exec jobhunter sqlite3 /app/data/jobhunter.db "PRAGMA busy_timeout=10000;"

# 3. Verificar se ha processos zombie
docker exec jobhunter ps aux | grep sqlite
```

### 8.4 Out of Memory (OOM)

**Sintomas:** Container morre subitamente, `docker inspect` mostra `OOMKilled: true`.

**Diagnostico:**

```bash
# Verificar se foi OOM
docker inspect jobhunter --format='{{.State.OOMKilled}}'

# Verificar uso de memoria
docker stats jobhunter --no-stream

# No host
free -h
```

**Solucoes:**

```bash
# 1. Limitar memoria do container (no docker-compose.yml)
services:
  backend:
    mem_reservation: 500m   # garantia soft (kernel evita evict)
    mem_limit: 700m         # hard cap (kernel OOM-killa limpo, restart: unless-stopped volta)
    memswap_limit: 1g       # cap total RAM+swap
    pids_limit: 200

# 2. Reduzir Playwright footprint (em prod)
# No .env:
PLAYWRIGHT_SLOW_MO=0       # sem pausa artificial entre acoes (em dev: 100)

# 3. SWAP 2 GB no host (Oracle VM padrao vem sem swap)
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
cat | sudo tee /etc/sysctl.d/99-jobhunter-tuning.conf <<EOF
vm.swappiness=10
vm.overcommit_memory=1
vm.vfs_cache_pressure=50
EOF
sudo sysctl --system

# 4. Reiniciar preventivamente (em vez de esperar o OOM):
0 */6 * * * docker restart jobhunter
```

### 8.5 SSL Expirado

**Sintomas:** Navegador mostra aviso de conexao insegura.

**Solucoes:**

```bash
# Verificar certificado
sudo certbot certificates

# Renovar
sudo certbot renew

# Se nao renovar automaticamente:
sudo certbot --nginx -d api.seudominio.com --force-renewal

# Verificar se o timer do Certbot esta ativo
sudo systemctl status certbot.timer
```

### 8.6 Playwright Crash

**Sintomas:** Erros `playwright._impl._errors.Error` nos logs, candidaturas falham em sequencia.

**Causas comuns:** Memoria insuficiente, Chromium crash, dependencias do sistema faltando.

**Solucoes:**

```bash
# 1. Verificar se Chromium esta instalado
docker exec jobhunter playwright install --with-deps chromium

# 2. Verificar dependencias do sistema
docker exec jobhunter apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2

# 3. Reiniciar container (limpa estado do Chromium)
docker restart jobhunter

# 4. Verificar espaco em disco (Chromium precisa de espaco temporario)
docker exec jobhunter df -h /tmp

# 5. Se Playwright continua crashando, desativar headless para debug
# No .env:
PLAYWRIGHT_HEADLESS=false
# (so para debug — NAO manter em producao)
```

### 8.7 Frontend Nao Conecta ao Backend

**Sintomas:** Frontend mostra erro de conexao, requests retornam CORS error ou timeout.

**Diagnostico:**

```bash
# Verificar se o backend esta rodando
curl -s http://<VM_IP>:8000/health

# Verificar CORS (no browser: aba Network > erro CORS)
# O erro aparece como "Access-Control-Allow-Origin" header ausente

# Verificar se a porta 8000 esta aberta no Oracle Cloud Security List
```

**Solucoes:**

```bash
# 1. Verificar FRONTEND_URL no .env do backend
docker exec jobhunter env | grep FRONTEND_URL
# Deve ser: https://<project-id>.web.app

# 2. Se usando Nginx, verificar se esta proxyando corretamente
curl -v http://localhost:80/health

# 3. Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 8.8 Backup Falhou

**Diagnostico:**

```bash
# Verificar se o crontab esta configurado
crontab -l

# Verificar se o backup foi criado
ls -lt ~/jobhunter/backend/backups/ | head -5

# Testar o comando manualmente
cp ~/jobhunter/backend/data/jobhunter.db ~/jobhunter/backend/backups/test_$(date +%Y%m%d).db
```

**Solucoes:**

```bash
# 1. Corrigir permissoes
chmod -R 755 ~/jobhunter/backend/backups/

# 2. Verificar espaco em disco
df -h

# 3. Reconfigurar crontab
crontab -e
# Copiar a linha correta do backup
```

---

## Referencias

| Recurso | Link |
|---|---|
| Firebase Hosting | https://firebase.google.com/docs/hosting |
| Oracle Cloud Free | https://cloud.oracle.com/free |
| Docker Docs | https://docs.docker.com |
| Docker Compose | https://docs.docker.com/compose |
| Let's Encrypt | https://letsencrypt.org |
| Certbot | https://certbot.eff.org |
| SQLite WAL Mode | https://www.sqlite.org/wal.html |
| GitHub Actions | https://docs.github.com/actions |
| UFW Firewall | https://wiki.ubuntu.com/UncomplicatedFirewall |
| Fail2ban | https://github.com/fail2ban/fail2ban |
| Supabase | https://supabase.com |
