# Guia Completo: PC Caseiro como Servidor PostgreSQL

> Guia passo-a-passo para transformar um PC parado em casa em um servidor PostgreSQL
> persistente, conectado ao projeto JobHunter. Zero custo recorrente.

**Tempo estimado:** ~2.5 horas
**Custo:** R$0 inicial + ~R$15/mes de luz eletrica (opcional: nobreak ~R$100)

---

## Sumario

1. [Pre-requisitos e Materiais](#fase-0--pre-requisitos-e-materiais)
2. [Preparar o Hardware](#fase-1--preparar-o-hardware)
3. [Instalar Linux (Ubuntu Server)](#fase-2--instalar-linux-ubuntu-server)
4. [Configurar o Ubuntu Server](#fase-3--configurar-o-ubuntu-server)
5. [Instalar e Configurar PostgreSQL](#fase-4--instalar-e-configurar-postgresql)
6. [Acesso Remoto pela Internet](#fase-5--acesso-remoto-pela-internet)
7. [Backup Automatico](#fase-6--backup-automatico)
8. [Conectar ao Codigo do JobHunter](#fase-7--conectar-ao-codigo-do-jobhunter)
9. [Monitoramento e Manutencao](#fase-8--monitoramento-e-manutencao)
10. [Interface Grafica (pgAdmin)](#fase-9--interface-grafica-pgadmin)
11. [Troubleshooting](#troubleshooting)

---

## Arquitetura Final

```
┌───────────────────────────────────────────────────────────────┐
│                       SUA CASA                                │
│                                                               │
│  ┌────────────────┐       ┌────────────────────────────┐     │
│  │  PC Principal   │       │  PC Velho (SERVIDOR)       │     │
│  │  (dev)          │       │  Ubuntu Server 24.04 LTS   │     │
│  │                 │       │                            │     │
│  │  VS Code        │──ETH──│  PostgreSQL 16             │     │
│  │  Frontend (ng)  │       │  ├── jobhunter_db          │     │
│  │  Backend (Fast) │       │  ├── jobhunter user        │     │
│  │  Tests (pytest) │       │  ├── backups automaticos   │     │
│  └────────────────┘       │  └── pgAdmin (Docker)      │     │
│          │                 └──────────────┬─────────────┘     │
│          │                                │                    │
│          └────────── Ethernet ────────────┘                    │
│                       (mesma rede local)                       │
│                                                                │
│  ┌────────────────┐                                            │
│  │  Oracle Cloud   │  (producao: deploy Docker)               │
│  │  Always Free    │                                            │
│  └────────────────┘                                            │
└────────────────────────────────────────────────────────────────┘

Acesso remoto (fora de casa):
  └── Tailscale (rede virtual privada, gratuito)
```

---

## Fase 0 -- Pre-requisitos e Materiais

### O que voce precisa ter

| Item | Obrigatorio? | Observacao |
|------|-------------|------------|
| PC velho (qualquer) | **Sim** | Minimo: 4GB RAM, 50GB HD/SSD |
| Monitor + teclado + mouse | Apenas para instalar | Depois roda headless (sem perifericos) |
| Cabo de rede (Ethernet) | **Recomendado** | WiFi funciona, mas e menos estavel |
| Pendrive 8GB+ | **Sim** | Para instalar o Linux (criar bootavel) |
| Nobreak | Recomendado | Evita corrupcao do DB em queda de luz |
| SSD 2.5" (opcional) | **Recomendado** | Melhora drasticamente performance de I/O |

### Checklist antes de comecar

- [ ] PC liga e entra na BIOS
- [ ] Tem pelo menos 4GB de RAM (ideal 8GB+)
- [ ] Tem HD ou SSD com 50GB+ livre
- [ ] Tem cabo Ethernet disponivel
- [ ] Conectado via Ethernet no roteador (ou ter WiFi funcional)
- [ ] Anote o IP local do PC (aparece na BIOS ou no painel do roteador)

> **Como descobrir o IP do PC velho:**
> - Ligue o PC com monitor, entre na BIOS e procure a aba "Network" ou "Status"
> - Ou conecte no roteador (geralmente `192.168.1.1` ou `192.168.0.1`) e veja a lista de dispositivos conectados

---

## Fase 1 -- Preparar o Hardware

### 1.1 Limpeza e preparacao

O PC provavelmente esta parado ha meses. Antes de ligar como servidor:

1. **Limpe a poeira** -- Abra o gabinete e use compressor de ar ou pincel para limpar o cooler, placa-mae e fonte. Poeira acumulada causa superaquecimento.

2. **Verifique cabos SATA e energia** -- Puxe levemente cada cabo para garantir que esta bem conectado. Cabos soltos causam discos nao detectados.

3. **Se vai usar SSD** -- Conecte via cabo SATA (mesmo cabo do HD). Qualquer SSD 2.5" funciona, nao precisa de slot M.2.

4. **Conecte o cabo Ethernet** direto no roteador. Evite WiFi para o servidor -- a estabilidade da conexao e critica para um DB.

5. **Verifique o cooler** -- Se o cooler do processador esta funcionando (girando quando o PC liga). Sem cooler, o PC desliga por seguranca.

### 1.2 Configurar para ligar automaticamente (BIOS)

Esse passo e **critico** -- se a luz cair, o PC precisa ligar sozinho:

1. Ligue o PC e entre na BIOS pressionando `F2`, `DEL`, ou `F10` (depende do fabricante)
2. Navegue ate **Power Management Setup** (ou similar)
3. Procure a opcao:
   - `Restore on AC Power Loss` --> coloque em **Power On**
   - ou `After Power Failure` --> **Last State** ou **Power On**
4. Salve (`F10`) e saia

> **Por que isso importa:** Sem essa configuracao, quando a luz cair e voltar, o PC vai ficar desligado. O PostgreSQL vai ficar offline ate voce manualmente ligar. Com essa opcao, ele volta automaticamente.

### 1.3 Configurar wake-on-LAN (opcional)

Para ligar o PC remotamente (pelo celular ou outro PC):

1. Na BIOS, ative **Wake on LAN** (na aba Power ou Advanced)
2. Apos instalar o Linux, configure o WoL:
   ```bash
   # No servidor (apos instalar Ubuntu)
   sudo ethtool eth0 | grep Wake-on
   # Se nao mostrar "g", ative:
   sudo nano /etc/network/interfaces
   # Adicione: post-up ethtool -s eth0 wol g
   ```

---

## Fase 2 -- Instalar Linux (Ubuntu Server)

### 2.1 Por que Ubuntu Server?

- **Leve:** Sem interface grafica = menos consumo de RAM e CPU
- **Estavel:** Versao LTS (Long Term Support) tem 10 anos de atualizacoes de seguranca
- **Comunidade enorme:** Se der qualquer problema, tem solucao em portugues
- **PostgreSQL official:** O PostgreSQL e otimizado para Debian/Ubuntu

### 2.2 Criar o pendrive bootavel

No seu PC principal (ou qualquer outro PC):

**No Windows:**

1. Baixe o Ubuntu Server ISO: `https://ubuntu.com/download/server`
   - Escolha a versao **24.04 LTS** (ultima LTS disponivel)
2. Baixe o **Rufus**: `https://rufus.ie`
3. Abra o Rufus:
   - Device: selecione o pendrive
   - Boot selection: clique "SELECT" e escolha o ISO baixado
   - Partition scheme: **MBR** (para PCs antigos) ou **GPT** (para PCs mais recentes)
   - Clique **START**
   - Quando pedir, escolha **Write in DD Image mode** (importante!)

**No Mac:**

```bash
# 1. Descubra o nome do pendrive
diskutil list

# 2. Desmonte o pendrive (substitua diskN pelo correto)
diskutil unmountDisk /dev/diskN

# 3. Grave o ISO (ATENCAO: troque diskN pelo pendrive correto!)
# ⚠️ Se errar o disco, pode formatar seu HD!
sudo dd if=~/Downloads/ubuntu-24.04-live-server-amd64.iso of=/dev/rdiskN bs=4M status=progress

# 4. Eject
diskutil eject /dev/diskN
```

**No Linux:**

```bash
# Descubra o pendrive
lsblk

# Grave o ISO (troque /dev/sdX pelo pendrive correto)
sudo dd if=~/Downloads/ubuntu-24.04-live-server-amd64.iso of=/dev/sdX bs=4M status=progress && sync
```

### 2.3 Instalacao do Ubuntu Server

1. Plugue o pen drive no PC velho
2. Ligue o PC e entre no **Boot Menu** pressionando `F12`, `F8`, ou `ESC` (depende do fabricante)
3. Selecione o pen drive (pode aparecer como "USB" ou o nome da marca)
4. O instalador do Ubuntu vai carregar

**Configuracoes recomendadas durante a instalacao:**

| Opcao | Valor | Por que |
|-------|-------|---------|
| Language | English | Menos problemas com encoding e logs |
| Keyboard | Seu layout | Usualmente English (US) |
| Install Ubuntu Server | Sim | |
| Network | DHCP | O roteador vai atribuir IP automaticamente |
| Proxy | Deixe vazio | |
| Mirror | Deixe o default | `http://archive.ubuntu.com/ubuntu` |
| Disk setup | **Use an entire disk** | Formata o disco inteiro para o servidor |
| | LVM | **Sim** -- permite redimensionar particoes depois |
| Profile | Username: `hunter` | Nome do usuario do servidor |
| | Hostname: `hunter-db` | Nome que o PC tera na rede |
| | Password: escolha uma forte | Voce vai usar isso para SSH |
| SSH Setup | **Install OpenSSH server** | **ESSENCIAL** -- permite acesso remoto |
| Featured snaps | Nenhum | Nao precisa de nada agora |

5. Aguarde a instalacao (5-15 minutos dependendo do PC)
6. Quando pedir, remova o pen drive e pressione Enter para reiniciar

### 2.4 Primeiro acesso via SSH

Apos o reboot, o PC velho vai mostrar algo como:

```
hunter-db login: _
```

No seu PC principal (não no PC velho):

```bash
# Descubra o IP do servidor
# Opcao 1: veja no monitor do PC velho (ip addr show)
# Opcao 2: veja no painel do roteador
# Opcao 3: escaneie a rede
# Mac:
arp -a | grep -i "vendor-do-seu-pc"
# Linux:
nmap -sn 192.168.1.0/24

# Conecte via SSH
ssh hunter@192.168.1.100
# Aceite a chave SSH digitando "yes"
# Digite a senha que voce escolheu
```

Se funcionou, parabens! O PC velho agora e um servidor. Pode desligar o monitor e teclado do PC velho -- ele agora roda **headless** (sem perifericos).

> **Dica:** Para facilitar conexoes futuras, configure SSH key:
> ```bash
> # No seu PC principal
> ssh-copy-id hunter@192.168.1.100
> # Agora nao precisa mais digitar senha
> ```

---

## Fase 3 -- Configurar o Ubuntu Server

Apos conectar via SSH, faca toda a configuracao pelo terminal remoto.

### 3.1 Atualizar o sistema

```bash
# Sempre o primeiro passo apos instalar
sudo apt update && sudo apt upgrade -y
```

### 3.2 Configurar IP fixo

Por padrao, o DHCP do roteador atribui IPs dinamicamente. Se o IP mudar, sua conexao quebra. Vamos fixar:

1. **Descubra o nome da interface de rede:**
   ```bash
   ip a
   # Procure a interface que comeca com "e" (ex: enp0s3, eth0, eno1)
   # Ela vai ter um IP como 192.168.1.XXX
   ```

2. **Edite o netplan:**
   ```bash
   sudo nano /etc/netplan/00-installer-config.yaml
   ```

3. **Substitua o conteudo** (ajuste `enp0s3` para o nome da sua interface e os IPs para sua rede):
   ```yaml
   network:
     version: 2
     ethernets:
       enp0s3:                    # Nome da interface (veja com `ip a`)
         dhcp4: false             # Desativa DHCP
         addresses:
           - 192.168.1.100/24     # IP fixo que voce escolher
         routes:
           - to: default
             via: 192.168.1.1     # IP do seu roteador (gateway)
         nameservers:
           addresses:
             - 8.8.8.8            # Google DNS
             - 8.8.4.4            # Google DNS backup
   ```

4. **Aplique:**
   ```bash
   sudo netplan apply
   ```

5. **Teste:**
   ```bash
   ping -c 3 8.8.8.8
   # Se funcionou, o IP fixo esta configurado
   ```

> **Importante:** Anote esse IP (`192.168.1.100`). Voce vai precisar dele para tudo.

### 3.3 Configurar swap (memoria virtual)

Se o PC tem 4GB ou menos de RAM, o swap evita que o PostgreSQL morra por falta de memoria:

```bash
# Criar 2GB de swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente (sobrevive a reboot)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verificar que funcionou
free -h
# Deve mostrar algo como:
#               total    used    free    shared  buff/cache  available
# Mem:          3.8Gi   200Mi   3.4Gi   8.0Mi   200Mi       3.4Gi
# Swap:         2.0Gi     0B    2.0Gi
```

### 3.4 Instalar ferramentas基本icas

```bash
sudo apt install -y \
  build-essential \
  curl \
  wget \
  git \
  htop \
  net-tools \
  ufw \
  tmux
```

| Ferramenta | Para que |
|------------|---------|
| `htop` | Monitor de processos (melhor que `top`) |
| `tmux` | Sessoes de terminal que sobrevivem a disconnect |
| `ufw` | Firewall facil de configurar |
| `net-tools` | Comandos de rede (`ifconfig`, `netstat`) |

### 3.5 Configurar firewall (UFW)

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH (SEMPRE antes de habilitar, senao trava!)
sudo ufw allow ssh

# Permitir PostgreSQL apenas da rede local
sudo ufw allow from 192.168.1.0/24 to any port 5432

# Verificar regras ativas
sudo ufw status verbose
```

Saida esperada:

```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
5432                       ALLOW       192.168.1.0/24
```

---

## Fase 4 -- Instalar e Configurar PostgreSQL

Essa e a fase principal. Vamos instalar o PostgreSQL, configura-lo para aceitar conexoes remotas, e criar o banco para o JobHunter.

### 4.1 Instalar o PostgreSQL

```bash
# Instalar PostgreSQL 16 e contrib (extensoes uteis)
sudo apt install -y postgresql postgresql-contrib

# Verificar se esta rodando
sudo systemctl status postgresql
```

Saida esperada (procure `active (running)`):

```
● postgresql.service - PostgreSQL Cluster 16
     Loaded: loaded (/lib/systemd/system/postgresql.service; enabled; ...)
     Active: active (running) since ...
```

Se nao estiver rodando:

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Iniciar automaticamente no boot
```

### 4.2 Entender a estrutura do PostgreSQL

Antes de configurar, entenda onde estao os arquivos importantes:

```
/etc/postgresql/16/main/
├── postgresql.conf    # Configuracao geral (porta, memoria, etc.)
├── pg_hba.conf        # Controle de quem pode conectar (autenticacao)
└── pg_ident.conf      # Mapeamento de usuarios do OS para usuarios do DB

/var/lib/postgresql/16/main/
├── base/              # Dados dos bancos
├── global/            # Dados globais
├── pg_wal/            # Write-Ahead Log (recuperacao)
└── ...                # Outros diretorios internos

/usr/lib/postgresql/16/bin/
├── psql               # Cliente de linha de comando
├── pg_dump            # Ferramenta de backup
└── ...                # Outras ferramentas
```

### 4.3 Configurar acesso remoto

Por padrao, o PostgreSQL so aceita conexoes do proprio servidor (localhost). Precisamos abrir para a rede local.

**Passo 1 -- Editar postgresql.conf:**

```bash
# Encontrar o caminho correto (pode variar por versao)
ls /etc/postgresql/

# Editar (substitua 16 pela versao instalada)
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Localize a linha `listen_addresses` (procure com `Ctrl+W` no nano) e altere:

```ini
# ANTES:
#listen_addresses = 'localhost'

# DEPOIS:
listen_addresses = '*'
```

> **O que isso faz:** `'localhost'` so permite conexoes do proprio PC. `'*'` permite conexoes de qualquer interface de rede (Ethernet, Tailscale, etc.).

**Passo 2 -- Editar pg_hba.conf:**

Esse arquivo controla **quem** pode conectar e **como** (senha, certificado, etc.):

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Adicione estas linhas **NO FINAL** do arquivo:

```
# === Regras para JobHunter ===

# Rede local -- senha obrigatoria (scram-sha-256 e o metodo mais seguro)
host    all    all    192.168.1.0/24    scram-sha-256

# Se usar Tailscale, adicione tambem:
# host    all    all    100.64.0.0/10    scram-sha-256
```

> **O que cada campo significa:**
> - `host` = conexao via rede (nao local/pipe)
> - `all` = todos os bancos
> - `all` = todos os usuarios
> - `192.168.1.0/24` = apenas da sua rede local (mascara /24 = 192.168.1.0 a 192.168.1.255)
> - `scram-sha-256` = autenticacao por senha hasheada (mais seguro que md5)

**Passo 3 -- Reiniciar o PostgreSQL:**

```bash
sudo systemctl restart postgresql

# Verificar que nao houve erro
sudo systemctl status postgresql
```

### 4.4 Criar usuario e banco para o JobHunter

```bash
# Entrar no prompt do PostgreSQL como usuario 'postgres' (admin)
sudo -u postgres psql
```

Agora voce esta no prompt do PostgreSQL (`postgres=#`). Execute cada comando:

```sql
-- 1. Criar usuario com senha forte
--    (substitua 'UmaSenhaForte123!' por uma senha real)
CREATE USER jobhunter WITH PASSWORD 'UmaSenhaForte123!';

-- 2. Criar banco de dados para o JobHunter
CREATE DATABASE jobhunter_db OWNER jobhunter;

-- 3. Conceder todas as permissoes ao usuario no banco
GRANT ALL PRIVILEGES ON DATABASE jobhunter_db TO jobhunter;

-- 4. Conectar ao banco jobhunter_db
\c jobhunter_db

-- 5. Dar permissoes no schema public (necessario para Alembic)
GRANT ALL ON SCHEMA public TO jobhunter;

-- 6. Verificar que foi criado
\l
-- Deve listar jobhunter_db na lista

-- 7. Sair do prompt
\q
```

> **Importante sobre o schema `public`:** No PostgreSQL 15+, o schema `public` nao da permissoes automaticamente. Sem o `GRANT` acima, o Alembic vai falhar ao criar tabelas com erro "permission denied for schema public".

### 4.5 Testar conexao local (no servidor)

```bash
# Conectar ao banco como usuario jobhunter
psql -h localhost -U jobhunter -d jobhunter_db

# Deve pedir a senha e conectar
# Se conectou, voce vera:
# jobhunter_db=>
```

Dentro do prompt, teste:

```sql
-- Criar uma tabela de teste
CREATE TABLE teste (id SERIAL PRIMARY KEY, nome TEXT);

-- Inserir dados
INSERT INTO teste (nome) VALUES ('conexao ok');

-- Consultar
SELECT * FROM teste;

-- Limpar
DROP TABLE teste;

-- Sair
\q
```

### 4.6 Testar conexao remota (do seu PC principal)

No seu PC principal (nao no servidor):

```bash
# Mac -- instalar cliente PostgreSQL
brew install postgresql@16

# Ou so o cliente (sem o servidor)
brew install libpq
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"

# Conectar ao servidor
psql -h 192.168.1.100 -U jobhunter -d jobhunter_db
# Digite a senha quando pedido
```

Se conectou, o PostgreSQL esta funcionando e acessivel pela rede!

**Windows:**
- Instale o PostgreSQL (escolha so o "Command Line Tools") ou baixe o pgAdmin

### 4.7 Configurar senha do usuario postgres (opcional mas recomendado)

```bash
# Entrar como postgres
sudo -u postgres psql

-- Alterar senha do postgres
ALTER USER postgres WITH PASSWORD 'OutraSenhaForte456!';

\q
```

---

## Fase 5 -- Acesso Remoto pela Internet

Enquanto voce estiver em casa, a conexao local funciona. Mas e se estiver fora de casa?

### Opcao A: Tailscale (Recomendado -- mais facil e seguro)

O Tailscale cria uma **rede virtual privada** entre seus dispositivos. E como se todos estivessem na mesma rede, mesmo quando estao em locais diferentes.

**No servidor:**

```bash
# Instalar Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Iniciar (vai dar um link para autenticar)
sudo tailscale up

# Copie o link e abra no navegador do seu celular ou PC principal
# Apos autenticar, anote o IP do Tailscale (formato 100.x.x.x)
tailscale status
```

**No seu PC principal:**

1. Instale o Tailscale: `https://tailscale.com/download`
2. Faca login com a mesma conta
3. Pronto! Ambos estao conectados

**Conectar ao PostgreSQL via Tailscale:**

```bash
# Use o IP do Tailscale (100.x.x.x) em vez do IP local
psql -h 100.x.x.x -U jobhunter -d jobhunter_db
```

> **Vantagens do Tailscale:**
> - Gratuito para uso pessoal (ate 3 usuarios)
> - Nao precisa configurar port forwarding
> - Criptografado por padrao
> - Funciona mesmo atras de NAT/firewall

### Opcao B: Port Forwarding (Menos seguro)

Se preferir nao usar o Tailscale:

1. Acesse a configuracao do roteador: `http://192.168.1.1`
2. Va em **Port Forwarding** (ou **Virtual Server**, **NAT**)
3. Adicione uma regra:

| Campo | Valor |
|-------|-------|
| Service Name | PostgreSQL |
| External Port | 5432 |
| Internal IP | 192.168.1.100 |
| Internal Port | 5432 |
| Protocol | TCP |

4. Para acessar de fora, voce precisa do IP publico:
   ```bash
   # No seu PC principal
   curl ifconfig.me
   # Retorna algo como 200.150.30.XXX
   ```

5. Conectar:
   ```bash
   psql -h 200.150.30.XXX -U jobhunter -d jobhunter_db
   ```

> **Atencao:** Isso expoe o PostgreSQL na internet. Recomendacoes:
> - Use uma senha MUITO forte
> - Considere mudar a porta de 5432 para outra (ex: 15432)
> - Limite o acesso por IP no `pg_hba.conf`

### Opcao C: WireGuard (Mais performático)

VPN open-source, 100% local (sem dependencia externa). Mais complexo de configurar:

```bash
# No servidor
sudo apt install wireguard

# Gerar chaves
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key

# Configurar (tutorial completo: https://www.wireguard.com/quickstart/)
```

---

## Fase 6 -- Backup Automatico

**Backup nao e opcional.** Se o HD corromper, sem backup voce perde tudo.

### 6.1 Criar script de backup

```bash
# Criar diretorio de backups
sudo mkdir -p /var/backups/postgresql
sudo chown hunter:hunter /var/backups/postgresql

# Criar o script
nano ~/backup-db.sh
```

Cole este conteudo:

```bash
#!/bin/bash
# ============================================
# Backup automatico do PostgreSQL - JobHunter
# ============================================

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgresql"
LOG_FILE="/var/log/backup-db.log"

echo "[$(date)] Iniciando backup..." >> $LOG_FILE

# Fazer dump do banco (senha via .pgpass)
pg_dump -h localhost -U jobhunter jobhunter_db \
  | gzip > "$BACKUP_DIR/jobhunter_$TIMESTAMP.sql.gz"

# Verificar se o backup foi criado
if [ -f "$BACKUP_DIR/jobhunter_$TIMESTAMP.sql.gz" ]; then
    SIZE=$(du -h "$BACKUP_DIR/jobhunter_$TIMESTAMP.sql.gz" | cut -f1)
    echo "[$(date)] Backup concluido: jobhunter_$TIMESTAMP.sql.gz ($SIZE)" >> $LOG_FILE
else
    echo "[$(date)] ERRO: Backup falhou!" >> $LOG_FILE
fi

# Manter apenas os ultimos 30 backups (remove os mais antigos)
ls -t $BACKUP_DIR/jobhunter_*.sql.gz | tail -n +31 | xargs rm -f 2>/dev/null

# Limpar backups muito antigos (mais de 90 dias)
find $BACKUP_DIR -name "*.sql.gz" -mtime +90 -delete 2>/dev/null

echo "[$(date)] Limpeza concluida. Backups restantes: $(ls $BACKUP_DIR/jobhunter_*.sql.gz 2>/dev/null | wc -l)" >> $LOG_FILE
```

```bash
# Tornar executavel
chmod +x ~/backup-db.sh
```

### 6.2 Configurar .pgpass (para nao digitar senha)

```bash
# Criar arquivo de senhas
nano ~/.pgpass

# Adicionar (formato: host:port:database:user:password)
localhost:5432:jobhunter_db:jobhunter:UmaSenhaForte123!

# Proteger o arquivo (obrigatorio para funcionar)
chmod 600 ~/.pgpass
```

### 6.3 Agendar com cron (backup diario)

```bash
# Abrir o editor de cron
crontab -e

# Adicionar esta linha (backup todo dia as 3:00 da manha):
0 3 * * * /home/hunter/backup-db.sh

# Salvar e sair (no nano: Ctrl+X, Y, Enter)
```

### 6.4 Testar o backup manualmente

```bash
# Rodar o script agora para testar
~/backup-db.sh

# Verificar se o arquivo foi criado
ls -la /var/backups/postgresql/

# Verificar o log
cat /var/log/backup-db.log
```

### 6.5 Backup externo (recomendado)

Manter backups so no servidor e arriscado (se o HD morrer, perde backup e dados). Copie para outro lugar:

**Opcao 1: Rsync para HD externo**

```bash
# Conectar HD externo ao servidor
sudo mount /dev/sdb1 /mnt/usb

# Copiar backups
rsync -av /var/backups/postgresql/ /mnt/usb/backups/jobhunter/

# Agendar junto com o cron (opcional)
echo "0 4 * * * rsync -av /var/backups/postgresql/ /mnt/usb/backups/jobhunter/" | crontab -
```

**Opcao 2: Rsync para outro PC na rede**

```bash
# No servidor, copiar para outro computador
rsync -av /var/backups/postgresql/ user@outro-pc:/backups/jobhunter/

# Configure SSH keys para nao precisar digitar senha
```

**Opcao 3: Cloud barata (Backblaze B2 -- 10GB gratis)**

```bash
# Instalar CLI do B2
pip install --user b2

# Configurar
b2 authorize-account KEY_ID APPLICATION_KEY

# Criar bucket
b2 create-bucket jobhunter-backups allPrivate

# Upload
b2 upload-file jobhunter-backups /var/backups/postgresql/jobhunter_latest.sql.gz backups/

# Agendar upload no cron
```

### 6.6 Como restaurar um backup

Se precisar restaurar:

```bash
# 1. Descompactar
gunzip jobhunter_20260601_030000.sql.gz

# 2. Criar o banco se nao existir
sudo -u postgres createdb jobhunter_db
sudo -u postgres psql -c "CREATE USER jobhunter WITH PASSWORD 'senha';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE jobhunter_db TO jobhunter;"

# 3. Restaurar
psql -h localhost -U jobhunter -d jobhunter_db -f jobhunter_20260601_030000.sql
```

---

## Fase 7 -- Conectar ao Codigo do JobHunter

Essa fase conecta o PostgreSQL ao projeto JobHunter. Como o codigo ja usa SQLAlchemy async e Alembic, a migracao e simples.

### 7.1 Atualizar .env

No diretorio do projeto, edite `backend/.env`:

```bash
nano backend/.env
```

Troque a `DATABASE_URL`:

```env
# DESATIVAR o SQLite antigo (comentar ou remover):
# DATABASE_URL=sqlite+aiosqlite:///./jobhunter.db

# ATIVAR o PostgreSQL:
DATABASE_URL=postgresql+asyncpg://jobhunter:UmaSenhaForte123!@192.168.1.100:5432/jobhunter_db
```

> **Se usar Tailscale:** troque `192.168.1.100` pelo IP do Tailscale (`100.x.x.x`)

**Explicacao do formato da URL:**

```
postgresql+asyncpg://USUARIO:SENHA@IP_SERVIDOR:PORTA/NOME_DO_BANCO
  │           │        │       │              │        │
  │           │        │       │              │        └── jobhunter_db
  │           │        │       │              └── 5432 (porta padrao)
  │           │        │       └── 192.168.1.100 (IP do PC servidor)
  │           │        └── jobhunter (usuario criado)
  │           └── driver async (asyncpg e o mais rapido)
  └── PostgreSQL
```

### 7.2 Atualizar alembic.ini

```bash
nano backend/alembic.ini
```

Localize e altere a linha `sqlalchemy.url`:

```ini
# ANTES:
# sqlalchemy.url = sqlite+aiosqlite:///./jobhunter.db

# DEPOIS:
sqlalchemy.url = postgresql+asyncpg://jobhunter:UmaSenhaForte123!@192.168.1.100:5432/jobhunter_db
```

> **Alternativa melhor:** Faca o `alembic.ini` ler do `.env` em vez de ter a URL hardcoded. No `alembic/env.py`, a URL ja vem de `settings.database_url`, entao basta deixar a linha do `alembic.ini` comentada.

### 7.3 Instalar o driver PostgreSQL

```bash
cd backend

# asyncpg e o driver async para PostgreSQL (mais rapido que psycopg2)
pip install asyncpg

# Adicionar ao requirements.txt (se nao estiver)
grep -q "asyncpg" requirements.txt || echo "asyncpg" >> requirements.txt
```

### 7.4 Verificar o engine SQLAlchemy

O engine esta em `backend/app/core/database.py`. Verifique se esta correto:

```python
# O codigo atual ja deve ser algo assim (ja esta correto!):
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    settings.database_url,    # Le do .env via settings
    echo=(settings.environment == "development"),
)
```

> **Boa noticia:** Como o codigo ja usa `create_async_engine`, o asyncpg funciona como **drop-in replacement** -- basta trocar a URL no `.env`. Nenhuma mudanca no codigo e necessaria.

### 7.5 Migrar dados do SQLite (se tiver dados)

Se ja tem dados no SQLite que quer manter:

```bash
# 1. Exportar do SQLite
cd backend
sqlite3 jobhunter.db .dump > /tmp/dump_sqlite.sql

# 2. Converter para PostgreSQL
# Opcao A: Usar ferramenta
pip install sqlite2postgresql
sqlite2postgresql jobhunter.db --output /tmp/dump_pg.sql

# Opcao B: Simplesmente rodar as migrations no PostgreSQL (recomendado para MVP)
# Como sao 4 tabelas e provavelmente poucos dados, e mais facil refazer
```

### 7.6 Rodar as migrations (Alembic)

```bash
cd backend

# Criar migration inicial do schema no PostgreSQL
alembic revision --autogenerate -m "migrate to postgresql"

# Aplicar a migration
alembic upgrade head
```

> **Se der erro de permissao:** Volte a Fase 4 e execute o `GRANT ALL ON SCHEMA public TO jobhunter;`

### 7.7 Verificar as tabelas criadas

```bash
# Conectar ao banco
psql -h 192.168.1.100 -U jobhunter -d jobhunter_db

# Listar tabelas
\dt

# Deve mostrar:
#                    List of relations
#  Schema |        Name        | Type  | Owner
# --------+--------------------+-------+----------
#  public | applications      | table | jobhunter
#  public | candidate_profiles| table | jobhunter
#  public | fixed_companies   | table | jobhunter
#  public | jobs              | table | jobhunter
#  public | alembic_version   | table | jobhunter
```

### 7.8 Testar a aplicacao completa

```bash
cd backend

# Rodar o backend
uvicorn app.main:app --reload

# Em outro terminal, testar os endpoints
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/docs  # Swagger UI

# Rodar os testes
pytest tests/ -v
```

Se tudo funcionou, o JobHunter agora roda com PostgreSQL no seu PC caseiro!

### 7.9 Atualizar o Docker Compose (producao Oracle)

Se quiser usar o PostgreSQL no Oracle Cloud tambem (producao):

```yaml
# docker-compose.yml (Oracle Cloud)
services:
  jobhunter:
    environment:
      - DATABASE_URL=postgresql+asyncpg://jobhunter:senha@IP_TAILSCALE:5432/jobhunter_db
```

---

## Fase 8 -- Monitoramento e Manutencao

### 8.1 Comandos uteis do PostgreSQL

```bash
# Conectar ao prompt
psql -h localhost -U jobhunter -d jobhunter_db
```

```sql
-- Ver todos os bancos
\l

-- Ver tabelas do banco atual
\dt

-- Ver estrutura de uma tabela
\d jobs

-- Ver tamanho do banco de dados
SELECT pg_size_pretty(pg_database_size('jobhunter_db'));

-- Ver tamanho de cada tabela
SELECT
    relname AS tabela,
    pg_size_pretty(pg_total_relation_size(relid)) AS tamanho
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Ver queries ativas no momento
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE state = 'active';

-- Ver quantas conexoes estao abertas
SELECT count(*) FROM pg_stat_activity;

-- Ver configuracoes importantes
SHOW shared_buffers;
SHOW work_mem;
SHOW max_connections;
```

### 8.2 Monitorar o servidor

```bash
# Uso de CPU, RAM, processos
htop

# Uso de disco
df -h

# Tamanho do banco de dados
du -sh /var/lib/postgresql/16/main/

# Ver processos do PostgreSQL rodando
ps aux | grep postgres

# Ver logs em tempo real
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Ver logs de autenticacao (se alguem tentou conectar)
sudo grep "authentication" /var/log/postgresql/postgresql-16-main.log | tail -20
```

### 8.3 Manutencao periodica

```bash
# Atualizar sistema (fazer mensalmente)
sudo apt update && sudo apt upgrade -y

# Limpar pacotes nao utilizados
sudo apt autoremove -y

# Analise de performance do PostgreSQL (executar trimestralmente)
sudo -u postgres vacuumdb --all --analyze-in-stats

# Verificar integridade do disco
sudo fsck -n /dev/sda1  # Modo dry-run (nao altera nada)
```

### 8.4 Atualizar o PostgreSQL

```bash
# Quando sair uma nova versao
sudo apt update
sudo apt list --upgradable | grep postgresql
sudo apt upgrade postgresql postgresql-contrib
```

---

## Fase 9 -- Interface Grafica (pgAdmin)

O pgAdmin e uma interface web para gerenciar o PostgreSQL visualmente. Util para ver tabelas, rodar queries, e monitorar o banco.

### 9.1 Instalar Docker

```bash
# Instalar Docker
sudo apt install -y docker.io docker-compose

# Adicionar usuario ao grupo docker (para nao precisar de sudo)
sudo usermod -aG docker $USER

# Fazer logout e login novamente (para o grupo ter efeito)
# Ou execute:
newgrp docker
```

### 9.2 Criar pgAdmin com Docker Compose

```bash
# Criar diretorio
mkdir -p ~/pgadmin
cd ~/pgadmin

# Criar docker-compose.yml
cat > docker-compose.yml << 'EOF'
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

# Iniciar
docker-compose up -d

# Verificar que esta rodando
docker ps
```

### 9.3 Acessar o pgAdmin

1. Abra o navegador
2. Acesse: `http://192.168.1.100:5050`
3. Faca login com:
   - Email: `admin@jobhunter.local`
   - Senha: `admin123`

### 9.4 Configurar conexao ao PostgreSQL no pgAdmin

1. Botao direito em "Servers" > "Register" > "Server"
2. Na aba **General**:
   - Name: `JobHunter`
3. Na aba **Connection**:
   - Host: `192.168.1.100` (ou `localhost` se acessando do proprio servidor)
   - Port: `5432`
   - Database: `jobhunter_db`
   - Username: `jobhunter`
   - Password: a senha que voce criou
4. Clique **Save**

Pronto! Agora voce pode ver e gerenciar todas as tabelas visualmente.

---

## Troubleshooting

### Erros de conexao

| Erro | Causa | Solucao |
|------|-------|---------|
| `connection refused` | PostgreSQL nao esta rodando | `sudo systemctl start postgresql` |
| `authentication failed` | Senha incorreta ou usuario nao existe | Verifique com `sudo -u postgres psql -c "\du"` |
| `no pg_hba.conf entry` | IP nao esta na lista de permitidos | Adicione regra no `pg_hba.conf` |
| `could not connect to server` | Firewall bloqueando ou IP errado | Verifique `sudo ufw status` e o IP |
| `FATAL: database "X" does not exist` | Banco nao foi criado | `sudo -u postgres createdb X` |
| `SCRAM-SHA-256 authentication failed` | Senha no `.pgpass` esta errada | Verifique o formato: `host:port:db:user:pass` |

### Erros de performance

| Problema | Solucao |
|----------|---------|
| Queries lentas | Verifique se tem index: `\d tabela` veja os indexes |
| Disco cheio | `df -h` para ver uso, limpe backups antigos |
| Muita RAM sendo usada | Verifique `free -h`, considere diminuir `shared_buffers` no `postgresql.conf` |
| Swap sendo usado muito | Adicione mais RAM ou diminua `work_mem` |

### Erros do servidor

| Problema | Solucao |
|----------|---------|
| PC desliga sozinho | Verifique BIOS "Power On After Power Loss" |
| PC nao liga apos queda de luz | Verifique se o nobreak esta funcionando |
| SSH cai e nao reconecta | Use `tmux` para sessoes persistentes |
| Servidor nao aparece na rede | Verifique Ethernet e IP fixo |

### Comandos de emergencia

```bash
# Ver se o PostgreSQL esta rodando
sudo systemctl status postgresql

# Reiniciar o PostgreSQL
sudo systemctl restart postgresql

# Ver logs de erro
sudo journalctl -u postgresql --since "1 hour ago"

# Verificar se a porta esta aberta
sudo ss -tlnp | grep 5432

# Testar conexao do proprio servidor
pg_isready -h localhost -p 5432
```

---

## Resumo de Ordems de Execucao

```
Fase 0: Verificar hardware .......................... (15 min)
Fase 1: Preparar hardware + BIOS ................. (15 min)
Fase 2: Instalar Ubuntu Server .................... (30 min)
Fase 3: Configurar Ubuntu .......................... (20 min)
Fase 4: Instalar PostgreSQL ........................ (15 min)
Fase 5: Acesso remoto (Tailscale) .............. (10 min)
Fase 6: Backup automatico ......................... (15 min)
Fase 7: Conectar ao codigo ......................... (10 min)
Fase 8: Monitoramento ............................... (5 min)
Fase 9: pgAdmin (Docker) ........................... (10 min)
─────────────────────────────────────────────────
Total estimado: ~2.5 horas
```

---

## Referencias

- [PostgreSQL Docs](https://www.postgresql.org/docs/16/)
- [Ubuntu Server Install Guide](https://ubuntu.com/tutorials/install-ubuntu-server)
- [Tailscale Docs](https://tailscale.com/kb/)
- [pgAdmin Docs](https://www.pgadmin.org/docs/)
- [Alembic Docs](https://alembic.sqlalchemy.org/)
