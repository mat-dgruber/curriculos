# Guia de Testes Manuais — JobHunter

> Guia passo a passo para testar manualmente cada página, função e utilidade do sistema.
>
> Atualizado: 2026-05-31

---

## Pré-requisitos

1. Backend rodando: `cd backend && uv run uvicorn app.main:app --reload`
2. Frontend rodando: `cd frontend && ng serve`
3. Acessar: `http://localhost:4200`
4. Verificar API docs: `http://localhost:8000/docs`

---

## 1. Dashboard (`/dashboard`)

### 1.1 Carregamento Inicial
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 1 | Navegar para `/dashboard` | Dashboard carrega com cards de estatísticas | |
| 2 | Verificar cards | "Total de Vagas", "Candidaturas", "Empresas Ativas" com números | |
| 3 | Verificar "Vagas Recentes" | Lista das últimas vagas encontradas com score | |
| 4 | Verificar status do scheduler | Indicador verde/vermelho mostrando se está ativo | |

### 1.2 Ação de Scan
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 5 | Clicar "Escanear Agora" | Botão muda para estado de loading | |
| 6 | Aguardar conclusão | Toast/snackbar de sucesso | |
| 7 | Verificar vagas novas | Lista de vagas atualizada com novos resultados | |

### 1.3 Responsividade
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 8 | Redimensionar para < 768px | Layout se adapta, sidebar colapsa | |

---

## 2. Lista de Vagas (`/jobs`)

### 2.1 Listagem
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 1 | Navegar para `/jobs` | Lista de vagas carrega com paginação | |
| 2 | Verificar colunas | Título, Empresa, Local, Score, Plataforma, Status | |
| 3 | Verificar score | Badge colorido: verde (>70), amarelo (40-70), vermelho (<40) | |
| 4 | Verificar paginação | Botões anterior/próximo, indicador de página | |

### 2.2 Filtros
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 5 | Digitar no campo de busca | Lista filtra por título ou empresa em tempo real | |
| 6 | Filtrar por plataforma | Apenas vagas da plataforma selecionada aparecem | |
| 7 | Filtrar por score mínimo | Apenas vagas com score >= valor aparecem | |
| 8 | Filtrar por status | Apenas vagas com status selecionado aparecem | |
| 9 | Limpar filtros | Lista volta ao estado original | |

### 2.3 Ações
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 10 | Clicar em uma vaga | Navega para detalhe da vaga (`/jobs/:id`) | |
| 11 | Clicar "Escanear Agora" | Scan é disparado, lista atualiza | |

---

## 3. Detalhe da Vaga (`/jobs/:id`)

### 3.1 Visualização — `[STUB — Precisa implementar]`
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 1 | Acessar `/jobs/123` | Detalhes completos da vaga | |
| 2 | Verificar informações | Título, empresa, local, score, descrição, requisitos | |
| 3 | Botão "Candidatar-se" | Cria candidatura vinculada à vaga | |
| 4 | Link externo | Link para a vaga original na plataforma | |

---

## 4. Candidaturas (`/applications`)

### 4.1 Listagem
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 1 | Navegar para `/applications` | Lista de candidaturas carrega | |
| 2 | Verificar colunas | Vaga, Empresa, Status, Data, Notas | |
| 3 | Verificar status | Cores: Pendente (amarelo), Enviado (verde), Falhou (vermelho), Arquivado (cinza) | |

### 4.2 Filtros
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 4 | Filtrar por status | Lista filtra corretamente | |
| 5 | Filtrar por data | Lista filtra por período selecionado | |

### 4.3 Criar Candidatura
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 6 | Clicar "Nova Candidatura" | Formulário abre | |
| 7 | Selecionar vaga | Vaga é selecionada | |
| 8 | Adicionar notas | Notas são salvas | |
| 9 | Submeter | Candidatura criada com status "Pendente" | |
| 10 | Tentar duplicar | Erro 409 "Candidatura já existe" | |

### 4.4 Atualizar Status
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 11 | Mudar Pendente → Enviado | Status atualiza, `sent_at` preenchido | |
| 12 | Mudar Pendente → Falhou | Status atualiza com mensagem de erro | |
| 13 | Tentar Enviado → Pendente | Erro 409 "Transição inválida" | |
| 14 | Mudar para Arquivado | Funciona de qualquer status válido | |

---

## 5. Empresas (`/companies`)

### 5.1 Listagem
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 1 | Navegar para `/companies` | Lista de empresas carrega | |
| 2 | Verificar colunas | Nome, URL, Intervalo, Status, Próximo envio | |
| 3 | Verificar status | Ativo (verde), Pausado (amarelo), Respondeu (azul) | |

### 5.2 CRUD
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 4 | Clicar "Nova Empresa" | Formulário abre | |
| 5 | Preencher nome + URL + intervalo | Campos validados | |
| 6 | Submeter | Empresa criada com status "Ativo" | |
| 7 | Clicar em editar | Formulário de edição abre com dados preenchidos | |
| 8 | Alterar nome | Nome atualiza | |
| 9 | Alterar intervalo | `next_send_at` recalculado | |
| 10 | Clicar toggle | Empresa pausa/reativa | |
| 11 | Tentar reativar "Respondeu" | Erro 409 "não pode ser reativada" | |
| 12 | Deletar empresa | Empresa removida da lista | |

### 5.3 Filtros
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 13 | Filtrar por status | Lista filtra corretamente | |

