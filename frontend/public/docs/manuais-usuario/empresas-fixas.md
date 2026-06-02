# Visão Geral

A tela de **Empresas Fixas** é um painel de controle estratégico de candidaturas periódicas no JobHunter. Ela foi desenvolvida para automatizar o envio recorrente de seu currículo para empresas específicas (ex: bancos de talentos, páginas de carreiras, startups de interesse).

Em vez de preencher manualmente o mesmo formulário a cada 30 dias, o JobHunter gerencia uma fila cronológica e utiliza o motor de automação (Playwright) para se candidatar por você.

## Pré-requisitos e Preparação

> [!IMPORTANT]
> A automação baseia-se estritamente nas informações registradas no seu perfil. Antes de ativar qualquer empresa fixa:
>
> 1. Acesse a tela **Meu Perfil** no menu lateral.
> 2. Preencha todos os dados obrigatórios: Nome Completo, E-mail, Telefone, Link do LinkedIn e Portfólio.
> 3. Anexe seu currículo atualizado em formato **PDF**. Sem esse arquivo, qualquer tentativa do robô será interrompida por falta de anexo obrigatório.

## Como Acessar

No menu lateral esquerdo da aplicação, clique no ícone de prédio (o segundo ícone de baixo para cima) ou passe o mouse sobre o menu para expandi-lo e selecione a opção **Empresas**.

## Componentes em Detalhes

### 1. Cabeçalho de Ações Globais

- **Título "Empresas Fixas"**: Indica onde você está.
- **Botão de Ajuda (Interrogação ❓)**: Abre este painel deslizante que você está lendo agora.
- **Botão "+ Nova Empresa" / "Fechar"**: Abre o formulário de cadastro na parte superior da tela ou o oculta para expandir a lista de cards.

### 2. O Formulário de Cadastro e Edição

Ao clicar em "+ Nova Empresa", um painel de configuração detalhado é exibido. Os campos disponíveis são:

| Campo                             | Obrigatório | Tipo            | Descrição e Validações                                                                                                                                                       |
| --------------------------------- | ----------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nome da Empresa**               | Sim         | Texto / Seleção | O nome da empresa. Possui um sistema de autossugestão (`Famous Companies`) que sugere grandes empresas assim que você digita as primeiras letras.                            |
| **URL do Formulário / Carreiras** | Sim         | URL (Link)      | O link direto da página de envio de currículo da empresa (ex: link do portal Gupy, formulário Google Docs, Typeform, ou LinkedIn). Deve começar com `http://` ou `https://`. |
| **Intervalo de Reenvio (dias)**   | Sim         | Número          | O número de dias que o robô deve aguardar antes de realizar uma nova candidatura automática (mínimo: 7 dias; máximo: 90 dias; padrão recomendado: 30 dias).                  |
| **Notas e Anotações**             | Não         | Texto Longo     | Um espaço livre para você anotar particularidades da empresa, histórico de conversas ou observações importantes sobre a vaga.                                                |

### 3. Anatomia do Card de Empresa Fixa

Cada empresa cadastrada é representada por um card completo, repleto de informações e botões de ação:

```
+-------------------------------------------------------------+
| [Plataforma]  NOME DA EMPRESA          [Status]  [Toolbar]  |
| URL de Candidatura                                          |
| "Anotações e Observações..."                                |
|                                                             |
| Intervalo: XX dias  |  Enviados: X  |  Último: Há X dias     |
| Próximo envio: Em X dias                                    |
| ----------------------------------------------------------- |
| [Testar Robô 🤖]     [Ver Print 📸]     [Registrar Envio ✍️]  |
+-------------------------------------------------------------+
```

#### A. O Cabeçalho do Card

- **Nome da Empresa**: Título em destaque.
- **Badge de Plataforma**: Identifica automaticamente qual é a plataforma de candidatura com base na URL fornecida (ex: `Gupy`, `LinkedIn`, `Compleo`, `Solides` ou `Outros`).
- **Chip de Status**:
  - `Pendente`: A candidatura está aguardando o cronograma de envio.
  - `Enviado`: O currículo foi enviado com sucesso na última rodada.
  - `Falhou`: Ocorreu algum erro na última execução do robô.
  - `Respondeu` (🎉): **Status Especial!** Indica que a empresa retornou seu contato.
