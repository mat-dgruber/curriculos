"""Tests for /api/v1/scheduler endpoints."""
import pytest


@pytest.mark.asyncio
async def test_get_scheduler_status(client):
    """Test scheduler status endpoint (scheduler may or may not be running)."""
    resp = await client.get("/api/v1/scheduler/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "isRunning" in data
    assert "jobs" in data
    assert "pausedUntil" in data


@pytest.mark.asyncio
async def test_trigger_invalid_job(client):
    resp = await client.post("/api/v1/scheduler/trigger/invalid_job")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_pause_scheduler(client):
    resp = await client.put("/api/v1/scheduler/pause")
    assert resp.status_code == 200
    assert "pausado" in resp.json()["message"].lower()


@pytest.mark.asyncio
async def test_resume_scheduler(client):
    await client.put("/api/v1/scheduler/pause")
    resp = await client.delete("/api/v1/scheduler/pause")
    assert resp.status_code == 200
    assert resp.json()["isRunning"] is True
    assert "retomado" in resp.json()["message"].lower()
