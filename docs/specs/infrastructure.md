# Specs — Infraestrutura e Deploy

## 1. Visão Geral da Infraestrutura

```
┌──────────────────┐     HTTPS      ┌──────────────────────────────┐
│     Firebase     │ ◄────────────► │     Oracle Cloud VM ARM      │
│     Hosting      │                │     (Ampere A1 Always Free)   │
│                  │                │                              │
│  Angular SPA     │   REST/JSON    │  Docker Container            │
│  (estático)      │ ◄────────────► │  ├── FastAPI (:8000)         │
│                  │                │  ├── APScheduler             │
│  jobhunter       │                │  └── Playwright              │
│  .web.app        │                │                              │
└──────────────────┘                │  Storage (volumes Docker):   │
                                    │  ├── ./data/jobhunter.db     │
                                    │  ├── ./storage/cv/           │
                                    │  └── ./storage/screenshots/  │
                                    │                              │
                                    │  Custo: $0/mês               │
                                    └──────────────────────────────┘
```

**Decisão de infraestrutura:**
- **Frontend:** Firebase Hosting (Spark plan gratuito, CDN global, HTTPS)
- **Backend:** Oracle Cloud Always Free VM ARM (nunca expira, Docker)
- **Banco:** SQLite local na VM (200GB SSD disponíveis)
- **Custo mensal:** $0

---

## 2. Firebase Hosting (Frontend)

### Setup do Projeto

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar hosting no diretório do frontend
cd frontend
firebase init hosting
# Selecionar projeto existente ou criar novo
# Public directory: dist/jobhunter/browser
# Single-page app: Yes
# GitHub auto-deploy: No (CI/CD cuida disso)
```

### Build e Deploy

```bash
# Build de produção
ng build --configuration production

# Deploy
firebase deploy --only hosting

