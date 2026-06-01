"""
Scan state singleton — tracks the current scan job status.
"""
import threading
from datetime import datetime

_lock = threading.Lock()
_state: dict = {
    "status": "idle",          # idle | running | completed | failed
    "started_at": None,
    "finished_at": None,
    "result": None,
    "error": None,
}


def get_status() -> dict:
    with _lock:
        return {**_state}


def set_running():
    with _lock:
        _state.update({
            "status": "running",
            "started_at": datetime.utcnow().isoformat(),
            "finished_at": None,
            "result": None,
            "error": None,
        })


def set_completed(result: dict):
    with _lock:
        _state.update({
            "status": "completed",
            "finished_at": datetime.utcnow().isoformat(),
            "result": result,
            "error": None,
        })


def set_failed(error: str):
    with _lock:
        _state.update({
            "status": "failed",
            "finished_at": datetime.utcnow().isoformat(),
            "result": None,
            "error": error,
        })
