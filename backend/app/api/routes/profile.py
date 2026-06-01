import json
import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.profile import (
    CandidateProfile,
    CandidateProfileRead,
    CandidateProfileUpdate,
)

router = APIRouter()

MAX_CV_SIZE = 10 * 1024 * 1024  # 10 MB
CV_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "storage", "cv")


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
        auto_delete_days=profile.auto_delete_days,
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

    # Track old scan interval to see if it changed
    old_interval = profile.scan_interval_hours

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ("keywords", "target_roles", "preferred_locations"):
            setattr(profile, field, json.dumps(value) if value is not None else None)
        else:
            setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)

    # Dynamic rescheduling if interval changed
    new_interval = profile.scan_interval_hours
    if new_interval != old_interval:
        try:
            from app.services.scheduler_service import reschedule_scan_job
            reschedule_scan_job(new_interval)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to reschedule scan job: {e}")

    return _profile_to_read(profile)


@router.post("/profile/cv")
async def upload_cv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    # Validate MIME type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=415,
            detail="Apenas arquivos PDF são aceitos",
        )

    # Read file content to validate size
    content = await file.read()
    size_bytes = len(content)

    # Validate max size
    if size_bytes > MAX_CV_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo excede o limite de 10 MB ({size_bytes} bytes recebidos)",
        )

    # Validate PDF Magic Bytes (file signature must start with %PDF)
    if not content.startswith(b"%PDF"):
        raise HTTPException(
            status_code=415,
            detail="Arquivo inválido. Apenas PDFs legítimos são aceitos.",
        )

    # Get the profile
    result = await db.execute(select(CandidateProfile).limit(1))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    # Create storage directory
    os.makedirs(CV_DIR, exist_ok=True)

    # Save file to disk
    filepath = os.path.join(CV_DIR, f"{profile.id}.pdf")
    with open(filepath, "wb") as f:
        f.write(content)

    # Update profile in database
    profile.cv_filename = file.filename
    profile.cv_uploaded_at = datetime.utcnow()
    await db.commit()
    await db.refresh(profile)

    return {
        "message": "Currículo atualizado com sucesso",
        "filename": file.filename,
        "size_bytes": size_bytes,
    }


# Models and Endpoint for dynamic CV suggestions
class CVSuggestionsResponse(BaseModel):
    keywords: list[str]
    target_roles: list[str]
    preferred_locations: list[str]


DEFAULT_KEYWORDS = ["Python", "Angular", "React", "TypeScript", "Docker", "AWS", "PostgreSQL", "RxJS", "Node.js", "FastAPI"]
DEFAULT_ROLES = ["Desenvolvedor Fullstack", "Desenvolvedor Frontend", "Desenvolvedor Backend", "Engenheiro de Software", "Tech Lead"]
DEFAULT_LOCATIONS = ["Remoto", "São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR", "Híbrido"]

NEARBY_CLUSTERS = {
    "tatuí": ["Tatuí, SP", "Boituva, SP", "Sorocaba, SP", "Itapetininga, SP", "Cerquilho, SP", "Porto Feliz, SP"],
    "tatui": ["Tatuí, SP", "Boituva, SP", "Sorocaba, SP", "Itapetininga, SP", "Cerquilho, SP", "Porto Feliz, SP"],
    "sorocaba": ["Sorocaba, SP", "Votorantim, SP", "Itu, SP", "Salto, SP", "Tatuí, SP", "Boituva, SP", "Itapetininga, SP"],
    "itapetininga": ["Itapetininga, SP", "Tatuí, SP", "Sorocaba, SP", "Boituva, SP"],
    "boituva": ["Boituva, SP", "Tatuí, SP", "Cerquilho, SP", "Porto Feliz, SP", "Sorocaba, SP"],
    "campinas": ["Campinas, SP", "Valinhos, SP", "Vinhedo, SP", "Sumaré, SP", "Hortolândia, SP", "Paulínia, SP", "Americana, SP", "Indaiatuba, SP"],
    "santos": ["Santos, SP", "São Vicente, SP", "Guarujá, SP", "Cubatão, SP", "Praia Grande, SP"],
    "são paulo": ["São Paulo, SP", "Guarulhos, SP", "Osasco, SP", "Santo André, SP", "São Bernardo do Campo, SP", "São Caetano do Sul, SP"],
    "sao paulo": ["São Paulo, SP", "Guarulhos, SP", "Osasco, SP", "Santo André, SP", "São Bernardo do Campo, SP", "São Caetano do Sul, SP"],
    "rio de janeiro": ["Rio de Janeiro, RJ", "Niterói, RJ", "Duque de Caxias, RJ", "Nova Iguaçu, RJ", "São Gonçalo, RJ"],
    "belo horizonte": ["Belo Horizonte, MG", "Contagem, MG", "Betim, MG", "Nova Lima, MG", "Sabará, MG"],
}