# URL resultante
# https://<project-id>.web.app
```

### Configuração do firebase.json

```json
{
  "hosting": {
    "public": "dist/jobhunter/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

### Plano Spark (Gratuito)

| Recurso | Limite |
|---|---|
| Transferência | 10GB/mês |
| Storage | 10GB |
| Domínio customizado | Sim |
| SSL/HTTPS | Automático |
| CDN global | Sim |

### Environment do Frontend

```typescript
// frontend/src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'http://<IP_PUBLICO_VM>:8000'
};
```

---

## 3. Oracle Cloud Always Free VM ARM (Backend)

### Criar Conta

1. Acessar https://cloud.oracle.com
2. Criar conta (precisa cartão de crédito — **não cobra** para Always Free)
3. Selecionar região (recomendado: `sa-saopaulo-1` para menor latência)

### Criar a VM

1. Console → **Compute → Instances → Create Instance**
2. Configurar:

| Configuração | Valor | Limite Always Free |
|---|---|---|
| Image | Ubuntu 22.04 (aarch64) | — |
| Shape | VM.Standard.A1.Flex | — |
| OCPU | 2 | 4 |
| RAM (GB) | 8 | 24 |
| Boot volume (GB) | 50 | 200 |
| SSH key | Gerar ou colar pública | — |

3. Anotar o **IP público** após criação

### Configurar Rede

1. **Networking → Virtual Cloud Networks → VNC da instância**
2. **Security Lists → Default Security List → Add Ingress Rules:**

| Rule | Source CIDR | Protocol | Port | Descrição |
|---|---|---|---|---|
| SSH | 0.0.0.0/0 | TCP | 22 | Acesso SSH |
| API | 0.0.0.0/0 | TCP | 8000 | FastAPI |
| HTTPS (opcional) | 0.0.0.0/0 | TCP | 443 | Nginx reverse proxy |

### Instalar Docker

```bash
# Conectar via SSH
ssh ubuntu@<IP_PUBLICO>

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker ubuntu

# Fazer logout e login novamente para aplicar

# Verificar instalação
docker --version
docker run hello-world
```

---

## 4. Docker Configuration

### Dockerfile

```dockerfile
FROM python:3.14-slim

# Instalar dependências do Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Instalar Playwright browsers
RUN pip install playwright && playwright install --with-deps chromium

# Instalar uv
RUN pip install uv

WORKDIR /app

# Copiar dependências primeiro (cache de layers)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copiar código
COPY . .

# Criar diretórios de storage
RUN mkdir -p /app/data /app/storage/cv /app/storage/screenshots /app/backups

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml

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

### Comandos Docker Úteis

```bash
# Build e iniciar
docker compose up -d --build

# Ver logs
docker logs jobhunter --tail 100 -f

# Reiniciar
docker restart jobhunter

# Parar
docker compose down

# Shell dentro do container
docker exec -it jobhunter bash

# Rodar migrations
docker exec jobhunter uv run alembic upgrade head

# Status
docker ps
docker stats jobhunter
```

---

## 5. SQLite Database na VM

### Localização

```
./data/jobhunter.db       ← Banco principal
./data/jobhunter.db-wal   ← Write-Ahead Log (melhor performance)
./data/jobhunter.db-shm   ← Shared memory (WAL auxiliar)
```

### Estratégia de Backup

**Backup manual:**
```bash
cp ./data/jobhunter.db ./backups/jobhunter_$(date +%Y%m%d).db
```

**Backup automático via crontab:**
```bash
crontab -e

# Adicionar: backup diário às 3h da manhã, manter 30 dias
0 3 * * * cp /home/ubuntu/jobhunter/backend/data/jobhunter.db /home/ubuntu/jobhunter/backend/backups/jobhunter_$(date +\%Y\%m\%d).db && find /home/ubuntu/jobhunter/backend/backups/ -name "jobhunter_*.db" -mtime +30 -delete
```

**Backup para storage externo (opcional):**
```bash
# Sync backups para Oracle Cloud Object Storage (10GB grátis)
oci os object put --bucket-name jobhunter-backups --file ./backups/jobhunter_$(date +%Y%m%d).db
```

### Manutenção

```bash
# VACUUM mensal (reclama espaço, otimiza índice)
sqlite3 ./data/jobhunter.db "VACUUM;"

# Verificar integridade
sqlite3 ./data/jobhunter.db "PRAGMA integrity_check;"

# Ver tamanho do banco
ls -lh ./data/jobhunter.db
```

---

## 6. Storage Structure

```
./data/
├── jobhunter.db              ← SQLite database
├── jobhunter.db-wal          ← Write-Ahead Log
└── jobhunter.db-shm          ← Shared memory

./storage/
├── cv/
│   ├── curriculo.pdf         ← Currículo atual (single-user)
│   └── {user_id}/            ← Phase 2: multi-user
│       └── curriculo.pdf
└── screenshots/
    ├── gupy_success_20250115_140000.png
    ├── gupy_fail_20250115_150000.png
    ├── linkedin_scan_20250115_100000.png
    └── generic_success_20250115_160000.png

./backups/
├── jobhunter_20250115.db
├── jobhunter_20250116.db
├── jobhunter_20250117.db
└── ... (manter 30 dias)
```

### Convenções de Nomenclatura

| Tipo | Padrão | Exemplo |
|---|---|---|
| Screenshots sucesso | `{platform}_success_{YYYYMMDD}_{HHMMSS}.png` | `gupy_success_20250115_140000.png` |
| Screenshots falha | `{platform}_fail_{YYYYMMDD}_{HHMMSS}.png` | `generic_fail_20250115_150000.png` |
| Screenshots scan | `{platform}_scan_{YYYYMMDD}_{HHMMSS}.png` | `linkedin_scan_20250115_100000.png` |
| Currículo | `curriculo.pdf` (single-user) | `curriculo.pdf` |
| Backup | `jobhunter_{YYYYMMDD}.db` | `jobhunter_20250115.db` |

---

## 7. Environment Variables (.env)

```env
# ─── Database ─────────────────────────────────
DATABASE_URL=sqlite+aiosqlite:///./data/jobhunter.db

# ─── App ──────────────────────────────────────
ENVIRONMENT=production
SECRET_KEY=<gerar-chave-aleatoria-64-caracteres>
FRONTEND_URL=https://<project-id>.web.app

# ─── Scraping ─────────────────────────────────
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_SLOW_MO=100

# ─── Scheduling ───────────────────────────────
SCAN_INTERVAL_HOURS=6
RECURRING_SEND_DAY=1

# ─── Email (SMTP) ────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<seu-email>@gmail.com
SMTP_PASSWORD=<app-password-do-gmail>
NOTIFICATION_EMAIL=<seu-email>@gmail.com

# ─── Storage ──────────────────────────────────
CV_STORAGE_PATH=./storage/cv
SCREENSHOTS_PATH=./storage/screenshots
```

### Como Gerar SECRET_KEY

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Como Gerar App Password do Gmail

1. Acessar https://myaccount.google.com/apppasswords
2. Selecionar app: "Outro (nome custom)" → "JobHunter"
3. Copiar a senha de 16 caracteres gerada
4. Colar em SMTP_PASSWORD no .env

---

## 8. Networking e Segurança

### Firewall (Oracle Cloud Security List)

```
Ingress Rules:
┌──────────┬──────────────┬──────────┬───────────────────────┐
│ Protocol │ Source CIDR  │ Port     │ Descrição             │
├──────────┼──────────────┼──────────┼───────────────────────┤
│ TCP      │ 0.0.0.0/0    │ 22       │ SSH                   │
│ TCP      │ 0.0.0.0/0    │ 8000     │ FastAPI               │
│ TCP      │ 0.0.0.0/0    │ 443      │ HTTPS (Nginx, opcional)│
│ ICMP     │ 0.0.0.0/0    │ —        │ Ping (diagnóstico)    │
└──────────┴──────────────┴──────────┴───────────────────────┘

Egress Rules:
┌──────────┬──────────────┬──────────┬───────────────────────┐
│ Protocol │ Dest CIDR    │ Port     │ Descrição             │
├──────────┼──────────────┼──────────┼───────────────────────┤
│ TCP      │ 0.0.0.0/0    │ 80       │ HTTP (sites alvo)     │
│ TCP      │ 0.0.0.0/0    │ 443      │ HTTPS (sites alvo)    │
│ TCP      │ 0.0.0.0/0    │ 587      │ SMTP (envio de email) │
└──────────┴──────────────┴──────────┴───────────────────────┘
```

### Nginx Reverse Proxy (Opcional — recomendado para HTTPS)

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
    }
}

server {
    listen 80;
    server_name api.seudominio.com;
    return 301 https://$server_name$request_uri;
}
```

### Segurança

| Camada | Implementação |
|---|---|
| SSH | Chave pública apenas, senha desabilitada |
| Firewall | Apenas portas 22, 8000, 443 abertas |
| CORS | Apenas origin do Firebase Hosting |
| Rate limiting | 100 requests/min por IP (Nginx ou FastAPI) |
| HTTPS | Let's Encrypt via Certbot (gratuito) |
| Credenciais | Nunca armazenadas no código, apenas no .env |
| LGPD | Dados ficam na VM própria, nunca compartilhados |
| Backup | Diário automático via crontab |

---

## 9. Monitoramento e Logs

### Docker Logs

```bash
# Logs em tempo real
docker logs jobhunter --tail 100 -f

# Logs das últimas 24h
docker logs jobhunter --since 24h

# Logs com filtro
docker logs jobhunter 2>&1 | grep ERROR

# Tamanho dos logs
docker inspect jobhunter --format='{{.LogPath}}' | xargs ls -lh
```

### Log Rotation (configurado no docker-compose.yml)

```
max-size: 10MB por arquivo
max-file: 3 arquivos (total: 30MB máximo)
```

### Health Check

```bash
# Endpoint de health check
curl http://localhost:8000/health

# Response esperado:
# { "status": "healthy", "database": "connected", "scheduler": "running" }
```

### Monitoramento Opcional (Prometheus + Grafana)

```yaml
# Adicionar ao docker-compose.yml se necessário
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
```

---

## 10. CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml

name: Deploy JobHunter

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.14'
      - run: pip install uv && uv sync && uv run pytest

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci && ng build --configuration production
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SA }}'
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Oracle Cloud VM
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VM_IP }}
          username: ubuntu
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/jobhunter/backend
            git pull origin main
            docker compose up -d --build
            docker exec jobhunter uv run alembic upgrade head
