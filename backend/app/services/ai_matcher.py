import os
import json
import logging
import re
import numpy as np
from app.services.scraper.base_scraper import ScrapedJob

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "storage", "model_weights.json")

class LightweightPredictor:
    """
    Preditor leve para inferência em produção.
    Não depende de frameworks pesados e roda com memória insignificante.
    Usa o modelo NumPy exportado.
    """
    def __init__(self, model_data: dict):
        self.vocabulary = model_data["vocabulary"]
        self.idf = np.array(model_data["idf"])

        weights = model_data["weights"]
        self.w1 = np.array(weights["w1"])
        self.b1 = np.array(weights["b1"])
        self.w2 = np.array(weights["w2"])
        self.b2 = np.array(weights["b2"])

    def tokenize(self, text: str) -> list[str]:
        # Divide texto em palavras (tokens de letras e números) de forma idêntica ao scikit-learn
        text = text.lower()
        return re.findall(r"\b\w\w+\b", text) # Scikit-learn ignora palavras de 1 letra por padrão

    def text_to_tfidf(self, text: str) -> np.ndarray:
        """Converte texto cru para um vetor TF-IDF usando o vocabulário e IDF treinados."""
        tokens = self.tokenize(text)
        vector = np.zeros(len(self.vocabulary))

        # Conta a frequência dos termos (TF)
        counts = {}
        for token in tokens:
            if token in self.vocabulary:
                counts[token] = counts.get(token, 0) + 1

        # Calcula TF-IDF: tf * idf
        for token, count in counts.items():
            idx = self.vocabulary[token]
            vector[idx] = count * self.idf[idx]

        # Normalização L2 (essencial para que as entradas tenham a mesma escala)
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm

        return vector.reshape(1, -1)

    def relu(self, x):
        return np.maximum(0, x)

    def sigmoid(self, x):
        x = np.clip(x, -500, 500)
        return 1.0 / (1.0 + np.exp(-x))

    def predict(self, text: str, location: str = "", preferred_locations: list[str] = None) -> float:
        """Executa a passagem para frente (forward pass) do MLP."""
        X_text = self.text_to_tfidf(text)

        # Se o modelo foi treinado com a feature extra de proximidade geográfica (input_dim = vocab + 1)
        if self.w1.shape[0] == len(self.vocabulary) + 1:
            from app.services.geocoding import get_distance_score
            dist_score = get_distance_score(location, preferred_locations or ["São Paulo"])
            dist_feat = np.array([[dist_score]])
            X = np.hstack((X_text, dist_feat))
        else:
            X = X_text

        z1 = np.dot(X, self.w1) + self.b1
        a1 = self.relu(z1)
        z2 = np.dot(a1, self.w2) + self.b2
        a2 = self.sigmoid(z2)
        return float(a2[0, 0])

# Singleton para evitar carregar o modelo a cada requisição
_predictor_instance = None

def load_ai_predictor() -> LightweightPredictor | None:
    """Carrega o modelo do JSON de forma resiliente."""
    global _predictor_instance
    if _predictor_instance is not None:
        return _predictor_instance

    if not os.path.exists(MODEL_PATH):
        logger.warning(f"Modelo de IA não encontrado em {MODEL_PATH}. Executando com heurísticas normais (matcher.py).")
        return None

    try:
        with open(MODEL_PATH, "r", encoding="utf-8") as f:
            model_data = json.load(f)
        _predictor_instance = LightweightPredictor(model_data)
        logger.info("Modelo de IA (Rede Neural) carregado com sucesso em produção.")
        return _predictor_instance
    except Exception as e:
        logger.error(f"Erro ao inicializar LightweightPredictor: {e}")
        return None


def get_ai_score(job: ScrapedJob, heuristic_score: int, preferred_locations: list[str] = None) -> int:
    """
    Combina a previsão probabilística da Rede Neural (0-100) com o score heurístico.
    Se o modelo de rede neural não estiver treinado ou falhar, retorna o score heurístico puro.

    A combinação permite que as heurísticas de localização (Remoto/Híbrido) e bônus de plataformas
    continuem agindo como limitadores seguros de qualidade, enquanto a rede neural avalia a semântica de relevância.
    """
    predictor = load_ai_predictor()
    if not predictor:
        return heuristic_score

    # Montar texto documental para avaliação semântica
    text_doc = f"{job.title} em {job.company} ({job.location})"

    try:
        # Previsão entre 0.0 e 1.0 (incluindo cálculo de geolocalização)
        probability = predictor.predict(text_doc, job.location, preferred_locations)
        ai_score = int(probability * 100)

        # ponytail: Média ponderada (60% rede neural, 40% heurísticas estruturadas)
        # Isso aproveita a inteligência semântica e mantém a segurança dos filtros de localização/plataforma.
        final_score = int((ai_score * 0.6) + (heuristic_score * 0.4))

        logger.debug(f"Job: '{job.title}' | AI Prob: {probability:.4f} ({ai_score}pts) | Heurística: {heuristic_score}pts | Final: {final_score}")
        return max(min(final_score, 100), 0)
    except Exception as e:
        logger.error(f"Erro ao pontuar com IA: {e}. Usando score heurístico.")
        return heuristic_score


def force_retrain_model() -> bool:
    """Dispara o treinamento da Rede Neural de forma síncrona."""
    global _predictor_instance
    try:
        from scripts.train_relevance_nn import train
        logger.info("Disparando treinamento manual da rede neural de relevância...")
        train()
        # Força o recarregamento na próxima chamada
        _predictor_instance = None
        load_ai_predictor()
        return True
    except Exception as e:
        logger.error(f"Erro no treinamento da rede neural: {e}")
        return False
