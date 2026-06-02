# Visão Geral

A tela **Meu Perfil** é o cérebro das suas candidaturas. É aqui que você centraliza todas as informações que o robô (Playwright) utilizará para preencher de forma autônoma e inteligente as vagas e formulários de envio de currículo. Manter estes dados sempre atualizados e completos é essencial para o sucesso das suas candidaturas.

## Pré-requisitos

> [!IMPORTANT]
> Tenha em mãos o seu currículo profissional atualizado em formato **PDF** no seu computador antes de preencher esta tela.

## Como Acessar

No menu lateral esquerdo, clique no ícone de perfil humano (o último ícone de baixo para cima) ou selecione a opção **Perfil** no menu de navegação.

## Seções de Informação em Detalhes

### 1. Dados Pessoais e de Contato

Esses são os dados mais básicos e críticos, que os recrutadores utilizam para entrar em contato com você:

- **Nome Completo**: Seu nome civil oficial, preenchido exatamente como deve aparecer no topo de qualquer candidatura.
- **E-mail Principal**: O e-mail no qual você receberá alertas de processos, convites para entrevistas e retornos das empresas.
- **Telefone / Celular**: Telefone com DDD (preferencialmente celular com WhatsApp ativo, que o robô tentará preencher nos formulários de contato).
- **Localização (Cidade/Estado/País)**: Sua base geográfica de residência, vital para vagas que pedem trabalho híbrido ou presencial.

### 2. Presença Digital e Links Profissionais

O robô preencherá de forma automatizada os campos que solicitam links de portfólio e redes profissionais comuns:

- **Link do LinkedIn**: A URL completa do seu perfil público no LinkedIn (deve começar com `https://linkedin.com/in/...`).
- **Link do GitHub**: Indispensável para desenvolvedores. O link do seu perfil público onde estão seus projetos e repositórios.
- **Portfólio Pessoal**: Seu site profissional, blog ou página onde reúne seus cases de sucesso.

### 3. Upload de Currículo em PDF 📄

- **O que faz:** Permite que você carregue o arquivo de currículo que o robô enviará e anexará a cada formulário de candidatura ou empresa fixa cadastrada.
- **Como usar:**
  1. Arraste seu arquivo PDF para a área de upload tracejada ou clique na área para selecionar o arquivo no seu computador.
  2. O sistema validará se é um arquivo do tipo `.pdf` válido.
  3. Após o upload, o sistema exibirá uma marcação de sucesso verde indicando que o currículo está pronto para ser enviado pelo robô.

> [!WARNING]
> **Atenção:** O robô de automação **ignora e pula** qualquer tentativa de envio automático se você não tiver feito o upload de um currículo em PDF nesta seção, pois as empresas exigem anexo de currículo como campo estritamente obrigatório de candidatura.

### 4. Competências e Palavras-Chave (AI Keyword Matching)

- **O que faz:** Um campo dinâmico onde você adiciona suas linguagens, frameworks, banco de dados e metodologias (ex: _Angular, Python, TypeScript, SQL, SCRUM_).
- **Como ajuda:** A inteligência artificial cruza essa lista de tags com as competências pedidas na descrição de cada vaga coletada para calcular a porcentagem de **Score (Compatibilidade)** e indicar as melhores correspondências de vaga na tela de Vagas.

## Dúvidas Frequentes

**P: Posso enviar currículo em formatos como Word (.docx) ou Imagem (.png)?**
R: Não. Para garantir a compatibilidade universal de leitura de dados pelos sistemas automatizados de captação das empresas (ATSs) e pelo nosso robô, o currículo deve ser carregado **exclusivamente em formato PDF (.pdf)**.

**P: Como atualizo meu currículo antigo?**
R: Basta acessar a tela de Perfil e fazer o upload de um novo arquivo PDF por cima. O novo arquivo substituirá o anterior instantaneamente para todas as próximas candidaturas enviadas.
