import os
import sys
import json
import sqlite3
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

# Garante que o diretório 'backend' está no sys.path para importações locais se necessário
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "jobhunter.db")
MODEL_OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "model_weights.json")

# Criar pasta storage se não existir
os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)

class SimpleMLP:
    """
    Uma Rede Neural Multicamadas (Multilayer Perceptron) implementada do zero em NumPy.
    Perfeita para aprendizado conceitual sobre como funciona forward propagation,
    backpropagation, cálculo de gradientes e otimização.

    Arquitetura:
    Input Layer (N termos TF-IDF) -> Hidden Layer (16 neurônios + ReLU) -> Output (1 neurônio + Sigmoid)
    """
    def __init__(self, input_dim, hidden_dim=16, lr=0.01):
        self.lr = lr
        # ponytail: He initialization para camadas lineares seguido de ReLU
        self.w1 = np.random.randn(input_dim, hidden_dim) * np.sqrt(2.0 / input_dim)
        self.b1 = np.zeros((1, hidden_dim))
        # Xavier initialization para camada de saída com Sigmoid
        self.w2 = np.random.randn(hidden_dim, 1) * np.sqrt(1.0 / hidden_dim)
        self.b2 = np.zeros((1, 1))

    def relu(self, x):
        return np.maximum(0, x)

    def relu_derivative(self, x):
        return (x > 0).astype(float)

    def sigmoid(self, x):
        x = np.clip(x, -500, 500) # Evita underflow/overflow numérico
        return 1.0 / (1.0 + np.exp(-x))

    def forward(self, X):
        """
        Executa a passagem para frente (forward propagation).
        Formula:
          Z1 = X . W1 + B1
          A1 = ReLU(Z1)
          Z2 = A1 . W2 + B2
          A2 = Sigmoid(Z2) (Previsão de probabilidade)
        """
        self.X = X
        self.z1 = np.dot(X, self.w1) + self.b1
        self.a1 = self.relu(self.z1)
        self.z2 = np.dot(self.a1, self.w2) + self.b2
        self.a2 = self.sigmoid(self.z2)
        return self.a2

    def backward(self, y):
        """
        Executa o cálculo de erros e retropropagação de gradientes (backpropagation).
        Ajusta os pesos proporcionalmente ao erro cometido na previsão.
        """
        m = y.shape[0]

        # Gradiente da perda em relação à saída Z2
        # Para Binary Cross-Entropy Loss + Sigmoid, dZ2 = A2 - y
        dz2 = self.a2 - y # formato: (m, 1)

        # Gradientes dos pesos e bias da segunda camada
        dw2 = np.dot(self.a1.T, dz2) / m # formato: (hidden, 1)
        db2 = np.sum(dz2, axis=0, keepdims=True) / m # formato: (1, 1)

        # Gradientes que fluem de volta para a primeira camada (atravessando ReLU)
        da1 = np.dot(dz2, self.w2.T) # formato: (m, hidden)
        dz1 = da1 * self.relu_derivative(self.z1) # formato: (m, hidden)

        # Gradientes dos pesos e bias da primeira camada
        dw1 = np.dot(self.X.T, dz1) / m # formato: (input_dim, hidden)
        db1 = np.sum(dz1, axis=0, keepdims=True) / m # formato: (1, hidden)

        # Atualização clássica via Stochastic Gradient Descent (SGD)
        self.w1 -= self.lr * dw1
        self.b1 -= self.lr * db1
        self.w2 -= self.lr * dw2
        self.b2 -= self.lr * db2

    def calculate_loss(self, y, predictions):
        """
        Binary Cross-Entropy Loss (BCE Loss)
        Mede o quão distante a previsão de probabilidade (0 a 1) está do rótulo real (0 ou 1).
        """
        epsilon = 1e-15 # Evita log(0)
        predictions = np.clip(predictions, epsilon, 1 - epsilon)
        loss = -np.mean(y * np.log(predictions) + (1 - y) * np.log(1 - predictions))
        return loss

    def to_dict(self):
        """Converte pesos e biases para formato dicionário para serialização em JSON."""
        return {
            "w1": self.w1.tolist(),
            "b1": self.b1.tolist(),
            "w2": self.w2.tolist(),
            "b2": self.b2.tolist()
        }