```

### Rollback Manual

```bash
# Via SSH na VM
ssh ubuntu@<VM_IP>

# Rollback do código
cd ~/jobhunter/backend
git log --oneline  # ver commits
git revert HEAD    # reverter último commit
docker compose up -d --build
docker exec jobhunter uv run alembic downgrade -1  # reverter migration
```

---

## 11. Scaling Path (Evolução Futura)

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ FASE             │ ATUAL (MVP)      │ FASE 1 (2-10)    │ FASE 2 (10-100)  │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Frontend         │ Firebase Hosting │ Firebase Hosting │ CDN (CloudFlare) │
│ Backend          │ Oracle VM ARM    │ Oracle VM ARM    │ Docker Compose   │
│ Banco            │ SQLite local     │ Supabase Free    │ Supabase Pro     │
│ Auth             │ Nenhuma          │ Firebase Auth    │ Firebase Auth    │
│ Scheduler        │ APScheduler      │ APScheduler      │ Celery + Redis   │
│ Users            │ 1                │ 2-10             │ 10-100           │
│ Custo/mês        │ $0               │ $0               │ $0-25            │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Mudanças         │ —                │ +Auth            │ +Celery           │
│                  │                  │ +Multi-tenancy   │ +Redis            │
│                  │                  │ +PostgreSQL      │ +Docker Compose   │
│                  │                  │                  │ +Monitoramento    │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

### Path de Migração do Banco

```
SQLite (hoje)
  → Supabase Free (500MB PostgreSQL, $0/mês)
    → Supabase Pro ($25/mês, 8GB)
      → PostgreSQL managed (AWS RDS, GCP Cloud SQL)

A troca é apenas mudar DATABASE_URL no .env.
SQLAlchemy abstrai o banco. Alembic cuida das migrations.
```

---

## Referências

| Recurso | Link |
|---|---|
| Firebase Hosting | https://firebase.google.com/docs/hosting |
| Oracle Cloud Free | https://cloud.oracle.com/free |
| Docker | https://docs.docker.com |
| Docker Compose | https://docs.docker.com/compose |
| Let's Encrypt | https://letsencrypt.org |
| SQLite WAL Mode | https://www.sqlite.org/wal.html |
| GitHub Actions | https://docs.github.com/actions |
