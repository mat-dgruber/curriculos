# Guia do Usuário — JobHunter

## 1. O que é o JobHunter?

O JobHunter é uma ferramenta pessoal de automação que cuida da parte mais cansativa da busca por emprego: entrar em dezenas de sites, preencher os mesmos dados várias vezes e perder tempo com tarefas repetitivas.

**O que ele faz:**

- Varre automaticamente vagas no LinkedIn, Gupy e Vagas.com
- Compara cada vaga com seu perfil e calcula um score de compatibilidade (0-100%)
- Envia seu currículo automaticamente para vagas compatíveis
- Envia currículo mensalmente para empresas que você escolher
- Te notifica por e-mail sobre tudo que acontece

**O que ele NÃO faz:**

- Não garante entrevistas ou contratação
- Não substitui sua preparação para entrevistas
- Não cria currículo — você cadastra o seu PDF
- Não armazena senhas de plataformas externas

---

## 2. Primeiros Passos (Setup Inicial)

Quando acessar o JobHunter pela primeira vez, siga estes passos:

### Passo 1: Acesse o painel

Abra o navegador e acesse a URL do JobHunter. Você verá o dashboard principal.

### Passo 2: Cadastre seu perfil profissional

Vá em **Meu Perfil** e preencha:

- **Nome completo** — como aparece no seu currículo
- **E-mail** — principal, onde você recebe propostas
- **Telefone** — com DDD
- **Localização** — cidade e estado
- **Cargo alvo** — ex: "Desenvolvedor Angular/Python"
- **LinkedIn** — URL do seu perfil (opcional)

### Passo 3: Configure palavras-chave

Em **Configurações**, adicione palavras que representam suas habilidades:

- Exemplos: `angular`, `python`, `typescript`, `fastapi`, `playwright`
- Quanto mais palavras, mais refinada a busca
- Máximo recomendado: 10 palavras

### Passo 4: Defina localizações preferidas

Adicione as cidades/regiões onde você quer trabalhar:

- Exemplos: `São Paulo`, `Remoto`, `Híbrido`, `Rio de Janeiro`
- O sistema filtra vagas por essas localizações

### Passo 5: Faça upload do currículo

Em **Meu Perfil**, clique em "Upload do Currículo" e selecione seu PDF:

- Formato: PDF obrigatório
- Tamanho máximo: 10MB
- O arquivo substitui o anterior (se houver)
- O PDF nunca fica exposto publicamente

### Passo 6: Configure a frequência de varredura

Em **Configurações**, escolha a frequência:

- A cada 3 horas (busca mais frequente)
- A cada 6 horas (recomendado)
- A cada 12 horas
- Diariamente

### Passo 7: Ative ou desative a candidatura automática

- **Desligado** (recomendado para começar): você revisa as vagas e clica manualmente em "Candidatar-se"
- **Ligado**: o sistema envia automaticamente para vagas com score ≥ 80%

> **Dica:** Comece com a candidatura automática DESLIGADA. Revise as vagas encontradas por alguns dias para confiar no sistema antes de ativar.

---

## 3. O Painel de Controle (Dashboard)

O Dashboard é a primeira tela que você vê. Ele mostra uma visão geral do sistema:

### Cards de Métricas

- **Vagas Encontradas** — total de vagas que o sistema já varreu
- **Currículos Enviados** — quantas candidaturas foram feitas (manuais + automáticas)
- **Taxa de Resposta** — percentual de empresas que responderam

### Status do Robô

- **Verde (ativo)** — o sistema está rodando normalmente
- **Cinza (pausado)** — o sistema está em pausa (férias, processo em andamento, etc.)
- Mostra quando foi a última varredura e quando será a próxima

### Vagas Recentes

As últimas 5 vagas encontradas, cada uma com:

- Título da vaga
- Nome da empresa
- **Score de compatibilidade** (badge colorido):
  - **Verde (≥80%)** — alta compatibilidade, vaga ideal
  - **Amarelo (≥60%)** — boa compatibilidade
  - **Laranja (≥40%)** — compatibilidade razoável
  - **Vermelho (<40%)** — baixa compatibilidade

