# 🤖 Integração de Redes Neurais e LLMs — JobHunter

Este documento apresenta uma especificação técnica detalhada para a integração de Inteligência Artificial no ecossistema do **JobHunter**. O foco está dividido em duas frentes complementares:

1. **Redes Neurais Próprias (ML/DL Clássico):** Criadas e treinadas do zero para fins de aprendizado prático em Machine Learning/Deep Learning.
2. **Modelos de Linguagem de Grande Porte (LLMs):** Integrações locais ou via APIs para extração semântica complexa e geração de texto estruturado.

---

## 🗺️ Mapa Arquitetural de IA no JobHunter

```
                                  +-----------------------+
                                  |   Scrapers de Vagas   |
                                  +-----------+-----------+
                                              |
                                              v
                                  +-----------------------+
                                  |   PostgreSQL DB       |
                                  +-----+-----------+-----+
                                        |           |
             +--------------------------+           +--------------------------+
             | (Dados Estruturados + Histórico)     | (Descrições em Texto Cru)
             v                                      v
+-----------------------------------------+   +-----------------------------------------+
|     REDES NEURAIS PRÓPRIAS (PyTorch)    |   |         LLM LOCAL / EXTERNO (Ollama)    |
|-----------------------------------------|   |-----------------------------------------|
|  - MLP Classificador de Relevância      |   |  - Extração de Requisitos Pydantic      |
|  - LSTM Classificador de Senioridade    |   |  - Resumos Semânticos Personalizados    |
|  - MLP Regressor de Faixa Salarial      |   |  - Gerador de Cold Mails Customizados   |
+--------------------+--------------------+   +--------------------+--------------------+
                     |                                             |
                     +----------------------+----------------------+
                                            |
                                            v
                               +-------------------------+
                               |     FastAPI Backend     |
                               +------------+------------+
                                            |
                                            v
                               +-------------------------+
                               |     Angular Frontend    |
                               +-------------------------+
```

---

## 🧠 Parte 1: Redes Neurais Próprias (Treinadas do Zero)

Abaixo estão os projetos voltados para aprendizado conceitual de Deep Learning, usando **PyTorch** e **Scikit-Learn** no Backend em Python.

### Proposta 1.A: MLP Classificador de Relevância de Vagas (Vaga Ideal vs. Descartável)

Substitui ou complementa o motor heurístico de pontuação do `matcher.py` por uma rede neural feedforward (**Multilayer Perceptron**) capaz de aprender suas preferências com base no histórico de vagas favoritadas e rejeitadas.

#### 🛠️ Especificação de Implementação

1. **Coleta e Rotulação de Dados:**
   - **Classe 1 (Positiva):** Vagas com status favoritado ou aplicadas (`applications` e `jobs` ativos).
   - **Classe 0 (Negativa):** Vagas rejeitadas/deletadas (`rejected_jobs`).

2. **Pipeline de Pré-processamento e Vetorização:**
   - Fusão de campos de texto: `Title + Company + Description`.
   - Vetorização de texto usando **TF-IDF** (Term Frequency-Inverse Document Frequency) do Scikit-Learn para limitar o vocabulário em $N$ dimensões (ex: 1000 termos mais frequentes), ou extração de embeddings estáticos usando **FastText** ou **GloVe**.
   - Adição de variáveis numéricas/categóricas normalizadas (Min-Max Scaling):
     - Plataforma de origem (One-Hot Encoded).
     - Localização (One-Hot Encoded).

3. **Arquitetura da Rede Neural (PyTorch):**

```python
import torch
import torch.nn as nn

class JobRelevanceMLP(nn.Module):
    def __init__(self, input_dim):
        super(JobRelevanceMLP, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.3),  # Evita overfitting

            nn.Linear(256, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.2),

            nn.Linear(64, 1),
            nn.Sigmoid()      # Saída entre 0 e 1 (probabilidade)
        )

    def forward(self, x):
        return self.network(x)
```

