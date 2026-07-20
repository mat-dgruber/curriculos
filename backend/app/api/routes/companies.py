import math
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.company import (
    FixedCompany,
    FixedCompanyCreate,
    FixedCompanyRead,
    FixedCompanyUpdate,
    FixedCompanyListResponse,
)

router = APIRouter()


@router.get("/companies", response_model=FixedCompanyListResponse)
async def list_companies(
    status: str = Query(""),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(FixedCompany)

    if status:
        query = query.where(FixedCompany.status == status)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(FixedCompany.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    companies = result.scalars().all()

    return FixedCompanyListResponse(
        items=[FixedCompanyRead.model_validate(c) for c in companies],
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total > 0 else 0,
    )


@router.post("/companies", status_code=201, response_model=FixedCompanyRead)
async def create_company(body: FixedCompanyCreate, db: AsyncSession = Depends(get_db)):
    company = FixedCompany(
        id=str(uuid4()),
        name=body.name,
        application_url=body.application_url,
        email=body.email,
        interval_days=body.interval_days,
        notes=body.notes,
        next_send_at=datetime.utcnow() + timedelta(days=body.interval_days),
    )
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return FixedCompanyRead.model_validate(company)


@router.put("/companies/{company_id}", response_model=FixedCompanyRead)
async def update_company(
    company_id: str,
    body: FixedCompanyUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FixedCompany).where(FixedCompany.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)

    if "interval_days" in update_data and company.last_sent_at:
        company.next_send_at = company.last_sent_at + timedelta(
            days=update_data["interval_days"]
        )

    await db.commit()
    await db.refresh(company)
    return FixedCompanyRead.model_validate(company)


@router.delete("/companies/{company_id}")
async def delete_company(company_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FixedCompany).where(FixedCompany.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    await db.delete(company)
    await db.commit()
    return {"message": "Empresa removida", "id": company_id}


@router.put("/companies/{company_id}/toggle", response_model=FixedCompanyRead)
async def toggle_company(company_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FixedCompany).where(FixedCompany.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    if company.status == "Respondeu":
        raise HTTPException(
            status_code=409,
            detail="Empresa já respondeu — não pode ser reativada",
        )

    company.is_active = not company.is_active
    company.status = "Ativo" if company.is_active else "Pausado"

    await db.commit()
    await db.refresh(company)
    return FixedCompanyRead.model_validate(company)


@router.post("/companies/{company_id}/record-sent", response_model=FixedCompanyRead)
async def record_sent(company_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FixedCompany).where(FixedCompany.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    company.total_sent += 1
    company.last_sent_at = datetime.utcnow()
    company.next_send_at = datetime.utcnow() + timedelta(days=company.interval_days)

    await db.commit()
    await db.refresh(company)
    return FixedCompanyRead.model_validate(company)


@router.post("/companies/{company_id}/test-automation")
async def test_automation(company_id: str, db: AsyncSession = Depends(get_db)):
    from app.services.recurring_service import run_single_company_send

    res = await run_single_company_send(company_id, db)
    if "error" in res and not res.get("success", False):
        raise HTTPException(status_code=400, detail=res["error"])
    return res


@router.get("/companies/{company_id}/last-screenshot")
async def get_last_screenshot(company_id: str, db: AsyncSession = Depends(get_db)):
    import os
    from app.models.application import Application

    result = await db.execute(
        select(Application)
        .where(
            Application.fixed_company_id == company_id,
            Application.screenshot_path.is_not(None),
        )
        .order_by(Application.created_at.desc())
        .limit(1)
    )
    application = result.scalar_one_or_none()
    if not application or not application.screenshot_path:
        raise HTTPException(
            status_code=404,
            detail="Nenhum screenshot encontrado para esta empresa",
        )

    filename = os.path.basename(application.screenshot_path)
    return {
        "screenshotPath": filename,
        "status": application.status,
        "sentAt": application.sent_at.isoformat() if application.sent_at else None,
    }


@router.post("/companies/check-emails")
async def check_emails():
    from app.services.imap_service import check_company_responses
    res = await check_company_responses()
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