def load_dataset():
    """
    Carrega dados do banco de dados SQLite local.
    Se houver pouca informação no banco, gera dados sintéticos baseados nas preferências do usuário
    para garantir que a rede aprenda padrões corretos desde o primeiro dia.
    """
    print(f"Buscando dados no banco de dados SQLite: {DB_PATH}")

    jobs = []
    rejected_jobs = []

    # 1. Carregar dados reais se o banco existir
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()

            # Carregar vagas ativas favoritadas (Class 1) e novas/vistas (Class 1 moderado/ou ignorado)
            # Focamos em favoritos = 1 para positivo forte, e o restante das vagas ativas como neutros/positivos
            cursor.execute("SELECT title, company, location, is_favorite FROM jobs")
            for title, company, location, is_fav in cursor.fetchall():
                # Tratamos favoritos ou aplicados como Classe 1 (relevantes)
                if is_fav:
                    jobs.append((title, company, location, 1.0))

            # Carregar vagas rejeitadas explicitamente (Class 0)
            cursor.execute("SELECT title, company, location FROM rejected_jobs")
            for title, company, location in cursor.fetchall():
                rejected_jobs.append((title, company, location, 0.0))

            conn.close()
        except Exception as e:
            print(f"Aviso ao ler do SQLite: {e}")

    print(f"Vagas Favoritadas encontradas: {len(jobs)}")
    print(f"Vagas Rejeitadas encontradas: {len(rejected_jobs)}")

    # 2. Gerar Dados Sintéticos de Fallback se houver poucos exemplos para treinar a rede neural
    # ponytail: Dados sintéticos de fallback garantem robustez inicial no cold start.
    if len(jobs) < 15 or len(rejected_jobs) < 15:
        print("Dataset pequeno detectado. Injetando dados sintéticos inteligentes com base no seu perfil...")

        # Carrega preferências do perfil do usuário para guiar a síntese de dados
        target_roles = ["Desenvolvedor Python", "Software Engineer", "Angular Developer", "Fullstack", "DevOps"]
        keywords = ["Python", "FastAPI", "TypeScript", "Angular", "Docker", "PostgreSQL", "AWS"]
        locations = ["Remoto", "Home Office", "São Paulo"]

        bad_roles = ["Gerente de Projetos", "Suporte Técnico", "Vendedor", "Designer", "Recepcionista", "Analista de RH"]
        bad_keywords = ["Telemarketing", "Excel", "Cobrança", "Vendas", "Estágio de Administração"]
        bad_locations = ["Presencial - Manaus", "Presencial - Porto Alegre"]

        if os.path.exists(DB_PATH):
            try:
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("SELECT target_roles, keywords, preferred_locations FROM candidate_profiles LIMIT 1")
                row = cursor.fetchone()
                if row:
                    import json as pyjson
                    r, k, l = row
                    if r: target_roles = pyjson.loads(r)
                    if k: keywords = pyjson.loads(k)
                    if l: locations = pyjson.loads(l)
                conn.close()
            except Exception as e:
                print(f"Erro ao ler perfil para dados sintéticos: {e}")

        # Sintetizar Classe 1 (Relevante)
        for _ in range(50):
            role = np.random.choice(target_roles)
            company = np.random.choice(["Google", "TechCorp", "Fintech S.A", "Inovação Labs", "DevSquad"])
            loc = np.random.choice(locations)
            # Constrói o texto
            jobs.append((f"{role} {np.random.choice(keywords)}", company, loc, 1.0))

        # Sintetizar Classe 0 (Irrelevante)
        for _ in range(50):
            role = np.random.choice(bad_roles)
            company = np.random.choice(["Lojas Cem", "Call Center Max", "Suporte Rápido", "RH Solutions"])
            loc = np.random.choice(bad_locations)
            jobs.append((f"{role} {np.random.choice(bad_keywords)}", company, loc, 0.0))

    # Consolida dataset
    all_samples = jobs + rejected_jobs

    texts = []
    labels = []
    proximity_scores = []

    # Carrega as preferências do usuário para o cálculo de distância real
    user_pref_locations = ["São Paulo"]
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT preferred_locations FROM candidate_profiles LIMIT 1")
            row = cursor.fetchone()
            if row and row[0]:
                import json as pyjson
                user_pref_locations = pyjson.loads(row[0])
            conn.close()
        except Exception as e:
            print(f"Erro ao ler locais preferidos para geolocalização: {e}")

    from app.services.geocoding import get_distance_score

    print("Calculando distâncias geográficas de Haversine para o dataset...")
    for title, company, location, label in all_samples:
        # Mesclar informações para formar o documento de texto de entrada
        text_doc = f"{title} em {company} ({location})"
        texts.append(text_doc.lower())
        labels.append(label)

        # Calcula a distância exponencial f(d) = e^(-d/50)
        dist_score = get_distance_score(location, user_pref_locations)
        proximity_scores.append(dist_score)

    return texts, np.array(proximity_scores).reshape(-1, 1), np.array(labels).reshape(-1, 1)