4. **Treinamento (Loop de Treino):**
   - **Função de Perda:** `BCELoss` (Binary Cross-Entropy Loss).
   - **Otimizador:** `Adam` ou `AdamW` (learning rate = $1e-3$).
   - **Validação:** Divisão clássica 80% treino / 20% teste. Monitorar métricas como **Precision**, **Recall** e **F1-Score** (essencial para dados desbalanceados de vagas).

---

### Proposta 1.B: LSTM/GRU para Classificação de Senioridade e Área de Atuação

Uma rede neural recorrente (RNN) que processa a sequência temporal do título da vaga para categorizar automaticamente a senioridade (Estágio, Júnior, Pleno, Sênior, Specialist) e a área (Frontend, Backend, Fullstack, Mobile, DevOps, Dados).

#### 🛠️ Especificação de Implementação

1. **Preparação dos Dados:**
   - Entrada: Título da vaga como sequência de tokens.
   - Saída 1 (Senioridade): Classificação multiclasse (5 classes).
   - Saída 2 (Área): Classificação multiclasse (6 classes).

2. **Arquitetura Multi-Output RNN (PyTorch):**

```python
class JobClassifierRNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_areas, num_seniorities):
        super(JobClassifierRNN, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=True)

        # Cabeças de decisão separadas (Multi-task learning)
        self.fc_area = nn.Sequential(
            nn.Linear(hidden_dim * 2, 64),
            nn.ReLU(),
            nn.Linear(64, num_areas) # CrossEntropyLoss lida com logits diretamente
        )
        self.fc_seniority = nn.Sequential(
            nn.Linear(hidden_dim * 2, 64),
            nn.ReLU(),
            nn.Linear(64, num_seniorities)
        )

    def forward(self, x, lengths):
        embedded = self.embedding(x)
        # Empacotamento de sequências para eficiência com tamanhos variáveis
        packed = nn.utils.rnn.pack_padded_sequence(embedded, lengths, batch_first=True, enforce_sorted=False)
        _, (hidden, _) = self.lstm(packed)

        # Concatena estados finais da LSTM bidirecional
        out = torch.cat((hidden[-2,:,:], hidden[-1,:,:]), dim=1)

        area_logits = self.fc_area(out)
        seniority_logits = self.fc_seniority(out)
        return area_logits, seniority_logits
```

---

### Proposta 1.C: Regressor de Estimativa Salarial Oculta

Muitas vagas omitem salários. Com base em um conjunto de dados treinado a partir de vagas que expõem essa faixa salarial, podemos aproximar o salário real por meio de uma rede neural regressora.

#### 🛠️ Especificação de Implementação

- **Entrada:** Stack de tecnologias (One-Hot), Localização, Senioridade prevista pelo modelo (1.B) e Nome da Empresa (codificada por frequência de mercado).
- **Saída:** Um vetor contínuo de 2 dimensões `[salario_min, salario_max]`.
- **Perda:** `MSELoss` (Mean Squared Error Loss) ou `HuberLoss` (menos sensível a outliers salariais).

---

## 🤖 Parte 2: Integração de Modelos de Linguagem (LLMs)

Diferente das Redes Neurais clássicas, os LLMs se destacam pela compreensão semântica rica do texto humano. Como você possui uma infraestrutura de servidor doméstico em Ubuntu, o uso do **Ollama** garante custo financeiro zero ($0) de API e total privacidade de dados.

### Proposta 2.A: Extrator Estruturado de Requisitos de Vagas (Parsing Semântico)

Lê a descrição texturizada de scrapers e retorna um JSON tipado estruturado com alta precisão, facilitando buscas complexas e filtros refinados no Angular.

#### 🛠️ Especificação de Implementação

1. **Definição do Esquema com Pydantic:**