---

## 4. Explorando Vagas

### A Tabela de Vagas

Em **Vagas**, você vê todas as vagas encontradas organizadas em tabela:

- **Cargo** — título da vaga
- **Empresa** — nome da empresa
- **Plataforma** — onde a vaga foi encontrada (LinkedIn, Gupy, Vagas.com)
- **Score** — compatibilidade com seu perfil (0-100%)
- **Data** — quando a vaga foi encontrada
- **Status** — Nova, Visualizada ou Candidatou

### Filtros Disponíveis

- **Busca por texto** — procure por cargo ou empresa
- **Score mínimo** — mostre apenas vagas acima de um score (ex: 70%)
- **Plataforma** — filtre por LinkedIn, Gupy ou Vagas.com
- **Status** — filtre por Nova, Visualizada ou Candidatou

### Ver Detalhes da Vaga

Clique numa vaga para ver:

- Descrição completa
- Requisitos da vaga
- Faixa salarial (quando disponível)
- Link para a vaga original
- Botão **"Candidatar-se agora"** para envio manual

### O que cada status significa

- **Nova** — vaga recém-encontrada pelo sistema
- **Visualizada** — você abriu os detalhes da vaga
- **Candidatou** — você ou o sistema enviou candidatura

---

## 5. Histórico de Candidaturas

Em **Candidaturas**, você vê o histórico completo de todos os envios.

### Informações de cada candidatura

- **Vaga** — título da vaga
- **Empresa** — nome da empresa
- **Data** — quando foi enviado
- **Status** — Pendente, Enviado, Falhou ou Arquivado
- **Tipo** — Único (manual) ou Recorrente (empresa fixa)
- **Evidência** — screenshot do envio automatizado

### Filtros

- **Por status**: Pendente, Enviado, Falhou, Arquivado
- **Por data**: intervalo de datas
- **Por tipo**: único ou recorrente

### O que fazer quando status é "Falhou"

1. Clique na candidatura para ver a mensagem de erro
2. Causas comuns:
   - Captcha bloqueou a automação
   - Formulário mudou de estrutura
   - Site fora do ar
3. Ações possíveis:
   - Tentar novamente manualmente (clique no link da vaga original)
   - Arquivar a candidatura
   - Aguardar o próximo ciclo de tentativa automática

### Screenshots de Evidência

Cada envio automatizado gera dois screenshots:

- **Antes de enviar** — mostra o formulário preenchido
- **Depois de enviar** — mostra a confirmação ou erro

Esses screenshots servem como prova de que a tentativa foi feita.

---

## 6. Empresas Fixas (Envio Recorrente Mensal) — O Diferencial

### O que são empresas fixas?

São empresas que você quer manter contato constante. Em vez de se candidatar uma única vez, o sistema envia seu currículo **todo mês** para essas empresas.

### Por que isso importa?

Muitas empresas usam sistemas como Gupy, Workday ou LinkedIn para gerenciar candidaturas. Esses sistemas priorizam currículos mais recentes na fila. Se você se candidatou há 3 meses, seu currículo pode ter ficado no fundo da pilha. Com envio mensal, você sempre aparece como "candidatura recente".

### Como cadastrar uma empresa fixa

1. Vá em **Empresas Fixas**
2. Clique em **"+ Nova Empresa"**
3. Preencha:
   - **Nome** — nome da empresa (ex: "Banco XYZ")
   - **URL do formulário** — link da página "Trabalhe Conosco" ou formulário de candidatura
   - **Intervalo** — dias entre envios (padrão: 30 dias)
   - **Notas** — informações úteis (ex: "Formulário simples, aceita PDF direto")
4. Clique em **Salvar**

### Como funciona na prática

Todo dia 1 do mês (ou no intervalo configurado), o sistema:

1. Abre o site da empresa
2. Detecta o formulário de candidatura
3. Preenche: nome, e-mail, telefone, mensagem de apresentação
4. Anexa seu currículo em PDF
5. Clica em "Enviar"
6. Tira screenshot como evidência
7. Registra no histórico
8. Envia e-mail de confirmação para você