---

## 6. Perfil (`/profile`)

### 6.1 Visualização
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 1 | Navegar para `/profile` | Formulário com dados do perfil | |
| 2 | Verificar campos | Nome, email, telefone, localização, cargo alvo, LinkedIn | |

### 6.2 Edição
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 3 | Alterar nome | Nome atualiza ao salvar | |
| 4 | Alterar email | Email atualiza | |
| 5 | Alterar localização | Localização atualiza | |
| 6 | Adicionar LinkedIn URL | URL salva | |
| 7 | Deixar campos obrigatórios vazios | Validação impede salvamento | |

### 6.3 Upload de CV — `[STUB — Backend não salva]`
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 8 | Clicar "Upload CV" | Seletor de arquivo abre | |
| 9 | Selecionar PDF | Arquivo é aceito | |
| 10 | Selecionar arquivo não-PDF | Erro de validação | |
| 11 | Selecionar arquivo > 10MB | Erro de tamanho | |
| 12 | Verificar nome do arquivo | Nome aparece no perfil | |

---

## 7. Configurações (`/settings`)

### 7.1 Palavras-chave
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 1 | Navegar para `/settings` | Seções de configuração visíveis | |
| 2 | Adicionar palavra-chave | Tag aparece na lista | |
| 3 | Remover palavra-chiche | Tag desaparece | |
| 4 | Adicionar duplicada | Validação impede ou ignora | |

### 7.2 Cargos Alvo
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 5 | Adicionar cargo alvo | Tag aparece na lista | |
| 6 | Remover cargo alvo | Tag desaparece | |

### 7.3 Localizações Preferidas
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 7 | Adicionar localização | Tag aparece na lista | |
| 8 | Remover localização | Tag desaparece | |

### 7.4 Automação
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 9 | Alterar intervalo de scan | Valor salva (1-24 horas) | |
| 10 | Toggle auto-apply | Preferência salva | |

---

## 8. Scheduler (Topbar)

### 8.1 Status
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 1 | Verificar topbar | Próxima execução do scheduler visível | |
| 2 | Verificar status | Indicador verde (rodando) ou vermelho (pausado) | |

### 8.2 Controles
| # | Ação | Esperado | Status |
|---|------|----------|--------|
| 3 | Clicar "Pausar" | Scheduler pausa, indicador muda | |
| 4 | Clicar "Retomar" | Scheduler retoma, indicador muda | |
| 5 | Trigger manual "scan_jobs" | Scan executa | |
| 6 | Trigger manual "recurring_send" | Envios recorrentes executam | |

---

## 9. Testes de API (via Swagger)

### 9.1 Endpoints Disponíveis
Acesse `http://localhost:8000/docs` e teste:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/jobs` | Listar vagas (filtros: search, min_score, platform, status) |
| GET | `/api/v1/jobs/{id}` | Detalhe da vaga |
| POST | `/api/v1/jobs/scan` | Disparar scan manual |
| GET | `/api/v1/applications` | Listar candidaturas |
| POST | `/api/v1/applications` | Criar candidatura |
| PUT | `/api/v1/applications/{id}/status` | Atualizar status |
| GET | `/api/v1/companies` | Listar empresas |
| POST | `/api/v1/companies` | Criar empresa |
| PUT | `/api/v1/companies/{id}` | Atualizar empresa |
| DELETE | `/api/v1/companies/{id}` | Deletar empresa |
| PUT | `/api/v1/companies/{id}/toggle` | Toggle ativo/inativo |
| GET | `/api/v1/profile` | Obter perfil |
| PUT | `/api/v1/profile` | Atualizar perfil |
| POST | `/api/v1/profile/cv` | Upload CV |
| GET | `/api/v1/scheduler/status` | Status do scheduler |
| POST | `/api/v1/scheduler/trigger/{job_id}` | Trigger manual |
| PUT | `/api/v1/scheduler/pause` | Pausar scheduler |
| DELETE | `/api/v1/scheduler/pause` | Retomar scheduler |

### 9.2 Teste de Paginação
```bash
# Página 1
curl http://localhost:8000/api/v1/jobs?page=1&per_page=5

# Página 2
curl http://localhost:8000/api/v1/jobs?page=2&per_page=5
```

### 9.3 Teste de Filtros
```bash
# Buscar por título
curl "http://localhost:8000/api/v1/jobs?search=angular"

# Filtrar por score mínimo
curl "http://localhost:8000/api/v1/jobs?min_score=70"

# Filtrar por plataforma
curl "http://localhost:8000/api/v1/jobs?platform=gupy"
```

---

## 10. Checklist de Regressão

Execute antes de cada deploy:

- [ ] Dashboard carrega sem erros no console
- [ ] Lista de vagas mostra dados reais
- [ ] Filtros funcionam em todas as páginas
- [ ] Paginação funciona (avançar/voltar páginas)
- [ ] Criar/editar/deletar empresa funciona
- [ ] Criar candidatura funciona
- [ ] Atualizar status respeita transições válidas
- [ ] Perfil salva corretamente
- [ ] Upload de CV mostra feedback (mesmo que stub)
- [ ] Scheduler pausa/retoma
- [ ] Scan manual dispara e retorna resultados
- [ ] Nenhum erro 500 na API
- [ ] Tempo de resposta < 2s em todas as rotas
- [ ] Layout responsivo em mobile (< 768px)