```python
from pydantic import BaseModel, Field
from typing import list, Optional

class ExtractedJobDetails(BaseModel):
    hard_skills: list[str] = Field(description="Lista de tecnologias obrigatórias como Python, Angular, SQL, AWS, Docker.")
    soft_skills: list[str] = Field(description="Habilidades comportamentais chave, ex: liderança, comunicação, agilidade.")
    min_years_experience: Optional[int] = Field(description="Anos mínimos de experiência explicitados na descrição. None se não mencionado.")
    benefits: list[str] = Field(description="Benefícios corporativos como Vale Refeição, Seguro de Vida, Gympass, PLR.")
    salary_estimation: Optional[float] = Field(description="Salário mencionado diretamente no texto. None se oculto.")
    contract_type: str = Field(description="Regime de contratação: 'CLT', 'PJ', 'Estágio', 'Cooperado' ou 'Não especificado'.")
```

2. **Invocação estruturada usando Ollama + Instructor:**

```python
import httpx
from instructor import patch
from openai import OpenAI

# Inicializa o cliente patch do instructor para lidar com schemas estruturados
client = patch(OpenAI(
    base_url="http://localhost:11434/v1", # Endpoint local do Ollama
    api_key="ollama" # Requisito fictício do SDK
))

async def extract_job_info_llm(description: str) -> ExtractedJobDetails:
    response = client.chat.completions.create(
        model="qwen2.5-coder:7b", # Excelente para tarefas lógicas e estruturadas
        response_model=ExtractedJobDetails,
        messages=[
            {"role": "system", "content": "Você é um parser especializado em recrutamento técnico. Extraia todas as informações da vaga de forma precisa no formato estruturado solicitado."},
            {"role": "user", "content": description}
        ]
    )
    return response
```

---

### Proposta 2.B: Resumos Inteligentes "Match Semântico" no Frontend

Exibe um card visual "Análise da IA" nos detalhes da vaga do painel do Angular, detalhando o fit cultural e técnico baseado no currículo do candidato cadastrado no sistema.

#### 🛠️ Especificação de Implementação

- **Prompt System:**
  > "Você é o assistente virtual de carreira do JobHunter. Analise o currículo do usuário fornecido e a vaga de emprego. Forneça uma análise concisa de no máximo 3 pontos fortes de aderência técnica, 2 eventuais gaps de conhecimento técnico e um conselho de ouro para destacar-se no processo seletivo. Responda em português brasileiro."
- **Apresentação Visual (Angular - Bento Grid style):**
  - Um card com fundo blur glassmorphism mostrando:
    - ✅ **Pontos de Encontro:** Tags de tecnologias que dão match direto.
    - ⚠️ **Gaps sugeridos para Estudo:** Lista de frameworks exigidos na vaga que não estão listados no perfil do usuário.
    - 💡 **Dica de Abordagem:** Texto curto gerado dinamicamente para usar na abordagem ao recrutador.

---

### Proposta 2.C: Gerador Dinâmico de Cartas de Apresentação e Cold Messaging

Cria mensagens ultra-personalizadas direcionadas a recrutadores no LinkedIn para abrir portas de processos seletivos fechados.

#### 🛠️ Especificação de Implementação

- **Parâmetros de Entrada:**
  - Perfil do Usuário (Nome, Cargo, Projetos Principais).
  - Informações extraídas da Vaga (Proposta 2.A).
  - Tom de Voz (Formal, Descontraído, Focado em Resultados).
- **Backend Pipeline:**
  - O FastAPI monta o prompt contextualizado e faz a chamada ao Ollama.
  - O retorno é entregue em Markdown para o Angular.
- **Componente Angular:**
  - Interface com editor simples de texto para que o usuário possa fazer revisões manuais rápidas.
  - Botão de "Copiar para Área de Transferência" integrado para agilizar o envio.

---

## ⚡ Novas Ideias para Expansão (Inovação e Aprendizado)

### Ideia 3.A: Agente de Scraping Autônomo com LLM (Self-Healing Scraper)

