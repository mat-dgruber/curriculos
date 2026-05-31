# PRD — JobHunter (Assistente Automático de Candidaturas)

## 1. Overview

JobHunter é uma aplicação web de automação de candidaturas a vagas de emprego. O sistema combina varredura inteligente de vagas, matching por perfil e envio automatizado de currículos — eliminando o trabalho manual e repetitivo de quem está no mercado de trabalho.

O produto começa como ferramenta de uso pessoal (single-user), com arquitetura projetada para escalar para múltiplos usuários no futuro. Sucesso significa: o usuário para de entrar manualmente em dezenas de sites de vaga e passa a receber entrevistas com esforço zero de candidatura.

---

## 2. Problem Statement

Procurar emprego hoje é um processo manual, repetitivo e desgastante:

- O candidato precisa entrar em 5–10 plataformas diferentes (Gupy, LinkedIn, Vagas.com, InfoJobs, sites corporativos) todos os dias
- Cada empresa tem um formulário diferente, exigindo os mesmos dados preenchidos do zero
- Empresas com banco de talentos priorizam currículos recentes — quem não reenvia, some da fila
- Vagas surgem e somem rapidamente — quem não monitora ativamente, perde janelas de oportunidade

**Se o JobHunter não existir:** o candidato continua gastando horas por semana em tarefas repetitivas que poderiam ser delegadas a um robô, enquanto o tempo que deveria ser usado para se preparar para entrevistas é desperdiçado em burocracia digital.

---

## 3. Target Users

### Usuário Primário (MVP)
**O próprio desenvolvedor** — candidato ativo no mercado de TI, com perfil técnico (dev Angular/Python), buscando vagas remotas e híbridas em empresas de médio/grande porte. Tem conhecimento técnico, tolera configurações manuais iniciais, mas quer zero esforço no dia a dia após o setup.

### Usuário Futuro (escala)
- Profissionais de qualquer área que estão recolocando no mercado
- Recém-formados com pouca experiência em processos seletivos
- Pessoas em transição de carreira que precisam de volume alto de candidaturas

**Contexto de uso:** desktop (configuração do perfil), execução automatizada em background (sem interação do usuário).

---

## 4. What This App IS

- ✅ Uma interface de configuração de perfil profissional do candidato (dados pessoais, habilidades, áreas de interesse, cargo alvo)
- ✅ Um motor de varredura de vagas via scraping e APIs públicas de plataformas como LinkedIn, Gupy, Vagas.com e Indeed
- ✅ Um sistema de matching que filtra vagas por compatibilidade com o perfil cadastrado (cargo, área, localização, palavras-chave)
- ✅ Um painel de vagas encontradas com score de compatibilidade, status e histórico de candidatura
- ✅ Envio automatizado de currículo (PDF pré-cadastrado) via formulários web (automação com Playwright)
- ✅ Sistema de empresas fixas ("favoritas") com disparo mensal recorrente de currículo — mesmo currículo, mesma empresa, até haver resposta ou o usuário pausar
- ✅ Controle de status por candidatura: Enviado / Aguardando resposta / Respondido / Arquivado
- ✅ Agendamento de envios (cron jobs via APScheduler ou Celery)
- ✅ Notificações por e-mail quando uma vaga compatível é encontrada ou um envio é realizado
- ✅ Log completo de todas as ações automatizadas (auditoria)

---

## 5. What This App is NOT

- ❌ Não é um gerador de currículo — o PDF do currículo é cadastrado pelo usuário, não criado pela plataforma
- ❌ Não é um sistema de ATS (Applicant Tracking System) do lado das empresas
- ❌ Não garante que os envios serão aceitos — sites com Captcha avançado podem bloquear a automação
- ❌ Não é um portal de vagas como LinkedIn ou Gupy — não hospeda vagas, apenas as agrega
- ❌ Não possui chat, mensageria ou comunicação direta com recrutadores
- ❌ Não faz triagem de entrevistas nem agenda reuniões
- ❌ Não tem integração com WhatsApp ou Telegram (MVP)
- ❌ Não substitui a preparação do candidato para entrevistas
- ❌ Não cria variações personalizadas do currículo por vaga (MVP — envio do mesmo PDF para todas)

---

## 6. Core Features (MVP)

| Feature | Descrição | Prioridade |
|---|---|---|
| Perfil do candidato | Cadastro de dados pessoais, áreas de interesse, cargos alvo, palavras-chave e upload do currículo em PDF | P0 |
| Varredura de vagas | Scraping/API de LinkedIn, Gupy e Vagas.com com filtros por cargo e localização | P0 |
| Score de compatibilidade | Algoritmo simples de matching entre a vaga e o perfil (palavras-chave, cargo, área) | P0 |
| Painel de vagas | Lista de vagas encontradas com score, link original, status e data | P0 |
| Envio automatizado | Playwright preenche formulários e anexa o currículo PDF nos portais compatíveis | P0 |
| Empresas fixas (recorrente) | Lista de empresas com URL do formulário de candidatura + agendamento mensal de reenvio | P0 |
| Histórico de envios | Log de todos os envios com data, empresa, status HTTP e resultado | P0 |
| Notificação por e-mail | E-mail disparado quando vaga é encontrada ou envio é executado | P1 |
| Pausa/retomada | Pausar envios automáticos por período (férias, processo em andamento, etc.) | P1 |
| Painel de estatísticas | Total de vagas varridas, enviadas, taxa de resposta | P2 |

---

## 7. Success Metrics

**Primários:**
- Número de candidaturas enviadas automaticamente por semana (meta: > 10 sem intervenção manual)
- Número de entrevistas agendadas por mês

**Secundários:**
- Taxa de sucesso no envio automatizado (envios concluídos / tentativas — meta: > 70%)
- Cobertura de varredura: vagas novas detectadas por dia nas plataformas configuradas
- Taxa de resposta das empresas fixas (envios recorrentes que geraram retorno)

**Sinal de fracasso:**
- Sistema bloqueado por Captcha em > 50% das tentativas → rever estratégia de automação
- Envios caindo em spam → rever estratégia de e-mail

---

## 8. Constraints & Assumptions

**Técnicos:**
- Sites alvo podem implementar Captcha ou mudar sua estrutura HTML sem aviso — o scraper precisará de manutenção periódica
- Playwright roda localmente (ou em servidor VPS) — não é serverless
- O currículo em PDF deve ser fornecido pelo usuário; a plataforma não gera documentos
- Inicialmente sem autenticação robusta (uso pessoal) — preparada para adicionar auth multi-user no futuro

**Legais:**
- O uso de scraping em plataformas como LinkedIn pode violar seus Termos de Serviço — uso pessoal reduz o risco, mas deve ser documentado
- LGPD: dados pessoais do candidato ficam armazenados localmente ou em banco próprio — nunca compartilhados com terceiros além das plataformas de destino

**Tempo:**
- MVP funcional em 3 sprints de 15 dias (45 dias)
- Escopo deve ser mantido rígido — não adicionar novas plataformas de scraping no MVP sem concluir as definidas
