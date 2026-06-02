# Novas Funcionalidades — JobHunter

> Documentação detalhada de todas as funcionalidades planejadas para evolução do sistema.
>
> Atualizado: 2026-05-31

---

## 1. Sistema B2B: Empresas Publicando Vagas

### Descrição
Transformar o JobHunter de ferramenta pessoal em plataforma bidirecional onde empresas publicam vagas e candidatos se candidatam diretamente.

### Fluxo de Uso
1. Empresa acessa `/company/register` e cria conta (CNPJ, email, senha)
2. Preenche perfil empresarial (nome, setor, tamanho, site, logo)
3. Acessa dashboard empresarial
4. Cria vaga: título, descrição, requisitos, salário, localização, tipo
5. Vaga fica visível na busca pública
6. Candidato encontra vaga → se candidata
7. Empresa recebe notificação → avalia candidatura

### Modelos de Dados

```
CompanyUser (extensão de User)
├── id: UUID
├── user_id: FK → User
├── cnpj: String(14)
├── company_name: String(255)
├── sector: String(100)
├── size: String(50)          # "1-10", "11-50", "51-200", "201-500", "500+"
├── website: String(512)
├── logo_url: String(512)
├── description: Text
├── verified: Boolean
├── created_at: DateTime
└── updated_at: DateTime

JobPosting (extensão do Job existente)
├── id: UUID
├── company_user_id: FK → CompanyUser
├── title: String(255)
├── description: Text
├── requirements: Text
├── salary_min: Integer
├── salary_max: Integer
├── salary_currency: String(3)   # BRL, USD
├── location: String(255)
├── remote: Boolean
├── type: String(20)             # CLT, PJ, Estágio, Temporário, Freela
├── status: String(20)           # Aberta, Pausada, Encerrada
├── expires_at: DateTime
├── views_count: Integer
├── applications_count: Integer
├── created_at: DateTime
└── updated_at: DateTime
```

### Endpoints de API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/v1/auth/company/register` | Registro de empresa |
| POST | `/api/v1/auth/company/login` | Login empresa |
| GET | `/api/v1/company/profile` | Perfil da empresa |
| PUT | `/api/v1/company/profile` | Atualizar perfil |
| GET | `/api/v1/company/jobs` | Vagas da empresa |
| POST | `/api/v1/company/jobs` | Criar vaga |
| PUT | `/api/v1/company/jobs/{id}` | Editar vaga |
| DELETE | `/api/v1/company/jobs/{id}` | Excluir vaga |
| PUT | `/api/v1/company/jobs/{id}/status` | Alterar status da vaga |
| GET | `/api/v1/company/applications` | Candidaturas recebidas |
| PUT | `/api/v1/company/applications/{id}` | Avaliar candidatura |

### Componentes Angular

- `CompanyRegisterComponent` — Formulário de registro
- `CompanyLoginComponent` — Login empresa
- `CompanyDashboardComponent` — Painel principal
- `CompanyJobFormComponent` — Criar/editar vaga
- `CompanyApplicationsComponent` — Lista de candidaturas recebidas
- `CompanyProfileComponent` — Perfil da empresa

### Esforço Estimado: 10-12 dias

### Dependências
- Sistema de autenticação (item 3)
- Modelos de dados estendidos

---

## 2. Busca Pública de Vagas

### Descrição
Página pública onde qualquer pessoa pode buscar vagas sem precisar criar conta. SEO-friendly para atrair tráfego orgânico.

### Fluxo de Uso
1. Usuário acessa `/jobs` (pública)
2. Digita cargo, localização ou empresa
3. Aplica filtros (salário, tipo, remoto)
4. Vê lista de vagas com score de compatibilidade (se logado)
5. Clica em vaga → vê detalhes completos
6. Clica "Candidatar-se" → redireciona para login/cadastro
7. Candidatura registrada

### Filtros Disponíveis
- Cargo / palavras-chave na título
- Localização (cidade, estado, "Remoto")
- Faixa salarial (mínimo/máximo)
- Tipo de contrato (CLT, PJ, Estágio)
- Data de publicação (últimas 24h, 7 dias, 30 dias)
- Empresa específica
- Plataforma de origem