- **Mini-Toolbar de Gerenciamento (Topo Direito)**:
  - ⏸️/▶️ **Pausar/Ativar**: Permite paralisar temporariamente os envios automáticos agendados para esta empresa sem precisar excluí-la.
  - ✏️ **Editar**: Abre o formulário preenchido com as informações atuais para você fazer correções e salvar.
  - 🗑️ **Remover**: Exclui definitivamente a empresa do seu painel e limpa o histórico de envios associados.

### 4. Ações de Envio e Automação (Menu Inferior do Card)

#### 🤖 Botão "Testar Robô" (Automação Ativa)

- **O que faz:** Dispara em tempo real o motor do robô (Playwright) em nossos servidores. O robô simula o comportamento humano: abre o navegador, navega até a URL da empresa, preenche seus dados do perfil e anexa o currículo em PDF.
- **Quando usar:** Para verificar se o formulário continua funcionando corretamente ou forçar o envio do seu currículo imediatamente sem esperar o agendamento de 30 dias.
- **Comportamento de Execução:** O botão exibirá um indicador de carregamento (_"Testando..."_). Você pode continuar usando outras partes do sistema normalmente enquanto ele executa.

#### 📸 Botão "Ver Print" (Visualizador de Logs Visuais)

- **O que faz:** Abre um visualizador de imagem contendo a captura de tela da última tentativa de envio feita pelo robô.
- **Como ajuda:** Se o status estiver como `Falhou`, clique em **Ver Print**. O robô tira uma foto do navegador no exato momento da falha. Você poderá ver se o formulário mudou de layout, se apareceu alguma pergunta nova obrigatória, ou se exigiu um Captcha humano.

#### ✍️ Botão "Registrar Envio" (Marcação Manual)

- **O que faz:** Informa ao JobHunter que você realizou a candidatura para esta empresa manualmente diretamente no seu navegador. Ele **não dispara o robô**.
- **Como calcula:** O sistema atualiza o campo _"Último Envio"_ para a data de hoje e recalcula o _"Próximo Envio"_ somando o número de dias do intervalo configurado. Isso evita que o robô tente um envio automático em cima da candidatura manual que você acabou de fazer.

## O Status Especial "Respondeu"

Quando uma empresa entra em contato com você por e-mail ou telefone e você atualiza o status dela para **"Respondeu"**:

- A borda do card fica iluminada em **âmbar (dourado)** para fácil identificação.
- Um badge decorativo _"🎉 Retorno!"_ é exibido no topo.
- **Bloqueio de Automação:** Todos os envios automáticos e botões de disparo de robô são **desativados**. Isso é uma medida de segurança para evitar que o robô reenvie seu currículo de forma inoportuna enquanto você está em processo de entrevista ativa com aquela empresa.

## Fluxo de Uso Recomendado

1.  **Configure o Perfil**: Certifique-se de ter anexado seu currículo em PDF e completado seus dados na tela de Perfil.
2.  **Cadastre a Empresa**: Use o botão "+ Nova Empresa" e insira a URL da vaga ou do banco de talentos da empresa.
3.  **Faça o Teste de Validação**: Clique em **"Testar Robô"**.
    - _Se der certo_: O status mudará para `Enviado`. O robô funcionou!
    - _Se falhar_: O status mudará para `Falhou`. Clique em **"Ver Print"** para ver a causa do erro. Se for uma pergunta extra, complete no formulário original e use o botão **"Registrar Envio"** para marcar o envio feito.
4.  **Monitore as Próximas Datas**: A partir de agora, o sistema controlará o reenvio periódico sozinho de forma silenciosa de acordo com o intervalo escolhido.

## Dúvidas Frequentes

**P: Por que o botão "Testar Robô" está cinza/desativado?**
R: Isso pode ocorrer por três razões:

1. A empresa está pausada (clique no botão ▶️ no topo direito do card para ativá-la).
2. O status está marcado como "Respondeu" (indicando processo em andamento).
3. O robô já está processando uma ação para este card no momento.

**P: O robô resolve desafios de lógica ou testes comportamentais automaticamente?**
R: Não. O robô realiza o preenchimento de campos cadastrais comuns (Nome, E-mail, LinkedIn, etc.) e o anexo do currículo. Testes de personalidade ou raciocínio lógico exigem sua interação manual direta no link original da empresa.
