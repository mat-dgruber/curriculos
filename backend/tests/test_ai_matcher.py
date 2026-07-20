import os
import pytest
import numpy as np
from app.services.scraper.base_scraper import ScrapedJob
from app.services.ai_matcher import LightweightPredictor, get_ai_score, force_retrain_model

# Dados de simulação do modelo exportado
MOCK_MODEL_DATA = {
    "model_type": "custom_numpy_mlp",
    "input_dim": 3,
    "hidden_dim": 4,
    "vocabulary": {"python": 0, "developer": 1, "angular": 2},
    "idf": [1.5, 1.2, 2.0],
    "weights": {
        "w1": [[0.1] * 4, [0.2] * 4, [0.3] * 4],
        "b1": [[0.01] * 4],
        "w2": [[0.5]] * 4,
        "b2": [[0.02]]
    }
}

def test_lightweight_predictor_initialization():
    predictor = LightweightPredictor(MOCK_MODEL_DATA)
    assert len(predictor.vocabulary) == 3
    assert predictor.idf.shape == (3,)
    assert predictor.w1.shape == (3, 4)
    assert predictor.b1.shape == (1, 4)
    assert predictor.w2.shape == (4, 1)
    assert predictor.b2.shape == (1, 1)

def test_lightweight_predictor_tokenize():
    predictor = LightweightPredictor(MOCK_MODEL_DATA)
    tokens = predictor.tokenize("Python developer in São Paulo!")
    assert "python" in tokens
    assert "developer" in tokens
    assert "são" in tokens
    # Ignora strings com 1 caractere por padrão
    tokens_single = predictor.tokenize("a b c python")
    assert "a" not in tokens_single
    assert "python" in tokens_single

def test_lightweight_predictor_text_to_tfidf():
    predictor = LightweightPredictor(MOCK_MODEL_DATA)
    vector = predictor.text_to_tfidf("Python developer")
    assert vector.shape == (1, 3)
    # Deve ser normalizado (L2-norm = 1.0) se não for nulo
    norm = np.linalg.norm(vector)
    assert pytest.approx(norm) == 1.0

def test_lightweight_predictor_predict():
    predictor = LightweightPredictor(MOCK_MODEL_DATA)
    prob = predictor.predict("Python developer")
    assert isinstance(prob, float)
    assert 0.0 <= prob <= 1.0

def test_get_ai_score_fallback():
    # Se o modelo não estiver salvo localmente ou ocorrer erro, deve retornar o score heurístico limpo
    job = ScrapedJob(
        title="Desenvolvedor Java",
        company="IBM",
        location="São Paulo",
        platform="Gupy",
        url="http://ibm.com",
        description=""
    )
    score = get_ai_score(job, 75)
    # Como o modelo singleton pode estar carregado ou não no ambiente de testes,
    # verificamos se o score resultante é um inteiro válido entre 0 e 100
    assert isinstance(score, int)
    assert 0 <= score <= 100

def test_force_retrain_model_flow():
    # Testa se o fluxo completo de re-treinamento roda sem exceções
    success = force_retrain_model()
    assert success is True
    # E o arquivo de pesos deve ter sido criado
    from app.services.ai_matcher import MODEL_PATH
    assert os.path.exists(MODEL_PATH)

def test_clean_location_string():
    from app.services.geocoding import clean_location_string
    assert clean_location_string("São Paulo, SP") == "São Paulo"
    assert clean_location_string("Osasco - SP") == "Osasco"
    assert clean_location_string("Barueri (Alphaville)") == "Barueri"
    assert clean_location_string("") == ""

def test_calculate_haversine_math():
    from app.services.geocoding import calculate_haversine
    # São Paulo: -23.55052, -46.633308
    # Rio de Janeiro: -22.906847, -43.172896
    # Distância real aproximada: ~358 km
    dist = calculate_haversine(-23.55052, -46.633308, -22.906847, -43.172896)
    assert 340 <= dist <= 380

def test_get_distance_score_behavior(monkeypatch):
    from app.services.geocoding import get_distance_score, save_city_coords_to_cache

    # Prepara o cache local de coordenadas para evitar chamar a API externa do Nominatim em testes
    save_city_coords_to_cache("São Paulo", -23.55052, -46.633308)
    save_city_coords_to_cache("Rio de Janeiro", -22.906847, -43.172896)

    # Caso 1: Mesma cidade configurada
    score_same = get_distance_score("São Paulo, SP", ["São Paulo"])
    assert score_same == 1.0

    # Caso 2: Remoto
    score_remote = get_distance_score("Remoto", ["São Paulo"])
    assert score_remote == 1.0

    # Caso 3: Cidade distante (Rio de Janeiro vs São Paulo)
    # Haversine ~= 358km. decay_score = e^(-358 / 50) = e^(-7.16) ~= 0.00077
    score_far = get_distance_score("Rio de Janeiro", ["São Paulo"])
    assert 0.0 <= score_far < 0.01

