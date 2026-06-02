import json
import logging
from datetime import datetime, date
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)

# Arquivo persiste entre reinícios do processo
_STATE_FILE = Path(settings.cv_storage_path).parent / "scraper_rate_state.json"


def _load_state() -> dict:
    try:
        if _STATE_FILE.exists():
            return json.loads(_STATE_FILE.read_text())
    except Exception:
        pass
    return {}


def _save_state(state: dict):
    try:
        _STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        _STATE_FILE.write_text(json.dumps(state, default=str))
    except Exception as e:
        logger.warning(f"Could not save rate limit state: {e}")


# Configuração de rate limits por plataforma
# max_per_day: máximo de execuções por dia (None = sem limite)
RATE_LIMITS: dict[str, dict] = {
    "adzuna": {"max_per_day": 1},
    "remotive": {"max_per_day": 4},
    # Gupy, Jooble, LinkedIn, Vagas, InfoJobs, Catho: sem limite
}


def can_run(platform: str) -> bool:
    """Verifica se um scraper pode rodar baseado no rate limit diário."""
    limit_config = RATE_LIMITS.get(platform)
    if not limit_config or limit_config.get("max_per_day") is None:
        return True

    state = _load_state()
    today = date.today().isoformat()

    key = f"{platform}_last_run_date"
    count_key = f"{platform}_run_count_today"

    last_date = state.get(key)
    if last_date != today:
        # Novo dia — reseta counter
        state[key] = today
        state[count_key] = 0
        _save_state(state)
        return True

    count = state.get(count_key, 0)
    max_per_day = limit_config["max_per_day"]

    if count >= max_per_day:
        logger.info(f"[{platform}] Rate limit: {count}/{max_per_day} runs today, skipping")
        return False

    return True


def record_run(platform: str):
    """Registra que um scraper foi executado."""
    state = _load_state()
    today = date.today().isoformat()

    key = f"{platform}_last_run_date"
    count_key = f"{platform}_run_count_today"

    if state.get(key) != today:
        state[key] = today
        state[count_key] = 1
    else:
        state[count_key] = state.get(count_key, 0) + 1

    _save_state(state)


def get_status() -> dict:
    """Retorna status de rate limits para todas as plataformas."""
    state = _load_state()
    today = date.today().isoformat()
    result = {}

    for platform, config in RATE_LIMITS.items():
        max_per_day = config.get("max_per_day")
        if max_per_day is None:
            continue
        last_date = state.get(f"{platform}_last_run_date")
        count = state.get(f"{platform}_run_count_today", 0) if last_date == today else 0
        result[platform] = {
            "max_per_day": max_per_day,
            "used_today": count,
            "remaining": max(0, max_per_day - count),
        }

    return result
