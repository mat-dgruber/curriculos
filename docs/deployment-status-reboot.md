# Status de Implantação e Próximos Passos (Reboot da VM)

Este documento descreve o ponto de parada do projeto, os ajustes efetuados em ambiente local e as etapas necessárias para reiniciar a VM da Oracle Cloud e aplicar as atualizações.

---

## 📋 1. Ajustes Efetuados (Local)

### Frontend (Interface Angular)
* **Ajuste:** Correção no componente de listagem de vagas [jobs-list.component.ts](file:///Users/matheus.diniz_1/Documents/GitHub/curriculos/frontend/src/app/features/jobs/jobs-list/jobs-list.component.ts).
* **Motivo:** Quando o usuário acionava um *scan* manual de vagas e navegava para outra tela, a variável de controle local `scanning` era redefinida como `false` ao destruir o componente. Ao voltar para a tela de vagas, parecia que a varredura havia "travado" ou "parado", embora o processo continuasse rodando no servidor.
* **Resolução:** Adicionada verificação no método `ngOnInit` para chamar `getScanStatus()` na inicialização do componente. Se o backend estiver rodando o scan, o frontend reassume o polling e atualiza o estado da tela automaticamente.

### Backend (FastAPI / SQLite)
* **Ajuste:** Adicionado auto-criação da pasta do banco de dados no método `init_db` em [database.py](file:///Users/matheus.diniz_1/Documents/GitHub/curriculos/backend/app/core/database.py).
* **Motivo:** Garante que a pasta destino (como `./data`) seja gerada dinamicamente caso ela não exista, prevenindo erros de SQLite ao inicializar.

### Versionamento (Git)
* As correções locais foram consolidadas e enviadas para o repositório principal no GitHub via branch `main`. O repositório está 100% atualizado.

---

## ⚠️ 2. Ponto de Parada (Estado do Deploy)

A VM da **Oracle Cloud** (IP: `137.131.190.22`) encontra-se **travada/inacessível**:
* Tentativas de conexão SSH e requisições HTTP para a API de `/health` retornam **Timeout** (tempo de resposta esgotado).
* **Causa do travamento:** Execução do Playwright (Chromium) para raspagem e enriquecimento de vagas (LinkedIn/Catho) consome muita RAM/CPU. Sem limites rígidos de recursos no Docker ou swap suficiente, a VM Always Free de 1 OCPU/ARM chega a 100% de uso e congela o sistema operacional.

---

## 🚀 3. Roteiro para Destravar e Atualizar (Próximas Etapas)

### Passo 1: Forçar Reinicialização da VM
Como a máquina não responde ao SSH, a reinicialização deve ser feita via console da **Oracle Cloud**:
1. Acesse o console web da [Oracle Cloud](https://cloud.oracle.com).
2. Navegue até **Compute** -> **Instances** -> Selecione a instância correspondente.
3. Clique no botão de ações e selecione **Reboot** (caso não funcione em alguns minutos, utilize o **Force Reboot**).
4. Monitore até que o status da VM retorne para **Running** (Verde).

### Passo 2: Validar o IP da VM
Verifique no console da Oracle Cloud se a instância manteve o mesmo IP público (`137.131.190.22`). 
* *Nota: Se a VM não usar um IP estático (reservado), o endereço IP pode mudar após o reboot.*

### Passo 3: Executar Atualização e Deploy
Assim que a máquina estiver online e acessível, atualize o código remoto no repositório da VM e reinicie os contêineres Docker executando o seguinte comando no terminal do seu Mac:

```bash
ssh -i /Users/matheus.diniz_1/Documents/ssh-key-2026-06-02.key ubuntu@137.131.190.22 "cd ~/jobhunter/backend && git pull origin main && docker compose up -d --build"
```
*(Nota: Substitua `~/jobhunter/backend` pela pasta correspondente caso o caminho da aplicação na VM seja diferente).*

### Passo 4: Otimização e Prevenção de Novos Travamentos
Para evitar que novas buscas manuais de vagas derrubem o servidor novamente:
1. Edite o arquivo `.env` localizado na VM e limite as plataformas de varredura para usar apenas scrapers que não utilizam navegador visual (Chromium):
   ```env
   ENABLED_SCRAPERS=gupy,remotive
   ```
2. Opcionalmente, adicione limites de memória RAM no serviço `backend` dentro do `docker-compose.yml` para impedir que o processo consuma toda a memória do host.
