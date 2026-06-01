# Plano: PC Caseiro como Servidor PostgreSQL

**Objetivo:** Transformar um PC parado em casa em um servidor PostgreSQL persistente, acessivel remotamente, conectado ao projeto JobHunter.

**Custo estimado:** R$0 inicial (so luz eletrica ~R$15/mes) + nobreak opcional (~R$100)

**Documentacao completa:** `docs/home-server-guide.md` (guia passo-a-passo com todos os comandos)

**Stack confirmada no projeto:**
- `backend/app/core/database.py` usa `create_async_engine` + `async_sessionmaker` (ja e async)
- Driver atual: `sqlite+aiosqlite` — drop-in replacement e `postgresql+asyncpg`
- 4 tabelas: `jobs`, `applications`, `fixed_companies`, `candidate_profiles`
- `alembic.ini` e `alembic/env.py` ja configurados para async
- Nenhuma mudanca no codigo necessaria — so trocar URL no .env

---

## Fase 0 — Pré-requisitos e Materiais

### O que você precisa ter

| Item | Obrigatório? | Observação |
|------|-------------|------------|
| PC velho (qualquer) | Sim | Mínimo: 4GB RAM, 50GB HD |
| Monitor + teclado + mouse | Apenas para instalação | Depois roda headless (sem periféricos) |
| Cabo de rede (Ethernet) | Recomendado | WiFi funciona mas é menos estável |
| Pendrive 8GB+ | Sim | Para instalar o Linux |
| Nobreak | Recomendado | Evita corrupção do DB em queda de luz |
| SSD (opcional) | Recomendado | Melhora drasticamente a performance |

### Checklist antes de começar

- [ ] PC liga e entra na BIOS
- [ ] Tem pelo menos 4GB de RAM (ideal 8GB+)
- [ ] Tem HD ou SSD com 50GB+ livre
- [ ] Conectado via Ethernet no roteador
- [ ] Anote o IP local do PC (vai aparecer na BIOS ou no roteador)

---

## Fase 1 — Preparar o Hardware

### 1.1 Limpeza e preparação

