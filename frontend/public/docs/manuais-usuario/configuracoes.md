# Visão Geral

A tela de **Configurações** permite ajustar as regras operacionais da plataforma. É aqui que você gerencia as palavras-chave que determinam a coleta automática de vagas, calibra os tempos do robô de navegação e ajusta a aparência visual do sistema (incluindo o suporte nativo a temas).

## Pré-requisitos

Nenhum pré-requisito necessário. Esta tela está disponível para qualquer usuário cadastrado no JobHunter.

## Como Acessar

No menu lateral esquerdo, clique no ícone de engrenagem (o quinto ícone de baixo para cima) ou selecione a opção **Configurações** no menu de navegação.

## Seções de Configuração em Detalhes

### 1. Painel de Palavras-Chave de Busca (Filtros de Coleta)

Essas palavras-chave são a bússola do sistema. São elas que dizem ao JobHunter quais vagas pesquisar nos portais externos:

- **Palavras-Chave de Interesse**: As linguagens, frameworks ou cargos que você busca (ex: _Angular, React, Frontend, Desenvolvedor Python_). O buscador usará esses termos para rastrear novas vagas diariamente.
- **Termos de Exclusão (Blacklist)**: Palavras que indicam que a vaga **não** serve para você (ex: _Java, Presencial, Estágio_). Vagas que contiverem essas palavras serão automaticamente filtradas e descartadas na captação, limpando sua tela de oportunidades.

### 2. Parâmetros de Automação do Robô (Playwright Runner)

Permite que você calibre a velocidade e o comportamento dos navegadores automáticos que realizam seus envios:

- **Modo Headless (Sem Cabeça)**:
  - _Ativo_: O robô roda silenciosamente em segundo plano nos servidores (padrão recomendado).
  - _Inativo (Debug)_: Se você estivesse rodando localmente, veria a janela do navegador abrir e fazer os cliques na sua frente.
- **Delay entre Ações (Slow Mo)**: O intervalo de tempo em milissegundos que o robô aguarda entre cada clique ou digitação (ex: _100ms_). Isso é essencial para que o robô pareça mais humano e evite ser bloqueado pelos sistemas antifraude das empresas.

### 3. Aparência e Seleção de Temas 🎨

O JobHunter é totalmente compatível com temas dinâmicos que se adaptam perfeitamente a qualquer preferência de design:

- **Tema Escuro (Dark Mode)**: Visual moderno com tons azulados escuros e roxo, reduzindo o cansaço visual em ambientes de pouca luz.
- **Tema Claro (Light Mode)**: Visual limpo com tons pastéis, cremes e alta legibilidade em ambientes bem iluminados.
- **Tema Capycro (Tema Especial 🐾)**: Um tema alternativo super carismático, inspirado em capivaras e tons terrosos orgânicos.

## Dúvidas Frequentes

**P: Quanto tempo demora para o sistema trazer novas vagas após eu mudar minhas palavras-chave?**
R: A alteração das palavras-chave é aplicada imediatamente nas próximas varreduras de vagas. O robô rodará a pesquisa programada ao longo do dia, e as novas oportunidades começarão a aparecer na aba correspondente em poucos minutos.

**P: Posso desativar temporariamente todos os envios automáticos?**
R: Sim! Há uma opção global de "Status da Automação" nas configurações. Ao desligá-la, todos os agendamentos automáticos de empresas fixas são pausados globalmente até que você decida reativar o motor.
