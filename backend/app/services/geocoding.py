import os
import re
import math
import sqlite3
import logging
import sys
import httpx

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "jobhunter.db")

_nominatim_queries_made = 0
MAX_NOMINATIM_QUERIES_PER_RUN = 10 # ponytail: limite rígido para evitar bloqueios de IP / rate limit no OSM

def init_geocoding_db():
    """Inicializa a tabela de cache de geolocalização no SQLite."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS city_coordinates (
                city_name TEXT PRIMARY KEY,
                latitude REAL,
                longitude REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de geocoding: {e}")

def clean_location_string(location: str) -> str:
    """
    Limpa strings de localização dos scrapers para extrair o nome da cidade.
    Exemplos:
      - 'São Paulo, SP' -> 'São Paulo'
      - 'Osasco - SP' -> 'Osasco'
      - 'Barueri (Alphaville)' -> 'Barueri'
    """
    if not location:
        return ""
    # Remove estados depois de vírgula ou traço (ex: , SP ou - SP)
    loc = re.split(r"[,(\-]", location)[0]
    return loc.strip()

def get_city_coords_from_cache(city_name: str) -> tuple[float, float] | None:
    """Busca coordenadas no cache local do SQLite."""
    init_geocoding_db()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT latitude, longitude FROM city_coordinates WHERE city_name = ?", (city_name.lower(),))
        row = cursor.fetchone()
        conn.close()
        if row:
            return row[0], row[1]
    except Exception as e:
        logger.error(f"Erro ao ler cache de geocoding: {e}")
    return None

def save_city_coords_to_cache(city_name: str, lat: float, lon: float):
    """Salva coordenadas no cache local do SQLite."""
    init_geocoding_db()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO city_coordinates (city_name, latitude, longitude) VALUES (?, ?, ?)",
            (city_name.lower(), lat, lon)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Erro ao salvar cache de geocoding: {e}")

def query_nominatim_geocoding(city_name: str) -> tuple[float, float] | None:
    """Consulta a API gratuita do Nominatim (OpenStreetMap) para buscar coordenadas."""
    if not city_name or city_name.lower() in ["remoto", "remote", "home office"]:
        return None

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": f"{city_name}, Brazil",
        "format": "json",
        "limit": 1
    }
    # Nominatim exige um User-Agent descritivo para evitar bloqueios
    headers = {
        "User-Agent": "JobHunter-App/1.0 (contact: matheus.diniz@example.com)"
    }

    try:
        response = httpx.get(url, params=params, headers=headers, timeout=10.0)
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                return lat, lon
    except Exception as e:
        logger.error(f"Erro ao consultar Nominatim para '{city_name}': {e}")
    return None

def get_city_coords(location: str) -> tuple[float, float] | None:
    """
    Obtém coordenadas da cidade de forma preguiçosa (Lazy / Cache-First).
    Se não estiver no cache do banco de dados, busca na API gratuita do Nominatim e salva.
    """
    global _nominatim_queries_made
    city_name = clean_location_string(location)
    if not city_name or city_name.lower() in ["remoto", "remote", "home office", "anywhere"]:
        return None

    # 1. Tentar ler do cache local
    coords = get_city_coords_from_cache(city_name)
    if coords:
        return coords

    # Se estiver rodando sob pytest, nunca fazer requisições de rede externas
    if "pytest" in sys.modules:
        logger.debug(f"[TEST] Geocoding cache miss para '{city_name}'. Ignorando requisição externa.")
        return None

    # Se atingiu o limite de consultas do Nominatim, ignora para evitar bloqueios de IP
    if _nominatim_queries_made >= MAX_NOMINATIM_QUERIES_PER_RUN:
        logger.warning(f"Limite máximo de consultas ao Nominatim ({MAX_NOMINATIM_QUERIES_PER_RUN}) atingido nesta execução. Ignorando '{city_name}'.")
        return None

    # 2. Consultar API externa se não estiver no cache
    logger.info(f"Geocoding cache miss para '{city_name}'. Consultando Nominatim...")
    init_geocoding_db() # Garante que a tabela existe
    coords = query_nominatim_geocoding(city_name)
    if coords:
        _nominatim_queries_made += 1
        save_city_coords_to_cache(city_name, coords[0], coords[1])
        return coords

    return None

def calculate_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula a distância física real (em KM) entre duas coordenadas geográficas
    usando a fórmula matemática de Haversine.
    """
    R = 6371.0 # Raio da terra em KM

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def get_distance_score(job_location: str, preferred_locations: list[str]) -> float:
    """
    Calcula a proximidade física (distância decaindo exponencialmente)
    entre a vaga e a localização preferida mais próxima do usuário.

    Retorna um float entre 0.0 e 1.0:
      - 1.0 se for Remoto ou na mesma cidade preferida.
      - Decai exponencialmente e⁻(d/50) conforme a distância aumenta.
      - 0.0 se não for possível calcular.
    """
    # Se a vaga é remota, proximidade é máxima
    job_city = clean_location_string(job_location).lower()
    if not job_city or job_city in ["remoto", "remote", "home office", "anywhere"]:
        return 1.0

    # Se a cidade da vaga estiver exatamente na lista de cidades preferidas, proximidade é máxima
    pref_cities_cleaned = [clean_location_string(loc).lower() for loc in preferred_locations]
    if job_city in pref_cities_cleaned:
        return 1.0

    # Busca as coordenadas da vaga
    job_coords = get_city_coords(job_location)
    if not job_coords:
        return 0.0

    min_distance = float("inf")

    # Calcula a distância física para cada cidade preferida do usuário e pega a menor delas
    for pref_loc in preferred_locations:
        pref_coords = get_city_coords(pref_loc)
        if pref_coords:
            distance = calculate_haversine(
                job_coords[0], job_coords[1],
                pref_coords[0], pref_coords[1]
            )
            if distance < min_distance:
                min_distance = distance

    if min_distance == float("inf"):
        return 0.0

    # ponytail: Normalização exponencial. f(d) = e^(-d / 50)
    # Distance = 0km -> 1.0
    # Distance = 10km -> 0.82
    # Distance = 50km -> 0.36
    # Distance = 100km -> 0.13
    decay_score = math.exp(-min_distance / 50.0)
    return decay_score