### SEO
- Meta tags por vaga (title, description, og:image)
- Structured data (JobPosting schema.org)
- Sitemap dinâmico
- URLs amigáveis (`/jobs/desenvolvedor-angular-sao-paulo`)

### Componentes Angular

- `JobSearchComponent` — Página pública de busca
- `JobSearchFiltersComponent` — Sidebar de filtros
- `JobSearchResultsComponent` — Lista de resultados
- `JobPublicDetailComponent` — Detalhe da vaga (público)
- `JobApplyDialogComponent` — Modal de candidatura

### Esforço Estimado: 5-7 dias

### Dependências
- Autenticação (para candidatar-se)
- Modelos de JobPosting estendidos

---

## 3. Autenticação Multiusuário

### Descrição
Firebase Authentication com dois tipos de conta: Candidato e Empresa. JWT para API. Guards no Angular.

### Fluxo de Uso
1. Usuário acessa `/login`
2. Escolhe: "Sou Candidato" ou "Sou Empresa"
3. Login com email/senha ou Google
4. JWT salvo no localStorage
5. Interceptor envia token em cada request
6. Route guards verificam permissão

### Firebase Auth Config

```typescript
// frontend/src/app/core/auth/auth.config.ts
export const authConfig = {
  providers: [
    GoogleAuthProvider,
    EmailAuthProvider,
  ],
  requireEmailVerification: true,
}
```

### Angular Guards

```typescript
// auth.guard.ts
canActivate() {
  if (!this.authService.isAuthenticated()) {
    this.router.navigate(['/login']);
    return false;
  }
  return true;
}

// role.guard.ts
canActivate() {
  const role = this.authService.getRole();
  if (role !== expectedRole) {
    this.router.navigate(['/unauthorized']);
    return false;
  }
  return true;
}
```

### Modelos de Dados

```
User
├── id: UUID (Firebase UID)
├── email: String(255)
├── display_name: String(255)
├── role: String(20)         # "candidate", "company"
├── is_active: Boolean
├── created_at: DateTime
└── updated_at: DateTime
```

### Endpoints de API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/v1/auth/register` | Registro candidato |
| POST | `/api/v1/auth/login` | Login (retorna JWT) |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/auth/me` | Usuário atual |
| POST | `/api/v1/auth/forgot-password` | Recuperar senha |
| POST | `/api/v1/auth/reset-password` | Resetar senha |

### Esforço Estimado: 5-7 dias

### Dependências
- Nenhuma (pode ser implementado primeiro)

---

## 4. Notificações Inteligentes

### Descrição
Sistema multi-canal de notificações: email, push, in-app, webhook. Configurável por usuário.

### Canais

| Canal | Implementação | Status |
|-------|--------------|--------|
| Email | SMTP (notification_service.py) | Parcial ✅ |
| Push | Web Push API (PWA) | Pendente |
| In-app | Centro de notificações | Pendente |
| Webhook | HTTP POST para URL | Pendente |

### Tipos de Notificação

| Evento | Email | Push | In-app |
|--------|-------|------|--------|
| Nova vaga encontrada | ✅ | ✅ | ✅ |
| Candidatura enviada | ✅ | ✅ | ✅ |
| Empresa respondeu | ✅ | ✅ | ✅ |
| Scan concluído | ✅ | ✅ | ✅ |
| Erro no scan | ✅ | ✅ | ✅ |
| Relatório mensal | ✅ | ❌ | ✅ |

### Modelos de Dados

```
Notification
├── id: UUID
├── user_id: FK → User
├── type: String(50)
├── title: String(255)
├── message: Text
├── channel: String(20)       # email, push, in_app
├── read: Boolean
├── data: JSON                # payload adicional
├── sent_at: DateTime
└── read_at: DateTime
```

### Componentes Angular

- `NotificationCenterComponent` — Painel de notificações
- `NotificationBellComponent` — Badge no header
- `NotificationPreferencesComponent` — Configurações

### Esforço Estimado: 4-5 dias

### Dependências
- Autenticação (para associar a usuário)

---

## 5. IA e Automação Avançada

### Descrição
Integração com LLMs para análise semântica, geração de textos e insights de mercado.

### 5.1 Matching com LLM

**Por quê:** O scoring atual usa keywords. LLM pode entender contexto, sinônimos e fit cultural.

**Fluxo:**
1. Vaga chega com descrição e requisitos
2. Perfil do candidato é comparado via LLM
3. LLM retorna score 0-100 + justificativa
4. Score é salvo junto com a vaga

**Prompt sugerido:**
```
Analise a compatibilidade entre este perfil profissional e esta vaga.
Retorne um score de 0-100 e uma justificativa breve.

