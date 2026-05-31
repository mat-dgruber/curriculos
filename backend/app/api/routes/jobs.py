import math
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.job import Job, JobRead, JobListResponse

router = APIRouter()


@router.get("/jobs", response_model=JobListResponse)
async def list_jobs(
    search: str = Query("", description="Busca por título ou empresa"),
    min_score: int = Query(0, ge=0, le=100),
    platform: str = Query(""),
    status: str = Query(""),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Job)

    if search:
        query = query.where(
            or_(
                Job.title.ilike(f"%{search}%"),
                Job.company.ilike(f"%{search}%"),
            )
        )
    if min_score > 0:
        query = query.where(Job.score >= min_score)
    if platform:
        query = query.where(Job.platform == platform)
    if status:
        query = query.where(Job.status == status)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Job.found_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    jobs = result.scalars().all()

    return JobListResponse(
        items=[JobRead.model_validate(j) for j in jobs],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total > 0 else 0,
    )


@router.get("/jobs/{job_id}", response_model=JobRead)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    return JobRead.model_validate(job)


@router.post("/jobs/scan", status_code=202)
async def trigger_scan(db: AsyncSession = Depends(get_db)):
    return {
        "message": "Varredura iniciada em background",
        "status": "running",
    }