1. Abra o PC e limpe a poeira (compressor de ar ou pincel)
2. Verifique se todos os cabos SATA e energia estão firmes
3. Se vai usar SSD, conecte via SATA (se o PC não tem slot M.2, qualquer SSD 2.5" funciona)
4. Conecte o cabo Ethernet direto no roteador (evita problemas de WiFi)

### 1.2 Configurar para ligar automaticamente

1. Entre na BIOS (geralmente `F2`, `DEL`, ou `F10` ao ligar)
2. Vá em **Power Management** ou similar
3. Ative **"Restore on AC Power Loss"** ou **"Power On After Power Failure"**
4. Salve e saia

> **Por quê:** Se a luz cair e voltar, o PC liga sozinho e o PostgreSQL sobe automaticamente.

---

## Fase 2 — Instalar Linux (Ubuntu Server)

### 2.1 Criar o pendrive bootável

No seu PC principal (ou qualquer outro):

1. Baixe o Ubuntu Server ISO: `https://ubuntu.com/download/server`
   - Versão LTS (24.04 recomendada)
2. Baixe o Rufus (Windows) ou use `dd` (Linux/Mac):
   ```bash
   # Mac/Linux:
   sudo dd if=ubuntu-24.04-live-server-amd64.iso of=/dev/sdX bs=4M status=progress
   # ⚠️ Troque /dev/sdX pelo pen drive correto! Use `lsblk` para verificar
   ```
3. No Windows, use Rufus:
   - Selecione o ISO
   - Selecione o pen drive
   - Clique "Start"
   - Escolha "Write in DD Image mode"

### 2.2 Instalação do Ubuntu Server

1. Plugue o pen drive no PC velho
2. Ligue o PC e entre no Boot Menu (geralmente `F12`, `F8`, ou `ESC`)
3. Selecione o pen drive
4. Siga o instalador:

**Configurações recomendadas:**

| Opção | Valor |
|-------|-------|
| Username | `hunter` (ou o que preferir) |
| Hostname | `hunter-db` |
| Disk setup | Use o disco inteiro (LVM opcional mas recomendado) |
| Network | DHCP (atribui IP automático) |
| SSH | **ATIVE** (essencial para acesso remoto) |
| Extra packages | `openssh-server` (já vem se ativou SSH) |

5. Aguarde a instalação e remova o pen drive quando pedir

### 2.3 Primeiro acesso via SSH

No seu PC principal, conecte ao servidor:

```bash
# Descubra o IP do servidor (veja no roteador ou use o monitor do PC velho)
ssh hunter@IP_DO_SERVIDOR

# Exemplo:
ssh hunter@192.168.1.100
```

Se funcionou, pode desligar o monitor e teclado do PC velho — ele agora é um servidor headless!

---

## Fase 3 — Configurar o Ubuntu Server

### 3.1 Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 3.2 Configurar IP fixo (importante!)

Para o servidor não mudar de IP:

1. Edite o netplan:
   ```bash
   sudo nano /etc/netplan/00-installer-config.yaml
   ```

2. Adicione o IP fixo (ajuste para sua rede):
   ```yaml
   network:
     version: 2
     ethernets:
       enp0s3:  # Nome da interface (veja com `ip a`)
         dhcp4: false
         addresses:
           - 192.168.1.100/24  # IP fixo que você escolher
         routes:
           - to: default
             via: 192.168.1.1  # IP do seu roteador
         nameservers:
           addresses:
             - 8.8.8.8
             - 8.8.4.4
   ```

3. Aplique:
   ```bash
   sudo netplan apply
   ```

4. No roteador, reserve este IP para o MAC do servidor (DHCP Reservation) — opcional mas recomendado.

### 3.3 Configurar swap (se tiver pouca RAM)

```bash
# Criar 2GB de swap (se o PC tem 4GB ou menos de RAM)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verificar
free -h
```

### 3.4 Instalar dependências

```bash
# Compilar e ferramentas úteis
sudo apt install -y build-essential curl wget git htop net-tools ufw
```

---

## Fase 4 — Instalar e Configurar PostgreSQL

### 4.1 Instalar

```bash
sudo apt install -y postgresql postgresql-contrib

# Verificar se está rodando
sudo systemctl status postgresql
```

### 4.2 Configurar acesso remoto

Por padrão, o PostgreSQL só aceita conexões locais. Precisamos abrir:

1. Edite o `postgresql.conf`:
   ```bash
   sudo nano /etc/postgresql/*/main/postgresql.conf
   ```

2. Localize e altere:
   ```ini
   # Linha ~60 - Mude de 'localhost' para '*'
   listen_addresses = '*'
   ```

3. Edite o `pg_hba.conf` (controle de acesso):
   ```bash
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   ```

4. Adicione NO FINAL (para permitir conexão pela rede local):
   ```
   # Rede local - senha obrigatória
   host    all    all    192.168.1.0/24    scram-sha-256
   ```

   > ⚠️ **Segurança:** Isso permite conexão apenas da sua rede (192.168.1.x). Para acesso externo, use Tailscale (ver Fase 5).

5. Reinicie o PostgreSQL:
   ```bash
   sudo systemctl restart postgresql
   ```

### 4.3 Criar usuário e banco para o JobHunter

```bash
# Entrar no prompt do PostgreSQL
sudo -u postgres psql

-- Criar usuário com senha forte
CREATE USER jobhunter WITH PASSWORD 'UmaSenhaForte123!';

-- Criar banco de dados
CREATE DATABASE jobhunter_db OWNER jobhunter;

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE jobhunter_db TO jobhunter;

-- Sair
\q
```

### 4.4 Testar conexão local

```bash
# Testar pelo servidor mesmo
psql -h localhost -U jobhunter -d jobhunter_db

# Deve pedir a senha e conectar
# Digite \q para sair
```

### 4.5 Testar conexão remota

No SEU PC principal (não no servidor):

```bash
# Instalar psql no client (se não tiver)
# Mac: brew install postgresql
# Windows: baixe o PostgreSQL ou use o pgAdmin

psql -h 192.168.1.100 -U jobhunter -d jobhunter_db
```

### 4.6 Configurar firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh

# Permitir PostgreSQL apenas da rede local
sudo ufw allow from 192.168.1.0/24 to any port 5432

# Verificar regras
sudo ufw status
```

---

## Fase 5 — Acesso Remoto pela Internet (Opcional mas Recomendado)

### Opção A: Tailscale (Recomendado — mais fácil)

1. Instale no servidor:
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```

2. Siga o link que aparece para autenticar

3. Instale no seu PC principal:
   - Windows/Mac/Linux: `https://tailscale.com/download`

4. Agora ambos estão na mesma rede virtual. Conecte:
   ```bash
   # Use o IP do Tailscale (ex: 100.x.x.x)
   psql -h 100.x.x.x -U jobhunter -d jobhunter_db
   ```

### Opção B: Port Forwarding (Menos seguro)

No roteador:
1. Acesse a configuração (geralmente `192.168.1.1`)
2. Vá em **Port Forwarding** ou **Virtual Server**
3. Adicione regra:
   - Porta externa: `5432`
   - IP interno: `192.168.1.100`
   - Porta interna: `5432`
   - Protocolo: TCP

4. No seu provedor, pode precisar ligar para liberar porta (alguns bloqueiam)

> ⚠️ **Cuidado:** Expor PostgreSQL diretamente na internet é arriscado. Use senhas fortes e considere mudar a porta padrão.

### Opção C: WireGuard (Mais performático que Tailscale)

Mais complexo de configurar, mas funciona 100% localmente (sem dependência externa). Tutorial:
```bash
# No servidor
sudo apt install wireguard
# Seguir: https://www.wireguard.com/quickstart/
```

---

## Fase 6 — Backup Automático

### 6.1 Script de backup

```bash
# Criar diretório de backups
sudo mkdir -p /var/backups/postgresql
sudo chown hunter:hunter /var/backups/postgresql

# Criar script
nano ~/backup-db.sh
```

```bash
#!/bin/bash
# Backup diário do PostgreSQL
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgresql"

# Fazer dump
pg_dump -h localhost -U jobhunter jobhunter_db | gzip > "$BACKUP_DIR/jobhunter_$TIMESTAMP.sql.gz"

# Manter apenas os últimos 30 backups
ls -t $BACKUP_DIR/jobhunter_*.sql.gz | tail -n +31 | xargs rm -f 2>/dev/null

echo "Backup concluído: jobhunter_$TIMESTAMP.sql.gz"
```

```bash
chmod +x ~/backup-db.sh
```

### 6.2 Agendar com cron

```bash
crontab -e

# Adicionar (backup todo dia às 3:00 da manhã):
0 3 * * * /home/hunter/backup-db.sh >> /var/log/backup.log 2>&1
```

### 6.3 Backup externo (recomendado)

Copie os backups para outro lugar:

```bash
# Opção 1: Rsync para um HD externo
sudo mount /dev/sdb1 /mnt/usb
rsync -av /var/backups/postgresql/ /mnt/usb/backups/

# Opção 2: Rsync para outro computador na rede
rsync -av /var/backups/postgresql/ user@outro-pc:/backups/jobhunter/

# Opção 3: Sync com cloud barata (Backblaze B2 - 10GB grátis)
# Instalar o CLI do B2 e agendar junto com o cron
```

---

## Fase 7 — Conectar ao Código do JobHunter

### 7.1 Atualizar .env no backend

```bash
# No diretório do projeto
nano backend/.env
```

Alterar a DATABASE_URL:

```env
# DESATIVAR o SQLite antigo (comentar ou remover):
# DATABASE_URL=sqlite:///./jobhunter.db

# ATIVAR o PostgreSQL:
DATABASE_URL=postgresql+asyncpg://jobhunter:UmaSenhaForte123!@192.168.1.100:5432/jobhunter_db
```

**Explicação do formato:**
```
postgresql+asyncpg://USUARIO:SENHA@IP_SERVIDOR:PORTA/NOME_DO_BANCO
  │           │        │       │              │        │
  │           │        │       │              │        └── jobhunter_db
  │           │        │       │              └── 5432 (padrão)
  │           │        │       └── 192.168.1.100 (IP do PC)
  │           │        └── jobhunter (usuário criado)
  │           └── driver async (mais rápido com FastAPI)
  └── PostgreSQL
```

> **Se usar Tailscale:** troque `192.168.1.100` pelo IP do Tailscale (`100.x.x.x`)

### 7.2 Instalar o driver PostgreSQL

```bash
cd backend

# asyncpg é o driver async para PostgreSQL (mais rápido que psycopg2)
pip install asyncpg sqlalchemy[asyncio]

# Ou atualize o requirements.txt:
echo "asyncpg" >> requirements.txt
echo "sqlalchemy[asyncio]" >> requirements.txt
```

### 7.3 Verificar o engine no código

O engine SQLAlchemy provavelmente está em `backend/app/core/` ou `backend/app/database.py`. Verifique se está usando o driver correto:

```python
# Deve ser algo assim:
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # True para debug (mostra queries no console)
    pool_size=5,
    max_overflow=10,
)
```

> **Nota:** Se o código atual usa `sqlite+aiosqlite`, o asyncpg funciona como drop-in replacement — basta trocar a URL.

### 7.4 Migrar dados do SQLite (se tiver dados)

Se já tem dados no SQLite que quer manter:

```bash
# 1. Exportar do SQLite
sqlite3 jobhunter.db .dump > dump.sql

# 2. Limpar sintaxe SQLite -> PostgreSQL (simplificar)
# Edite o dump.sql manualmente ou use um conversor:
pip install sqlite2postgresql
sqlite2postgresql jobhunter.db --output dump_pg.sql

# 3. Importar no PostgreSQL
psql -h 192.168.1.100 -U jobhunter -d jobhunter_db -f dump_pg.sql
```

### 7.5 Rodar as migrations (Alembic)

```bash
cd backend

# Criar migration inicial do schema no PostgreSQL
alembic revision --autogenerate -m "initial postgres schema"

# Aplicar
alembic upgrade head
```

> **Dica:** Se o Alembic já está configurado, ele vai detectar que o target mudou de SQLite para PostgreSQL e gerar a migration correta.

### 7.6 Testar a aplicação

```bash
cd backend

# Rodar o backend
uvicorn app.main:app --reload

# Testar os endpoints
curl http://localhost:8000/api/v1/health
```

---

## Fase 8 — Monitoramento e Manutenção

### 8.1 Comandos úteis do PostgreSQL

```sql
-- Ver databases
\l

-- Ver tabelas
\dt

-- Ver tamanho do banco
SELECT pg_size_pretty(pg_database_size('jobhunter_db'));

-- Ver queries ativas
SELECT * FROM pg_stat_activity;

-- Ver tamanho das tabelas
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### 8.2 Monitorar o servidor

```bash
# Ver uso de recursos
htop

# Ver disco
df -h

# Ver processos do PostgreSQL
ps aux | grep postgres

# Ver logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### 8.3 Atualizar o PostgreSQL

```bash
sudo apt update && sudo apt upgrade postgresql postgresql-contrib
```

---

## Fase 9 — Acessibilidade (Opcional)

### pgAdmin via Docker (interface web)

```bash
# Instalar Docker
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER
# Faça logout e login novamente

# Criar docker-compose.yml
cat > ~/pgadmin/docker-compose.yml << 'EOF'
version: '3.8'
services:
  pgadmin:
    image: dpage/pgadmin4
    container_name: pgadmin
    restart: always
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@jobhunter.local
      PGADMIN_DEFAULT_PASSWORD: admin123
    volumes:
      - pgadmin_data:/var/lib/pgadmin

volumes:
  pgadmin_data:
EOF

cd ~/pgadmin
docker-compose up -d

# Acessar: http://192.168.1.100:5050
```

---

## Resumo da Arquitetura Final

```
┌─────────────────────────────────────────────────────────┐
│                    SUA CASA                             │
│                                                         │
│  ┌──────────────┐     ┌──────────────────────────┐     │
│  │  PC Principal │     │  PC Velho (SERVIDOR)     │     │
│  │  (dev)        │     │  Ubuntu Server 24.04     │     │
│  │               │     │                          │     │
│  │  VS Code      │────▶│  PostgreSQL 16           │     │
│  │  Frontend     │     │  - jobhunter_db          │     │
│  │  Backend      │     │  - jobhunter user        │     │
│  │  curl/testes  │     │  - backups automáticos   │     │
│  └──────────────┘     │  - pgAdmin (Docker)      │     │
│         │              └────────────┬─────────────┘     │
│         │                           │                   │
│         └────────── Ethernet ───────┘                   │
│                      (mesma rede)                       │
│                                                         │
│  ┌──────────────┐                                       │
│  │  Oracle Cloud │  (opcional: deploy produção)         │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘

Acesso remoto (fora de casa):
  └── Tailscale (rede virtual privada, gratuito)
```

---

## Troubleshooting Comum

| Problema | Solução |
|----------|---------|
| `connection refused` | PostgreSQL não está rodando: `sudo systemctl start postgresql` |
| `authentication failed` | Verifique usuário/senha no `pg_hba.conf` e `CREATE USER` |
| `no pg_hba.conf entry` | Adicione a regra de host no `pg_hba.conf` |
| `could not connect to server` | Verifique firewall (`ufw status`) e IP |
| Lentidão | Verifique swap (`free -h`), considere SSD |
| Disco cheio | Limpe backups antigos: `sudo apt autoremove` |
| PC desliga sozinho | Verifique BIOS "Power On After Power Loss" |

---

## Ordem de Execução Resumida

```
Fase 0: Verificar hardware .......................... (15 min)
Fase 1: Preparar hardware + BIOS ................. (15 min)
Fase 2: Instalar Ubuntu Server .................... (30 min)
Fase 3: Configurar Ubuntu .......................... (20 min)
Fase 4: Instalar PostgreSQL ........................ (15 min)
Fase 5: Acesso remoto (Tailscale) .............. (10 min)
Fase 6: Backup automático ......................... (15 min)
Fase 7: Conectar ao código ......................... (10 min)
Fase 8: Monitoramento ............................... (5 min)
Fase 9: pgAdmin (Docker) ........................... (10 min)
─────────────────────────────────────────────────
Total estimado: ~2.5 horas
```