@router.get("/profile/cv-suggestions", response_model=CVSuggestionsResponse)
async def get_cv_suggestions(db: AsyncSession = Depends(get_db)):
    # 1. Get candidate profile
    result = await db.execute(select(CandidateProfile).limit(1))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    text = ""
    # Try to load PDF text if it exists on disk
    if profile.cv_filename:
        filepath = os.path.join(CV_DIR, f"{profile.id}.pdf")
        if os.path.exists(filepath):
            try:
                from app.utils.pdf_handler import extract_text_from_pdf
                text = extract_text_from_pdf(filepath)
            except Exception:
                pass

    # Fallback: if no PDF text could be retrieved, simulate a text based on existing profile fields
    if not text.strip():
        parts = []
        if profile.target_role:
            parts.append(profile.target_role)
        if profile.location:
            parts.append(profile.location)

        existing_keywords = json.loads(profile.keywords) if profile.keywords else []
        existing_roles = json.loads(profile.target_roles) if profile.target_roles else []
        existing_locations = json.loads(profile.preferred_locations) if profile.preferred_locations else []

        parts.extend(existing_keywords)
        parts.extend(existing_roles)
        parts.extend(existing_locations)

        text = " ".join(parts)

    # Final fallback if both CV and profile fields are completely empty
    if not text.strip():
        return CVSuggestionsResponse(
            keywords=DEFAULT_KEYWORDS,
            target_roles=DEFAULT_ROLES,
            preferred_locations=DEFAULT_LOCATIONS
        )

    # 4. Perform case-insensitive lexical matching
    import re
    text_lower = text.lower()

    # Match keywords
    matched_keywords = []
    for kw in DEFAULT_KEYWORDS:
        escaped = re.escape(kw)
        if kw.lower() in ("c#", ".net", "next.js", "node.js"):
            pattern = rf"{escaped}"
        else:
            pattern = rf"\b{escaped}\b"

        if re.search(pattern, text_lower, re.IGNORECASE):
            matched_keywords.append(kw)

    # Smart technology expansions to provide even richer suggestions
    if "angular" in text_lower:
        for extra in ["TypeScript", "RxJS", "React", "CSS", "HTML"]:
            if extra not in matched_keywords:
                matched_keywords.append(extra)
    if "python" in text_lower:
        for extra in ["FastAPI", "Django", "PostgreSQL", "Docker", "SQL"]:
            if extra not in matched_keywords:
                matched_keywords.append(extra)
    if "react" in text_lower:
        for extra in ["Next.js", "TypeScript", "Tailwind", "Node.js", "JavaScript"]:
            if extra not in matched_keywords:
                matched_keywords.append(extra)

    # Match locations / modalities
    matched_locations = []
    for loc in ["Remoto", "Híbrido", "Presencial"]:
        if loc.lower() in text_lower:
            matched_locations.append(loc)

    # Detect state/city from profile.location (dados pessoais)
    profile_state_detected = None
    profile_city_detected = None
    if profile.location:
        loc_lower = profile.location.lower()
        # Find 2-letter state abbreviations
        for state_code in ["sp", "rj", "mg", "pr", "rs", "sc", "df", "ba", "pe", "ce", "es", "go"]:
            if re.search(rf"\b{state_code}\b", loc_lower):
                profile_state_detected = state_code.upper()
                break

        # Check for major cities
        cities_name_map = {
            "são paulo": ("São Paulo", "SP"),
            "sao paulo": ("São Paulo", "SP"),
            "rio de janeiro": ("Rio de Janeiro", "RJ"),
            "belo horizonte": ("Belo Horizonte", "MG"),
            "curitiba": ("Curitiba", "PR"),
            "porto alegre": ("Porto Alegre", "RS"),
            "florianópolis": ("Florianópolis", "SC"),
            "florianopolis": ("Florianópolis", "SC"),
            "brasília": ("Brasília", "DF"),
            "brasilia": ("Brasília", "DF"),
            "salvador": ("Salvador", "BA"),
            "recife": ("Recife", "PE"),
            "fortaleza": ("Fortaleza", "CE"),
        }
        for city_key, (city_name, state_code) in cities_name_map.items():
            if city_key in loc_lower:
                profile_city_detected = city_name
                profile_state_detected = state_code
                break

    # Add dynamically localized suggestions based on personal data location
    cluster_found = False
    if profile.location:
        loc_lower = profile.location.lower()
        for cluster_key, cities in NEARBY_CLUSTERS.items():
            if cluster_key in loc_lower:
                matched_locations.extend(cities)
                cluster_found = True
                break

    if profile_city_detected and profile_state_detected:
        if not cluster_found:
            matched_locations.append(f"{profile_city_detected}, {profile_state_detected}")
        matched_locations.append(f"Híbrido ({profile_state_detected})")
        matched_locations.append("Remoto")
    elif profile_state_detected:
        state_cities = {
            "SP": "São Paulo, SP",
            "RJ": "Rio de Janeiro, RJ",
            "MG": "Belo Horizonte, MG",
            "PR": "Curitiba, PR",
            "RS": "Porto Alegre, RS",
            "SC": "Florianópolis, SC",
            "DF": "Brasília, DF",
            "BA": "Salvador, BA",
            "PE": "Recife, PE",
            "CE": "Fortaleza, CE",
        }
        main_city = state_cities.get(profile_state_detected)
        if main_city:
            matched_locations.append(main_city)
        matched_locations.append(f"Híbrido ({profile_state_detected})")
        matched_locations.append("Remoto")
    elif profile.location:
        matched_locations.append(profile.location)
        matched_locations.append("Remoto")

    # Check for major cities in CV text as fallback matching
    cities_map = {
        "são paulo": "São Paulo, SP",
        "rio de janeiro": "Rio de Janeiro, RJ",
        "belo horizonte": "Belo Horizonte, MG",
        "curitiba": "Curitiba, PR",
        "porto alegre": "Porto Alegre, RS",
        "florianópolis": "Florianópolis, SC",
        "recife": "Recife, PE",
        "salvador": "Salvador, BA",
        "brasília": "Brasília, DF",
    }
    for city_key, city_full in cities_map.items():
        if city_key in text_lower:
            matched_locations.append(city_full)

    # Match target roles
    matched_roles = []
    for role in DEFAULT_ROLES:
        if role.lower() in text_lower:
            matched_roles.append(role)

    # Apply smart rules
    if "python" in text_lower or "fastapi" in text_lower or "django" in text_lower or "backend" in text_lower or "node" in text_lower:
        if "Desenvolvedor Backend" not in matched_roles:
            matched_roles.append("Desenvolvedor Backend")

    if "angular" in text_lower or "react" in text_lower or "frontend" in text_lower or "typescript" in text_lower:
        if "Desenvolvedor Frontend" not in matched_roles:
            matched_roles.append("Desenvolvedor Frontend")

    if ("Desenvolvedor Backend" in matched_roles or "backend" in text_lower) and \
       ("Desenvolvedor Frontend" in matched_roles or "frontend" in text_lower):
        if "Desenvolvedor Fullstack" not in matched_roles:
            matched_roles.append("Desenvolvedor Fullstack")

    # If list is empty, fill with default values
    if not matched_keywords:
        matched_keywords = DEFAULT_KEYWORDS[:6]
    if not matched_roles:
        matched_roles = DEFAULT_ROLES[:3]
    if not matched_locations:
        matched_locations = DEFAULT_LOCATIONS[:3]

    # Convert to unique list using set to avoid duplicates while retaining case
    return CVSuggestionsResponse(
        keywords=list(dict.fromkeys(matched_keywords)),
        target_roles=list(dict.fromkeys(matched_roles)),
        preferred_locations=list(dict.fromkeys(matched_locations))
    )