### O que a empresa vê?

A empresa recebe uma candidatura normal, como se você tivesse feito manualmente. Não há nenhuma marca de "robô" ou "automação".

### Status das empresas fixas

- **Ativo** — envio recorrente ativo
- **Pausado** — você pausou os envios temporariamente
- **Respondeu** — a empresa respondeu (positiva ou negativamente), envios pararam automaticamente

### Pausar e reativar

- Clique no botão **"Pausar"** ao lado da empresa para pausar
- Clique em **"Ativar"** para retomar os envios
- Se a empresa responder, marque como **"Respondeu"** — o sistema para automaticamente

### Histórico por empresa

Cada empresa fixa mostra:

- **Total de envios** — quantas vezes seu currículo foi enviado
- **Último envio** — data do último envio
- **Próximo envio** — data prevista para o próximo

---

## 7. Meu Perfil e Configurações

### Dados pessoais

Em **Meu Perfil**, você pode editar a qualquer momento:

- Nome, e-mail, telefone, localização
- Cargo alvo
- URL do LinkedIn

### Atualizar currículo

- Clique em **"Upload do Currículo"**
- Selecione o novo PDF
- O arquivo anterior é substituído
- O PDF nunca fica exposto publicamente

### Palavras-chave

Em **Configurações**:

- **Adicionar** — digite a palavra e clique em "Adicionar"
- **Remover** — clique no "x" ao lado da palavra
- São usadas pelo sistema para calcular compatibilidade com vagas

### Cargos alvo

- Adicione os cargos que você busca
- Exemplos: "Desenvolvedor Frontend", "Desenvolvedor Full Stack", "Engenheiro de Software"
- O sistema prioriza vagas com esses títulos

### Localizações preferidas

- Adicione cidades ou modalidades
- Exemplos: "São Paulo", "Remoto", "Híbrido", "Rio de Janeiro"
- Vagas nessas localizações ganham score maior

### Frequência de varredura

- A cada 3 horas (busca mais frequente)
- A cada 6 horas (recomendado)
- A cada 12 horas
- Diariamente

### Candidatura automática

- **Ligado** — o sistema envia automaticamente para vagas com score ≥ 80%
- **Desligado** — você revisa e clica manualmente em "Candidatar-se"

---

## 8. Pausar e Retomar o Sistema

### Pausa global

Para **tudo** de uma vez:

1. Vá em **Configurações**
2. Clique em **"Pausar Sistema"**
3. Defina até quando (ex: até 01/02/2025)
4. Confirme

**Quando pausar globalmente:**

- Férias
- Mudança de cidade
- Processo seletivo em andamento em outra empresa
- Precisa focar em estudos

### Pausa por empresa

Para pausar **uma empresa específica**:

1. Vá em **Empresas Fixas**
2. Clique em **"Pausar"** ao lado da empresa
3. Os envios dessa empresa param, mas as outras continuam

**Quando pausar por empresa:**

- Você já se candidatou manualmente para essa empresa
- A empresa está em processo seletivo com você
- Você não quer mais trabalhar lá

### Retomar

- **Global**: vá em Configurações → "Retomar Sistema"
- **Por empresa**: clique em "Ativar" ao lado da empresa

---

## 9. Notificações por E-mail

### Quando você recebe e-mail

O sistema envia notificações em 4 situações:

1. **Vaga compatível encontrada**

   - "Encontramos 5 novas vagas compatíveis! Acesse o painel para verificar."
2. **Candidatura enviada com sucesso**

   - "Seu currículo foi enviado para Tech Corp para a vaga de Desenvolvedor Angular Sênior."
3. **Falha no envio**

   - "Falha ao enviar currículo para Empresa XYZ. Motivo: Captcha detectado."
4. **Envio recorrente realizado**

   - "Envio mensal realizado para Banco XYZ. Total de envios: 4."

### Como configurar

- O e-mail de destino é o que você cadastrou no perfil
- Para alterar, vá em **Meu Perfil** → edite o campo "E-mail"

---

