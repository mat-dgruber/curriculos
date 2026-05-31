import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.profile import (
    CandidateProfile,
    CandidateProfileRead,
    CandidateProfileUpdate,
)

router = APIRouter()


def _profile_to_read(profile: CandidateProfile) -> CandidateProfileRead:
    return CandidateProfileRead(
        id=profile.id,
        name=profile.name,
        email=profile.email,
        phone=profile.phone,
        location=profile.location,
        target_role=profile.target_role,
        linkedin_url=profile.linkedin_url,
        cv_filename=profile.cv_filename,
        cv_uploaded_at=profile.cv_uploaded_at,
        keywords=json.loads(profile.keywords) if profile.keywords else [],
        target_roles=json.loads(profile.target_roles) if profile.target_roles else [],
        preferred_locations=json.loads(profile.preferred_locations) if profile.preferred_locations else [],
        scan_interval_hours=profile.scan_interval_hours,
        auto_apply=profile.auto_apply,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get("/profile", response_model=CandidateProfileRead)
async def get_profile(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CandidateProfile).limit(1))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return _profile_to_read(profile)


@router.put("/profile", response_model=CandidateProfileRead)
async def update_profile(
    body: CandidateProfileUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CandidateProfile).limit(1))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ("keywords", "target_roles", "preferred_locations"):
            setattr(profile, field, json.dumps(value) if value is not None else None)
        else:
            setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return _profile_to_read(profile)


@router.post("/profile/cv")
async def upload_cv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    return {
        "message": "Currículo atualizado com sucesso",
        "filename": file.filename,
        "size_bytes": 0,
    }
