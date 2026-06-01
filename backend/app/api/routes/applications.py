import math
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.application import (
    Application,
    ApplicationCreate,
    ApplicationRead,
    ApplicationStatusUpdate,
    ApplicationListResponse,
)
from app.models.job import Job

router = APIRouter()


@router.get("/applications", response_model=ApplicationListResponse)
async def list_applications(
    status: str = Query(""),
    date_from: str = Query(""),
    date_to: str = Query(""),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Application)

    if status:
        query = query.where(Application.status == status)
    if date_from:
        query = query.where(Application.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.where(Application.created_at <= datetime.fromisoformat(date_to))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Application.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    applications = result.scalars().all()

    return ApplicationListResponse(
        items=[ApplicationRead.model_validate(a) for a in applications],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total > 0 else 0,
    )


@router.post("/applications", status_code=201, response_model=ApplicationRead)
async def create_application(
    body: ApplicationCreate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Job).where(Job.id == body.job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")

    existing = await db.execute(
        select(Application).where(Application.job_id == body.job_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409, detail="Candidatura já existe para este job"
        )

    application = Application(
        id=str(uuid4()),
        job_id=body.job_id,
        company_name=job.company,
        status="Pendente",
        notes=body.notes,
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return ApplicationRead.model_validate(application)


@router.put(
    "/applications/{application_id}/status", response_model=ApplicationRead
)
async def update_application_status(
    application_id: str,
    body: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")

    valid_transitions = {
        "Pendente": ["Enviado", "Falhou", "Arquivado"],
        "Enviado": ["Arquivado"],
        "Falhou": ["Pendente", "Arquivado"],
    }
    allowed = valid_transitions.get(application.status, [])
    if body.status not in allowed:
        raise HTTPException(
            status_code=409,
            detail=f"Transição inválida: {application.status} → {body.status}",
        )

    application.status = body.status
    if body.status == "Enviado":
        application.sent_at = datetime.utcnow()
    if body.notes:
        application.notes = body.notes

    await db.commit()
    await db.refresh(application)
    return ApplicationRead.model_validate(application)


@router.delete("/applications/{application_id}", response_model=ApplicationRead)
async def archive_application(
    application_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")

    if application.status == "Arquivado":
        raise HTTPException(status_code=409, detail="Candidatura já arquivada")

    application.status = "Arquivado"
    await db.commit()
    await db.refresh(application)
    return ApplicationRead.model_validate(application)