## 10. Dicas e Boas Práticas

### Para começar

- Comece com a candidatura automática **DESLIGADA**
- Revise as vagas encontradas por alguns dias
- Confira se o score está fazendo sentido para você
- Só ative o auto-apply quando estiver confiante

### Para manter o sistema eficiente

- Mantenha o currículo PDF sempre atualizado
- Atualize as palavras-chave quando mudar de foco
- Revise o histórico semanalmente para acompanhar respostas

### Para empresas fixas

- Use empresas fixas apenas para empresas que você **realmente** quer trabalhar
- Não cadastre mais de 10 empresas fixas (evita ser marcado como spam)
- Marque como "Respondeu" quando a empresa entrar em contato

### Quando pausar

- Se muitos envios falharem com Captcha, pause e ajuste
- Se estiver em processo seletivo em outra empresa, pause globalmente
- Se mudar de cidade, pause e atualize as localizações

---

## 11. Limitações do Sistema

### Bloqueios de sites

- Sites com **Captcha avançado** (Google reCAPTCHA, Cloudflare) podem bloquear a automação
- O sistema registra o erro e você recebe notificação
- Nesses casos, tente se candidatar manualmente pelo link da vaga

### LinkedIn

- LinkedIn exige login para se candidatar
- O sistema faz scraping apenas de **vagas públicas** (sem login)
- Para candidaturas no LinkedIn, você precisa ir manualmente
- O sistema te avisa quando encontra vagas compatíveis

### Formulários complexos

- Algumas vagas do Gupy exigem **testes psicotécnicos** antes da candidatura
- Formulários muito customizados podem não ser detectados corretamente
- Sites com JavaScript pesado podem não renderizar os campos

### O que o sistema não faz

- Não garante entrevistas ou contratação
- Não substitui sua preparação para entrevistas
- Não faz ligação ou envia WhatsApp para recrutadores
- Não agenda reuniões ou entrevistas

---

## 12. Perguntas Frequentes (FAQ)

### O sistema armazena minha senha do LinkedIn/Gupy?

**NÃO.** O sistema nunca armazena credenciais de plataformas externas. Ele age como se fosse você navegando no browser, mas sem salvar senhas.

### Meu currículo fica exposto na internet?

**NÃO.** Seu currículo PDF fica armazenado no banco de dados do sistema, não em URL pública. Apenas o sistema tem acesso para anexar em formulários.

### Posso usar para mais de um perfil?

**Não no MVP.** O sistema foi projetado para uso pessoal (single-user). No futuro, pode ser expandido para múltiplos usuários.

### O que acontece se o site da empresa mudar?

O envio **falha** e você recebe uma notificação por e-mail com o motivo. Você pode atualizar a URL da empresa em **Empresas Fixas**.

### Posso cancelar uma candidatura já enviada?

**Não.** Uma vez enviada, a candidatura não pode ser cancelada. Porém, você pode **arquivar** no histórico para organizar.

### O sistema funciona 24/7?

**Sim.** O backend roda num servidor com processo persistente (VPS). O agendador funciona automaticamente, mesmo quando você não está com o navegador aberto.

### E se eu esquecer de pausar antes de viajar?

O sistema continua funcionando normalmente. Se quiser pausar remotamente, acesse o painel de qualquer dispositivo e clique em "Pausar Sistema".

### Quanto custa?

O uso pessoal é **gratuito**. Os custos são apenas de infraestrutura (servidor VPS, domínio). No futuro, se expandir para múltiplos usuários, pode haver planos pagos.

### Meus dados estão seguros?

**Sim.** Seguimos a LGPD (Lei Geral de Proteção de Dados):

- Dados ficam no banco de dados do sistema
- Nunca compartilhados com terceiros
- PDF do currículo nunca é exposto publicamente
- Logs de automação são apenas para auditoria

### O que fazer se o sistema parar de funcionar?

1. Verifique se o servidor está rodando (status do robô no dashboard)
2. Se estiver pausado, retome em Configurações
3. Se houver erro, verifique o histórico de candidaturas
4. Se persistir, reinicie o backend no servidor
