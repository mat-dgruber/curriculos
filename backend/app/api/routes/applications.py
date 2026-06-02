import math
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.application import (
    Application,
    ApplicationCreate,
    ApplicationRead,
    ApplicationStatusUpdate,
    ApplicationListResponse,
)
from app.models.application_click import ApplicationClick
from app.models.job import Job

router = APIRouter()


async def _get_click_counts(db: AsyncSession, app_ids: list[str]) -> dict[str, int]:
    if not app_ids:
        return {}
    click_counts_query = (
        select(
            ApplicationClick.application_id,
            func.count(ApplicationClick.id).label("cnt"),
        )
        .where(ApplicationClick.application_id.in_(app_ids))
        .group_by(ApplicationClick.application_id)
    )
    result = await db.execute(click_counts_query)
    return {row[0]: row[1] for row in result.all()}


def _to_read(a: Application, click_count: int = 0) -> ApplicationRead:
    data = ApplicationRead.model_validate(a)
    if a.is_recurring or a.job_id == "recurring":
        data.job_title = "Candidatura Recorrente"
    else:
        data.job_title = a.job.title if a.job else ""
    data.click_count = click_count
    return data


@router.get("/applications", response_model=ApplicationListResponse)
async def list_applications(
    status: str = Query(""),
    search: str = Query(""),
    date_from: str = Query(""),
    date_to: str = Query(""),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    query = select(Application).options(selectinload(Application.job))

    if status:
        query = query.where(Application.status == status)
    if search:
        query = query.join(Application.job).where(
            Job.title.ilike(f"%{search}%")
            | Application.company_name.ilike(f"%{search}%")
        )
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

    # Batch fetch click counts for all applications in this page
    app_ids = [a.id for a in applications]
    click_counts = await _get_click_counts(db, app_ids)

    return ApplicationListResponse(
        items=[_to_read(a, click_counts.get(a.id, 0)) for a in applications],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total > 0 else 0,
    )


@router.get("/applications/{application_id}", response_model=ApplicationRead)
async def get_application(
    application_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .options(selectinload(Application.job))
        .where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")

    click_counts = await _get_click_counts(db, [application_id])
    return _to_read(application, click_counts.get(application_id, 0))


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
    application.job = job
    return _to_read(application)


@router.put(
    "/applications/{application_id}/status", response_model=ApplicationRead
)
async def update_application_status(
    application_id: str,
    body: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .options(selectinload(Application.job))
        .where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")

    valid_transitions = {
        "Pendente": ["Enviado", "Falhou", "Arquivado"],
        "Enviado": ["Arquivado", "Falhou"],
        "Falhou": ["Pendente", "Enviado", "Arquivado"],
        "Arquivado": ["Pendente"],
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

    click_counts = await _get_click_counts(db, [application_id])
    return _to_read(application, click_counts.get(application_id, 0))


@router.post("/applications/{application_id}/click", response_model=ApplicationRead)
async def register_click(
    application_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .options(selectinload(Application.job))
        .where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")

    click = ApplicationClick(
        id=str(uuid4()),
        application_id=application_id,
        clicked_at=datetime.utcnow(),
    )
    db.add(click)
    await db.commit()

    click_counts = await _get_click_counts(db, [application_id])
    return _to_read(application, click_counts.get(application_id, 0))


@router.delete("/applications/{application_id}", response_model=ApplicationRead)
async def archive_application(
    application_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .options(selectinload(Application.job))
        .where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")

    if application.status == "Arquivado":
        raise HTTPException(status_code=409, detail="Candidatura já arquivada")

    application.status = "Arquivado"
    await db.commit()
    await db.refresh(application)

    click_counts = await _get_click_counts(db, [application_id])
    return _to_read(application, click_counts.get(application_id, 0))