Perfil: {profile}
Vaga: {job}
```

**Custo estimado:** $0.01-0.05 por análise (GPT-4o-mini ou Claude Haiku)

### 5.2 Cover Letter Automática

**Fluxo:**
1. Candidato quer se candidatar
2. LLM gera carta personalizada com base em: perfil + vaga + empresa
3. Candidato revisa e edita
4. Envia junto com candidatura

### 5.3 Análise de Mercado

**Dados coletados:**
- Salário médio por cargo e cidade
- Quantidade de vagas por setor
- Tendências de hiring (crescendo/estável/declínio)
- Empresas que mais contratam

### 5.4 Resumo de Vagas

Vagas longas (>2000 chars) recebem resumo automático de 3-5 bullet points.

### Esforço Estimado: 8-10 dias

### Dependências
- Matching básico funcionando
- Perfil completo do candidato

---

## 6. Analytics e Relatórios

### Descrição
Dashboard com gráficos de desempenho da busca por emprego.

### Métricas

| Métrica | Fonte | Visualização |
|---------|-------|-------------|
| Candidaturas/semana | applications | Gráfico de barras |
| Taxa de resposta | applications.status | Gauge/percentual |
| Score médio por plataforma | jobs.score, jobs.platform | Gráfico de pizza |
| Tempo médio de resposta | applications.sent_at vs updated_at | Timeline |
| Top empresas que responderam | applications WHERE status=Enviado | Ranking |

### Componentes Angular

- `AnalyticsDashboardComponent` — Painel com gráficos
- `ChartBarComponent` — Gráfico de barras
- `ChartPieComponent` — Gráfico de pizza
- `ChartLineComponent` — Gráfico de linha
- `ReportExportComponent` — Export PDF/CSV

### Relatório Mensal (Email)

```
📊 Relatório Mensal JobHunter — Maio 2026

🔍 47 vagas encontradas (↑15% vs mês anterior)
📝 12 candidaturas enviadas
📧 3 respostas recebidas
⭐ Score médio: 72/100

Top plataformas:
1. Gupy — 22 vagas
2. LinkedIn — 15 vagas
3. Vagas.com — 10 vagas