def train():
    print("Iniciando pipeline de processamento de linguagem natural...")
    texts, proximity_scores, y = load_dataset()

    # 1. Vetorização de texto usando TF-IDF (Term Frequency - Inverse Document Frequency)
    # Limita o vocabulário em 150 features para manter o modelo ultra-rápido na CPU e com RAM quase zero
    vectorizer = TfidfVectorizer(max_features=150, stop_words="english")
    X = vectorizer.fit_transform(texts).toarray()

    # Adiciona o score de proximidade física como coluna extra (Feature Union)
    X = np.hstack((X, proximity_scores))

    input_dim = X.shape[1]
    hidden_dim = 16
    epochs = 1500
    learning_rate = 0.05

    print(f"Dimensão das features de entrada (vocab): {input_dim}")
    print(f"Tamanho total do dataset de treinamento: {X.shape[0]} amostras")

    # 2. Instanciação e Treinamento do MLP
    mlp = SimpleMLP(input_dim=input_dim, hidden_dim=hidden_dim, lr=learning_rate)

    print("Iniciando loop de treinamento da Rede Neural NumPy...")
    for epoch in range(1, epochs + 1):
        # Forward pass
        predictions = mlp.forward(X)

        # Calcula perda (BCE Loss)
        loss = mlp.calculate_loss(y, predictions)

        # Backpropagation e atualização de pesos
        mlp.backward(y)

        # Print progresso a cada 100 épocas
        if epoch % 150 == 0 or epoch == 1:
            # Calcular acurácia simples
            binary_preds = (predictions >= 0.5).astype(float)
            accuracy = np.mean(binary_preds == y) * 100
            print(f"Época {epoch:04d}/{epochs} | BCE Loss: {loss:.5f} | Acurácia: {accuracy:.2f}%")

    # 3. Serializar modelo e vocabulário TF-IDF para JSON
    print(f"Salvando modelo treinado de relevância em: {MODEL_OUTPUT_PATH}")

    # Extrai o vocabulário do vectorizer
    # O vocabulário mapeia cada palavra indexada de volta para o seu índice numérico da coluna
    vocabulary = {str(k): int(v) for k, v in vectorizer.vocabulary_.items()}
    idf = vectorizer.idf_

    model_data = {
        "model_type": "custom_numpy_mlp",
        "input_dim": input_dim,
        "hidden_dim": hidden_dim,
        "vocabulary": vocabulary,
        "idf": idf.tolist(),
        "weights": mlp.to_dict()
    }

    with open(MODEL_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(model_data, f, indent=2, ensure_ascii=False)

    print("Treinamento finalizado com sucesso! Rede Neural pronta para produção.")

if __name__ == "__main__":
    train()
