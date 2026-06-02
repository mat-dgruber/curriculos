# Visão Geral

O **Dashboard (Visão Geral)** é a central analítica da sua busca por emprego. Ele consolida em tempo real dados de todos os seus processos seletivos, exibindo gráficos de desempenho, taxas de conversão e estatísticas de retorno das empresas para dar a você visibilidade clara de onde seus esforços estão rendendo mais frutos.

## Pré-requisitos

Nenhum pré-requisito necessário. O painel é carregado automaticamente na inicialização do sistema, mas ficará muito mais rico em dados à medida que você cadastra candidaturas e qualifica vagas.

## Como Acessar

No menu lateral esquerdo da aplicação, clique no quarto ícone de baixo para cima (ícone de grade ou quatro quadradinhos) ou selecione **Visão Geral** no menu expandido.

## Componentes do Painel em Detalhes

### 1. Cards de Métricas Rápidas (KPIs)

No topo do painel, você encontra os principais números consolidados do seu funil:

- **Total de Vagas Encontradas**: O volume acumulado de vagas varridas pelo sistema que correspondem ao seu perfil técnico.
- **Candidaturas Ativas**: Quantidade de candidaturas com status _Pendente_ ou _Enviado_ no seu funil de processos seletivos.
- **Processos Concluídos / Arquivados**: O total de vagas que você já finalizou ou moveu para histórico.
- **Empresas com Retorno (🎉)**: O número mais importante! Quantas empresas retornaram seu contato ou agendaram entrevistas com você.

### 2. Painel do Robô e Próximos Envios

- **O que faz:** Exibe o status de saúde do robô de agendamento automático e indica em quanto tempo a próxima rodada automática será disparada em segundo plano.
- **Status comuns:**
  - 🟢 `Robô Ativo`: Indica que o serviço de agendamentos está monitorando silenciosamente as empresas fixas.
  - 🔴 `Pausado`: O motor de envios foi desativado temporariamente por você nas configurações globais.

### 3. Gráficos de Desempenho e Funil de Candidaturas

O dashboard conta com gráficos interativos que mostram:

- **Funil de Conversão (Gráfico de Rosca / Pizza)**: Exibe a proporção de candidaturas em cada coluna (Pendente vs Enviado vs Falhou vs Arquivado). Útil para entender onde estão os gargalos do seu processo.
- **Taxa de Sucesso da Automação**: Um indicador percentual das candidaturas de empresas fixas que foram concluídas com sucesso pelo robô contra as que falharam.

## Dúvidas Frequentes

**P: Os gráficos são atualizados automaticamente?**
R: Sim! Toda vez que você abre o dashboard ou altera o status de uma vaga em qualquer outra aba do sistema, os gráficos são recalculados em segundo plano para refletir seu status em tempo real.

**P: O que fazer se a "Taxa de Sucesso" da automação estiver baixa?**
R: Isso geralmente indica que as URLs de algumas empresas fixas mudaram ou que seu perfil está sem informações cruciais. Acesse a aba **Empresas Fixas**, filtre pelas vagas com status `Falhou`, clique em **Ver Print** para identificar a causa do erro e ajuste os dados no seu perfil.