Recomendação: Adicione mais palavras-chave para aumentar o score médio.
```

### Esforço Estimado: 5-7 dias

### Dependências
- Dados suficientes (1+ mês de uso)

---

## 7. PWA e Mobile

### Descrição
Progressive Web App com suporte offline e push notifications.

### Funcionalidades

- **Service Worker:** Cache de páginas visitadas
- **Push Notifications:** Vagas novas direto no celular
- **Manifest:** Ícone e splash screen
- **Responsivo:** Layout mobile-first
- **Touch:** Swipe para navegar entre vagas

### Configuração Angular PWA

```bash
ng add @angular/pwa
```

### Esforço Estimado: 3-4 dias

### Dependências
- Nenhuma

---

## 8. Gamificação

### Descrição
Sistema de conquistas para manter o candidato engajado.

### Conquistas

| Conquista | Descrição | Badge |
|-----------|-----------|-------|
| Primeiro Passo | Criou perfil completo | 🎯 |
| Caçador | 100 vagas analisadas | 🔍 |
| Atirador | 50 candidaturas enviadas | 🎯 |
| Popular | 10 respostas recebidas | ⭐ |
| Estrela | Score médio > 80 | 💎 |
| Streak | 7 dias seguidos candidatando | 🔥 |
| Premium | Assinante Pro | 👑 |

### Esforço Estimado: 3-4 dias

---

## 9. Integrações

### Google Calendar
- Criar evento quando entrevista agendada
- Sync com perfil do Google

### Slack/Discord
- Bot envia resumo diário
- Notificações em canal específico

### Zapier/IFTTT
- Webhooks para automações customizáveis
- "Quando vaga nova → postar no LinkedIn"

### Esforço Estimado: 4-5 dias

---

## 10. Segurança e Compliance (LGPD)

### Funcionalidades

| Item | Descrição | Prioridade |
|------|-----------|------------|
| Consentimento | Termos de uso + política de privacidade | Alta |
| Portabilidade | Export todos os dados em JSON/CSV | Alta |
| Exclusão | "Direito ao esquecimento" — delete completo | Alta |
| Rate Limiting | Máximo de requests por usuário | Média |
| Audit Logs | Histórico de ações sensíveis | Média |
| 2FA | Autenticação de dois fatores | Baixa |
| Criptografia | Dados sensíveis em repouso | Baixa |

### Esforço Estimado: 5-7 dias

---

## 11. Gerador de Currículos por IA

### Descrição
Um assistente inteligente que ajuda o candidato a construir o currículo perfeito. O usuário responde a um questionário simplificado e interativo, a IA destila, otimiza e converte as respostas em informações altamente profissionais e atraentes para o mercado (enfatizando conquistas, métricas e verbos de ação), formatando o resultado final em um documento PDF moderno, elegante e otimizado para sistemas de triagem ATS (Applicant Tracking Systems).

### Fluxo de Uso
1. O usuário acessa `/profile/resume-builder` e inicia o assistente.
2. Responde a perguntas simplificadas e guiadas (ex: "Qual foi sua maior conquista técnica na empresa X?" ou "De que forma você reduziu custos/tempo lá?").
3. A IA (via LLM) analisa e filtra as respostas brutas do usuário, removendo redundâncias, adicionando tom corporativo refinado e reescrevendo descrições com verbos de ação fortes.
4. O usuário revisa o rascunho gerado (Perfil Profissional, Experiências, Formação, Habilidades).
5. Seleciona um template visual elegante e clica em "Gerar PDF".
6. O sistema renderiza o PDF de alta performance e faz o download.

### Componentes Angular
- `ResumeBuilderComponent` — Container principal de montagem do currículo
- `ResumeQuestionnaireComponent` — Questionário guiado por etapas (passo a passo)
- `ResumePreviewComponent` — Visualização em tempo real do texto gerado por IA
- `ResumePdfTemplateComponent` — Layouts de exportação em PDF

### Endpoints de API
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/v1/resume/optimize-section` | Processa respostas de uma etapa e reescreve profissionalmente via IA |
| POST | `/api/v1/resume/generate-pdf` | Converte o currículo em um PDF elegante e faz o download |

### Esforço Estimado: 4-5 dias

### Dependências
- Integração com LLMs (item 5)
- Biblioteca de renderização de PDF no backend (Weasyprint ou ReportLab)

---

## Resumo de Esforço

| Funcionalidade | Dias | Prioridade |
|----------------|------|------------|
| 1. B2B Empresas | 10-12 | Alta |
| 2. Busca Pública | 5-7 | Alta |
| 3. Autenticação | 5-7 | Alta |
| 4. Notificações | 4-5 | Média |
| 5. IA/LLM | 8-10 | Média |
| 6. Analytics | 5-7 | Média |
| 7. PWA | 3-4 | Baixa |
| 8. Gamificação | 3-4 | Baixa |
| 9. Integrações | 4-5 | Baixa |
| 10. LGPD | 5-7 | Alta |
| 11. Gerador de Currículos | 4-5 | Média |
| **Total** | **56-73** | |
