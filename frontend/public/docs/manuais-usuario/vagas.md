# Visão Geral

A tela de **Oportunidades de Vagas** é o núcleo de pesquisa, triagem e qualificação de vagas de emprego do JobHunter. O sistema coleta de forma consolidada e inteligente oportunidades de diversas fontes (como o LinkedIn) que correspondem às suas tecnologias-chave.

A inteligência artificial avalia os requisitos de cada vaga, dando a você uma visão imediata e classificada das melhores vagas do mercado sem que você precise abrir dezenas de abas no seu navegador.

## Pré-requisitos

Nenhum pré-requisito técnico é exigido para navegar ou filtrar as vagas da lista. No entanto, para que a inteligência artificial calcule as notas de compatibilidade (**Score**) com precisão, é recomendável manter a aba **Meu Perfil** preenchida com as suas competências técnicas e experiências reais.

## Como Acessar

No menu lateral esquerdo da aplicação, clique no ícone de maleta (o primeiro ícone de baixo para cima) ou passe o mouse sobre o menu expandido e selecione **Vagas**.

## Componentes e Barra de Ferramentas (Filters)

No topo da tela de vagas, há uma barra de filtros robusta e responsiva. Ela é vital para filtrar o ruído e focar apenas nas vagas ideias.

```
+-----------------------------------------------------------------------------------------------+
| [ Campo de Busca 🔍 ]  [ Plataforma ▾ ]  [ Status ▾ ]  [ Score Mínimo ▾ ]  [ Modelo de Trabalho ▾ ] |
+-----------------------------------------------------------------------------------------------+
```

### 1. Campo de Busca Dinâmico (Busca por Texto)

- **O que faz:** Filtra em tempo real as vagas contendo o termo digitado no título da vaga, no nome da empresa ou no conteúdo da descrição. A lista é atualizada instantaneamente conforme você digita.

### 2. Filtro de Plataforma (Origem da Vaga)

- **O que faz:** Permite que você visualize apenas vagas provenientes de um portal de captação específico.
- **Opções:** `Todas as plataformas`, `LinkedIn`, `Gupy`, `Vagas.com`, `Outros`.

### 3. Filtro de Status

- **O que faz:** Organiza as vagas de acordo com a sua etapa de análise ou ação atual.
- **Opções:**
  - `Novo`: Vagas recém-coletadas que você ainda não abriu ou avaliou.
  - `Visualizada`: Vagas cujos detalhes você já abriu para ler.
  - `Candidatou`: Vagas nas quais você clicou no botão "Candidatar-se".

### 4. Filtro por Score Mínimo (IA Match)

- **O que faz:** Oculta vagas que tenham compatibilidade com seu perfil abaixo do valor escolhido, ideal para eliminar oportunidades fora do seu nível de senioridade ou foco tecnológico.
- **Opções:** `Todos os scores`, `Acima de 50%`, `Acima de 70%`, `Acima de 85% (Alta Compatibilidade)`.

### 5. Filtro de Modelo de Trabalho

- **O que faz:** Filtra vagas de acordo com a modalidade presencial configurada pelos recrutadores.
- **Opções:** `Todos os modelos`, `Remoto`, `Híbrido`, `Presencial`.

## Entendendo o AI Score (Match de Compatibilidade)

O **Score** é um indicador percentual dinâmico calculado por algoritmos de Processamento de Linguagem Natural (PLN):

- 🟢 **Score Verde (75% a 100%)**: Altíssima afinidade. Indica que a vaga pede as tecnologias principais que você possui, no seu nível de experiência e formato de trabalho desejado.
- 🟡 **Score Âmbar/Amarelo (50% a 74%)**: Média afinidade. A vaga compartilha de algumas tecnologias suas, mas pode exigir um framework extra ou ter requisitos adicionais.
- 🔴 **Score Vermelho (Abaixo de 50%)**: Baixa afinidade. Geralmente indica incompatibilidade de senioridade ou tecnologias completamente distintas do seu foco atual.

## Ações de Qualificação e Triagem (Exclusão & Auto-Delete)

A gestão de vagas do JobHunter foi projetada para evitar poluição visual. Você dispõe de 3 ações fundamentais no painel de controle inferior de cada vaga:

### 1. ✉️ O Botão "Candidatar-se" (Seu ATS Pessoal)

- **O que faz:** Cria instantaneamente um card com status de `Pendente` na sua aba de **Candidaturas** e altera o status da vaga na lista para **"Candidatou"** (marcando-a visualmente com um check).
- **Nota Importante:** Essa vaga **não aciona o robô automático**, pois formulários avulsos de portais externos exigem respostas personalizadas. Use o botão **"Abrir vaga original"** do painel para finalizar a inscrição manualmente no site de origem.

### 2. ❤️ Favoritar / Desfavoritar

- **O que faz:** Destaca as vagas mais importantes. Vagas favoritadas ganham uma iluminação decorativa e podem ser priorizadas na sua análise diária.

### 3. 🗑️ Botão "Excluir" (O Sistema Inteligente de Rejeição e Auto-Delete)

Para limpar vagas que não interessam, o sistema possui um motor robusto de **rejeição com feedbacks**:

#### A. O Modal de Exclusão (Feedback para a IA)

Ao clicar no ícone de lixeira em uma vaga individual, ou ao marcar as caixas de seleção (checkboxes) de várias vagas na lista e clicar em **"Excluir Selecionadas" (Exclusão em Lote/Batch Rejection)**, o sistema abre o **Modal de Confirmação de Exclusão**:

- **Campos de Motivo da Rejeição:**
  - _Incompatível com perfil_: Tecnologias ou requisitos fora do seu escopo.
  - _Empresa não interessa_: Avaliação ruim da cultura ou reputação da empresa.
  - _Sem trabalho remoto_: A vaga exige presencial e você quer remoto.
  - _Salário abaixo do esperado_: Remuneração incompatível com suas metas.
  - _Localização incompatível_: Híbrido/Presencial muito distante da sua casa.
  - _Outro_: Um motivo livre.
- **Notas Opcionais:** Campo livre para descrever por que está descartando a vaga.

#### B. Como o "Auto-Delete" de Vagas Funciona:

- Assim que você confirma a exclusão com o motivo, o JobHunter realiza o **auto-delete visual**: as vagas são removidas permanentemente da sua lista ativa de oportunidades de forma imediata.
- Esses dados de rejeição são armazenados no banco para **aprimorar o algoritmo de captação**, ensinando o sistema a não coletar ou sugerir vagas semelhantes para você nas próximas varreduras de mercado!

## Fluxo de Uso Recomendado (Seu Funil Diário de Vagas)

1.  **Ajuste os Filtros Iniciais**: Defina o filtro de _Modelo de Trabalho_ (ex: Remoto) e _Score Mínimo_ (ex: Acima de 70%) para começar o dia apenas com o que interessa.
2.  **Leia os Detalhes**: Clique nas vagas da lista esquerda e leia a descrição formatada com o nosso expansor inteligente.
3.  **Tome uma Decisão Rápida**:
    - _Gostou muito?_ Clique em ❤️ **Favoritar**.
    - _Quer se candidatar?_ Clique em ✉️ **Candidatar-se**, abra a vaga original e conclua a inscrição.
    - _Não serve para você?_ Clique em 🗑️ **Excluir**, escolha o motivo real (ex: Salário baixo) e confirme. A vaga sumirá na hora, limpando sua tela para a próxima oportunidade!
