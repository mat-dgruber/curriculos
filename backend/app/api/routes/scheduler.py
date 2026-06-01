from datetime import datetime
from fastapi import APIRouter, HTTPException

from app.services.scheduler_service import (
    get_scheduler_status,
    trigger_job,
    pause_scheduler,
    resume_scheduler,
)

router = APIRouter()


@router.get("/scheduler/status")
async def get_status():
    return get_scheduler_status()


@router.post("/scheduler/trigger/{job_id}", status_code=202)
async def trigger_job_endpoint(job_id: str):
    valid_jobs = ["scan_jobs", "recurring_send"]
    if job_id not in valid_jobs:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' não encontrado")

    success = await trigger_job(job_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' não encontrado")

    return {
        "message": f"Job '{job_id}' disparado manualmente",
        "jobId": job_id,
        "status": "running",
    }


@router.put("/scheduler/pause")
async def pause_endpoint():
    pause_scheduler()
    return {"message": "Agendador pausado"}


@router.delete("/scheduler/pause")
async def resume_endpoint():
    resume_scheduler()
    return {"message": "Agendador retomado", "isRunning": True}
