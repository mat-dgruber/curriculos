# Manual — Gestão de Empresas Fixas

## Visão Geral
A tela de **Empresas Fixas** permite que você cadastre e gerencie empresas específicas nas quais deseja manter seu currículo sempre atualizado. O sistema agenda e dispara envios automáticos recorrentes, garantindo que seu perfil seja enviado periodicamente sem que você precise preencher formulários manualmente toda vez.

---

## Pré-requisitos
> [!IMPORTANT]
> Para que os disparos automáticos funcionem com sucesso, é obrigatório preencher suas informações de contato e anexar seu currículo atualizado em formato PDF na aba **Meu Perfil**.

---

## Como Acessar
No menu lateral esquerdo do sistema, clique no ícone de prédio (segundo ícone de baixo para cima) ou selecione a opção **Empresas** no menu de navegação.

---

## Funcionalidades Disponíveis

### 1. Cadastrar e Editar Empresas
**O que faz:** Permite registrar um novo link de candidatura ou editar as configurações de uma empresa existente (como o intervalo de dias para reenvio).

**Como usar:**
1. Clique no botão **"Adicionar Empresa"** no topo da tela.
2. Preencha o formulário com o nome da empresa, o link direto do formulário de candidatura (ex: Gupy, LinkedIn ou formulário próprio) e o intervalo de reenvio desejado.
3. Clique em **"Salvar"**.

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| Nome da Empresa | Sim | Nome identificador da empresa (ex: Google, Nubank). |
| URL de Candidatura | Sim | Link direto do formulário onde o currículo deve ser enviado. |
| Intervalo (Dias) | Sim | A cada quantos dias o robô deve reenviar o currículo (padrão: 30 dias). |
| Observações | Não | Anotações pessoais sobre a vaga ou a empresa. |

---

### 2. Disparos Automáticos e Teste do Robô
Esta tela dispõe de dois botões fundamentais para o fluxo de candidatura automática:

#### A. Testar Robô (Automação Ativa 🤖)
* **O que faz:** Dispara imediatamente o motor de automação (Playwright) em segundo plano. O robô abrirá o link da empresa no navegador, preencherá seus dados cadastrais, anexará seu currículo em PDF e enviará a candidatura.
* **Quando usar:** Sempre que quiser verificar se o formulário da empresa continua compatível com a nossa automação ou forçar um envio imediato.

#### B. Registrar Envio (Marcação Manual ✍️)
* **O que faz:** Registra no sistema que você realizou a candidatura por conta própria (manualmente) hoje. Ele **não** aciona o robô.
* **Quando usar:** Se você mesmo abriu o link da vaga e preencheu o formulário manualmente no seu navegador. Isso atualiza o cronograma da empresa para que o robô aguarde mais 30 dias antes do próximo envio automático.

---

### 3. Acompanhamento e Prints de Erro 📸
**O que faz:** Exibe a captura de tela do último envio realizado pelo robô.

**Como usar:**
1. Se um envio automático falhar ou você quiser auditar a última tentativa, localize o botão **"Ver Print"** no card da empresa.
2. Um modal será aberto exibindo a foto exata do navegador no momento da última ação do robô.
3. Isso permite que você identifique rapidamente se o site da empresa mudou o layout ou se o formulário passou a exigir alguma informação extra.

---

## Fluxo de Uso Recomendado
1. **Configure seu Perfil:** Certifique-se de que seu nome, e-mail e currículo em PDF estão atualizados na tela **Meu Perfil**.
2. **Cadastre a Empresa:** Adicione a empresa com a URL do formulário de talentos.
3. **Faça o Primeiro Envio:** Clique em **"Testar Robô"** para garantir que a primeira candidatura foi enviada com sucesso.
4. **Deixe no Automático:** O sistema calculará a data de reenvio automaticamente com base no intervalo escolhido. Acompanhe o status e as datas no próprio card.

---

## Dúvidas Frequentes

**P: Por que o botão "Testar Robô" está desativado?**
R: O botão fica desativado se a empresa estiver pausada, se o robô já estiver executando um teste no momento, ou se o status da empresa for "Respondeu" (quando o processo avança para entrevista).

**P: O que significa o status "Respondeu" nos cards?**
R: Significa que a empresa entrou em contato com você! Quando este status é ativo, a automação de reenvio é pausada automaticamente para não gerar envios duplicados enquanto você conversa com os recrutadores.
