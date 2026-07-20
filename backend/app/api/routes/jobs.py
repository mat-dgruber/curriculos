import math
from fastapi import APIRouter, Depends, Query, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.job import Job, JobRead, JobUpdate, JobListResponse
from app.models.rejected_job import (
    RejectedJob,
    RejectRequest,
    RejectBatchRequest,
    RejectByFilterRequest,
    RejectedJobRead,
)

router = APIRouter()


def _job_to_read(j: Job) -> JobRead:
    from app.services.classifier import classify_job
    read_obj = JobRead.model_validate(j)
    classification = classify_job(j.title, j.description or "")
    read_obj.seniority = classification["seniority"]
    read_obj.area = classification["area"]
    read_obj.diversity_category = classification["diversity_category"]
    return read_obj


@router.get("/jobs", response_model=JobListResponse)
async def list_jobs(
    search: str = Query("", description="Busca por título ou empresa"),
    min_score: int = Query(0, ge=0, le=100),
    platform: str = Query(""),
    status: str = Query(""),
    sort_by: str = Query("found_at", description="Campo para ordenação"),
    sort_order: str = Query("desc", description="asc ou desc"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=1000),
    is_favorite: bool | None = Query(None, description="Filtrar por favoritos"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Job)

    if search:
        safe_search = search.replace("%", "\\%").replace("_", "\\_")
        query = query.where(
            or_(
                Job.title.ilike(f"%{safe_search}%", escape="\\"),
                Job.company.ilike(f"%{safe_search}%", escape="\\"),
            )
        )
    if min_score > 0:
        query = query.where(Job.score >= min_score)
    if platform:
        query = query.where(Job.platform == platform)
    if status:
        query = query.where(Job.status == status)
    if is_favorite is not None:
        query = query.where(Job.is_favorite == is_favorite)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    sort_column = getattr(Job, sort_by, Job.found_at)
    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    jobs = result.scalars().all()

    return JobListResponse(
        items=[_job_to_read(j) for j in jobs],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total > 0 else 0,
    )


# --- Static routes (before {job_id} to avoid conflicts) ---


@router.get("/jobs/rejected")
async def list_rejected(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    count_result = await db.execute(select(func.count()).select_from(RejectedJob))
    total = count_result.scalar() or 0

    query = (
        select(RejectedJob)
        .order_by(RejectedJob.rejected_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [RejectedJobRead.model_validate(r) for r in items],
        "total": total,
        "page": page,
        "perPage": per_page,
        "pages": math.ceil(total / per_page) if total > 0 else 0,
    }


@router.put("/jobs/rejected/{rejected_id}/reason")
async def update_rejected_reason(
    rejected_id: str,
    payload: RejectRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(RejectedJob).where(RejectedJob.id == rejected_id))
    rejected = result.scalar_one_or_none()
    if not rejected:
        raise HTTPException(status_code=404, detail="Registro não encontrado")

    rejected.reason = payload.reason
    if payload.notes is not None:
        rejected.notes = payload.notes
    await db.commit()
    await db.refresh(rejected)
    return RejectedJobRead.model_validate(rejected)


@router.post("/jobs/reject-batch")
async def reject_batch(
    payload: RejectBatchRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id.in_(payload.job_ids)))
    jobs = result.scalars().all()

    for job in jobs:
        rejected = RejectedJob(
            original_job_id=job.id,
            url=job.url,
            title=job.title,
            company=job.company,
            location=job.location,
            platform=job.platform,
            score=job.score,
            reason=payload.reason,
            notes=payload.notes,
        )
        db.add(rejected)
        await db.delete(job)

    await db.commit()
    return {"message": f"{len(jobs)} vagas excluídas", "deleted": len(jobs)}


@router.post("/jobs/reject-by-filter")
async def reject_by_filter(
    payload: RejectByFilterRequest,
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timedelta

    query = select(Job)
    conditions = []

    if payload.max_score is not None:
        conditions.append(Job.score < payload.max_score)

    if payload.older_than_days is not None:
        cutoff = datetime.utcnow() - timedelta(days=payload.older_than_days)
        conditions.append(Job.found_at < cutoff)

    if payload.non_favorites_only:
        conditions.append(~Job.is_favorite)

    if conditions:
        query = query.where(or_(*conditions))

    result = await db.execute(query)
    jobs = result.scalars().all()

    for job in jobs:
        rejected = RejectedJob(
            original_job_id=job.id,
            url=job.url,
            title=job.title,
            company=job.company,
            location=job.location,
            platform=job.platform,
            score=job.score,
            reason=payload.reason,
            notes=payload.notes,
        )
        db.add(rejected)
        await db.delete(job)

    await db.commit()
    return {"message": f"{len(jobs)} vagas excluídas", "deleted": len(jobs)}


@router.post("/jobs/scan", status_code=202)
async def trigger_scan():
    import asyncio
    from app.services.scan_service import run_scan
    from app.services import scan_state

    if scan_state.get_status()["status"] == "running":
        raise HTTPException(status_code=409, detail="Scan já está em execução")

    async def _run():
        scan_state.set_running()
        try:
            result = await run_scan()
            scan_state.set_completed(result)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Scan failed: {e}")
            scan_state.set_failed(str(e))

    asyncio.create_task(_run())
    return {
        "message": "Varredura iniciada em background",
        "status": "running",
    }


@router.get("/jobs/scan/status")
async def get_scan_status():
    from app.services import scan_state
    return scan_state.get_status()


@router.post("/jobs/enrich", status_code=202)
async def enrich_descriptions():
    """Enriquece vagas existentes que estão sem descrição."""
    import asyncio
    from app.services.enrichment_service import enrich_missing_descriptions

    async def _run():
        try:
            await enrich_missing_descriptions(limit=50)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Enrichment failed: {e}")

    asyncio.create_task(_run())
    return {
        "message": "Enriquecimento de descrições iniciado em background",
        "status": "running",
    }


@router.post("/jobs/auto-delete/preview")
async def auto_delete_preview(db: AsyncSession = Depends(get_db)):
    from app.models.profile import CandidateProfile
    from app.services.auto_delete_service import preview_auto_delete

    result = await db.execute(select(CandidateProfile).limit(1))
    profile = result.scalar_one_or_none()
    days = profile.auto_delete_days if profile else 30

    preview = await preview_auto_delete(db, days)
    return {"autoDeleteDays": days, "wouldDelete": preview["would_delete"]}


@router.post("/jobs/auto-delete/run")
async def auto_delete_run(db: AsyncSession = Depends(get_db)):
    from app.models.profile import CandidateProfile
    from app.services.auto_delete_service import run_auto_delete

    result = await db.execute(select(CandidateProfile).limit(1))
    profile = result.scalar_one_or_none()
    days = profile.auto_delete_days if profile else 30

    delete_result = await run_auto_delete(db, days)
    return delete_result


class AiMatchResponse(BaseModel):
    match_score: int
    matches: list[str]
    gaps: list[str]
    cold_mail: str
    interview_advice: str


@router.get("/jobs/{job_id}/ai-match", response_model=AiMatchResponse)
async def get_job_ai_match(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")

    # Busca o perfil do candidato cadastrado
    from app.models.profile import CandidateProfile
    result_profile = await db.execute(select(CandidateProfile).limit(1))
    profile = result_profile.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de candidato não encontrado")

    from app.services.match_analyser import analyse_match
    analysis = await analyse_match(
        job_title=job.title,
        job_description=job.description or "",
        company=job.company,
        cv_text=profile.cv_extracted_text or "",
        candidate_name=profile.name,
        profile_keywords=profile.get_keywords_list()
    )

    return AiMatchResponse(**analysis)


# --- Dynamic routes ({job_id}) ---


@router.get("/jobs/{job_id}", response_model=JobRead)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    return _job_to_read(job)


@router.patch("/jobs/{job_id}", response_model=JobRead)
async def update_job(
    job_id: str, payload: JobUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    await db.commit()
    await db.refresh(job)
    return _job_to_read(job)


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")

    try:
        body = await request.json()
    except Exception:
        body = {}

    reason = body.get("reason", "incompativel")
    notes = body.get("notes")

    rejected = RejectedJob(
        original_job_id=job.id,
        url=job.url,
        title=job.title,
        company=job.company,
        location=job.location,
        platform=job.platform,
        score=job.score,
        reason=reason,
        notes=notes,
    )
    db.add(rejected)
    await db.delete(job)
    await db.commit()
    return {"message": "Vaga excluída"}