- **O que resolve:** Scrapers comuns (Playwright/Scrapling) quebram frequentemente quando as classes HTML dos portais mudam.
- **Como implementar:**
  - Quando um scraper falha em encontrar os seletores padrões, ele extrai a árvore HTML da página (limpa de scripts e tags inúteis para economizar tokens).
  - O HTML parcial é enviado a um LLM local com a pergunta: _"Onde está o título da vaga e o botão de aplicação nesta estrutura de tags?"_.
  - O LLM retorna os novos seletores CSS dinamicamente para o orquestrador salvar em banco, gerando um scraper auto-regenerativo.

### Ideia 3.B: Agente de Entrevistas Técnicas Simuladas (Mock Interviewer)

- **O que resolve:** Falta de preparo prático para etapas técnicas de entrevistas.
- **Como implementar:**
  - O usuário clica em "Treinar para esta Vaga" no Angular.
  - Um chat em tempo real se abre.
  - O LLM assume a persona de um Tech Lead da empresa que publicou a vaga.
  - Ele faz perguntas técnicas sequenciais baseadas nas hard skills exigidas.
  - O usuário responde e, ao final, recebe uma avaliação detalhada de suas respostas com notas conceituais.

---

## 📋 Matriz de Priorização para o Desenvolvedor

Esta matriz ajuda a decidir por onde começar dependendo da sua prioridade imediata:

| Feature / Idéia                        | Esforço Estimado   | Custo Infra | Valor de Aprendizado (Redes Neurais) | Impacto para o Usuário | Recomendação                                      |
| :------------------------------------- | :----------------- | :---------- | :----------------------------------- | :--------------------- | :------------------------------------------------ |
| **1.A: MLP Relevância de Vagas**       | Médio (2 a 3 dias) | R$ 0.00     | 🌟🌟🌟🌟🌟                           | 🌟🌟🌟🌟               | **Melhor escolha para iniciar em Redes Neurais.** |
| **2.A: Extrator JSON via Ollama**      | Baixo (1 dia)      | R$ 0.00     | 🌟🌟                                 | 🌟🌟🌟🌟🌟             | **Melhor escolha para impacto rápido.**           |
| **1.B: LSTM Classificador de Títulos** | Médio/Alto         | R$ 0.00     | 🌟🌟🌟🌟                             | 🌟🌟🌟                 | Excelente para processamento sequencial de texto. |
| **3.B: Agente de Entrevistas**         | Alto (5+ dias)     | R$ 0.00     | 🌟🌟                                 | 🌟🌟🌟🌟               | Projeto de final de trilha (Hackathon próprio).   |

---

## 🚀 Guia de Passos de Implementação para o MLP (1.A)

Se optar por iniciar construindo sua própria Rede Neural para Score de Relevância, siga estes passos sequenciais:

1. **Preparação de Script de ETL (`scripts/ml_etl.py`):**
   - Escreva uma query SQL para extrair textos de `jobs` e `rejected_jobs` correlacionando com sua preferência (classe $1$ se o job foi favoritado/aplicado, classe $0$ se foi descartado ou caiu nas regras de exclusão automática).
2. **Construção do Pipeline Sklearn (`scikit-learn`):**
   - Limpe caracteres especiais do texto em português usando `nltk` ou `spacy`.
   - Use `TfidfVectorizer` salvando o artefato `.joblib` para uso posterior em produção.
3. **Treinamento no PyTorch:**
   - Crie o dataset herdando de `torch.utils.data.Dataset`.
   - Crie o DataLoader e o loop clássico de treinamento. Monitorando a perda no conjunto de validação para interromper o treinamento cedo caso comece a ocorrer overfitting (_Early Stopping_).
4. **Deploy no FastAPI:**
   - Crie um serviço `backend/app/services/ai_matcher.py` que carrega o modelo PyTorch e o vetorizador TF-IDF na inicialização do servidor.
   - Substitua a chamada simples de pontuação pelo predict do modelo de IA para ranquear as vagas coletadas pelos scrapers diários.
