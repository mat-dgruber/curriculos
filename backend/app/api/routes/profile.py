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
    CandidateProfileCreate,
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
        cv_extracted_text=profile.cv_extracted_text,
        is_paused=profile.is_paused,
        paused_until=profile.paused_until,
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


@router.post("/profile", response_model=CandidateProfileRead)
async def create_profile(
    body: CandidateProfileCreate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CandidateProfile).limit(1))
    profile = result.scalar_one_or_none()
    if profile:
        raise HTTPException(status_code=400, detail="Perfil já existe")

    new_profile = CandidateProfile(
        name=body.name,
        email=body.email,
        phone=body.phone,
        location=body.location,
        target_role=body.target_role,
        linkedin_url=body.linkedin_url,
        keywords=json.dumps(body.keywords) if body.keywords else json.dumps([]),
        target_roles=json.dumps(body.target_roles) if body.target_roles else json.dumps([]),
        preferred_locations=json.dumps(body.preferred_locations) if body.preferred_locations else json.dumps([]),
        scan_interval_hours=body.scan_interval_hours,
        auto_apply=body.auto_apply,
        auto_delete_days=body.auto_delete_days,
    )
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)
    return _profile_to_read(new_profile)


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

    # Extract and cache text in the database profile
    try:
        from app.utils.pdf_handler import extract_text_from_bytes
        profile.cv_extracted_text = extract_text_from_bytes(content)
    except Exception:
        profile.cv_extracted_text = ""

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


DEFAULT_KEYWORDS = ["Excel", "Atendimento", "Gestão", "Comunicação", "Vendas", "Organização", "Prospecção", "Planejamento", "Python", "Inglês"]
DEFAULT_ROLES = ["Auxiliar Administrativo", "Vendedor", "Analista Financeiro", "Assistente de RH", "Desenvolvedor Fullstack", "Gerente de Projetos"]
DEFAULT_LOCATIONS = ["Remoto", "São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR", "Híbrido"]

SUGGESTIONS_CLUSTERS = [
    {
        "keys": ["rh", "recursos humanos", "recrutador", "recrutamento", "dp", "departamento pessoal", "talent acquisition", "human resources", "pessoal"],
        "keywords": ["Recrutamento", "Seleção", "Departamento Pessoal", "Admissão", "Demissão", "Benefícios", "Folha de Pagamento", "Treinamento", "Clima Organizacional", "Endomarketing", "Gupy", "LinkedIn"],
        "roles": ["Auxiliar de RH", "Assistente de RH", "Analista de RH", "Recrutador", "Analista de Departamento Pessoal", "Business Partner", "Coordenador de RH"]
    },
    {
        "keys": ["financeiro", "finanças", "contas", "faturamento", "tesouraria", "contabilidade", "contábil", "fiscal", "finance", "audit", "planejamento financeiro", "caixa"],
        "keywords": ["Contas a Pagar", "Contas a Receber", "Fluxo de Caixa", "Conciliação Bancária", "DRE", "Faturamento", "Excel", "Planejamento Financeiro", "Auditoria", "Fisco", "ERP"],
        "roles": ["Analista Financeiro", "Assistente Financeiro", "Auxiliar Financeiro", "Analista Fiscal", "Analista Contábil", "Gerente Financeiro", "Coordenador Financeiro"]
    },
    {
        "keys": ["adm", "administrativo", "administração", "recepcionista", "secretária", "secretaria", "auxiliar de escritório", "escritorio", "office", "atendimento ao cliente"],
        "keywords": ["Rotinas Administrativas", "Atendimento ao Cliente", "Excel", "Controle de Arquivos", "Agendamento", "Redação Oficial", "Controle de Estoque", "Organização", "Word"],
        "roles": ["Auxiliar Administrativo", "Assistente Administrativo", "Recepcionista", "Analista Administrativo", "Secretária", "Office Assistant"]
    },
    {
        "keys": ["vendas", "comercial", "vendedor", "sdr", "inside sales", "compras", "comprador", "negociação", "sales", "loja", "balcão", "atendente"],
        "keywords": ["Vendas", "Atendimento", "Negociação", "Prospecção", "CRM", "Pós-venda", "Metas", "Funil de Vendas", "Cold Call", "Comercial"],
        "roles": ["Vendedor", "Consultor de Vendas", "SDR (Sales Development)", "Assistente Comercial", "Gerente Comercial", "Comprador", "Atendente de Loja"]
    },
    {
        "keys": ["marketing", "social media", "publicidade", "propaganda", "designer", "design", "redator", "criação", "growth", "tráfego"],
        "keywords": ["Redes Sociais", "Tráfego Pago", "SEO", "Copywriting", "Photoshop", "Illustrator", "Branding", "Marketing Digital", "Criação de Conteúdo", "Canva"],
        "roles": ["Analista de Marketing", "Social Media", "Designer Gráfico", "Assistente de Marketing", "Redator", "UX/UI Designer", "Analista de Growth"]
    },
    {
        "keys": ["suporte", "atendimento", "customer success", "cs", "sac", "helpdesk", "telemarketing", "call center", "suporte técnico"],
        "keywords": ["Atendimento ao Cliente", "Resolução de Problemas", "SLA", "Helpdesk", "Zendesk", "Comunicação Empática", "Pós-venda", "Feedback", "Telefone"],
        "roles": ["Analista de Suporte", "Analista de Customer Success", "Atendente de SAC", "Operador de Telemarketing", "Supervisor de Atendimento", "Analista de Suporte Técnico"]
    },
    {
        "keys": ["projeto", "projetos", "project", "product", "produto", "scrum", "agile", "ágil"],
        "keywords": ["Gestão de Projetos", "Scrum", "Agile", "Jira", "KPIs", "Cronograma", "Roadmap", "Metodologias Ágeis", "Product Backlog", "Trello"],
        "roles": ["Gerente de Projetos", "Product Owner", "Product Manager", "Scrum Master", "Analista de Projetos", "Coordenador de Projetos"]
    },
    {
        "keys": ["desenvolvedor", "frontend", "backend", "fullstack", "software", "programador", "dev", "tech", "web", "angular", "react", "python", "node", "java", "php", "c#", ".net", "dados", "analista de dados", "infraestrutura", "cloud", "devops"],
        "keywords": ["Python", "Angular", "React", "TypeScript", "Docker", "AWS", "PostgreSQL", "Node.js", "FastAPI", "Java", "C#", "Git", "SQL"],
        "roles": ["Desenvolvedor Fullstack", "Desenvolvedor Frontend", "Desenvolvedor Backend", "Engenheiro de Software", "Tech Lead", "Analista de Sistemas"]
    }
]

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

    text = profile.cv_extracted_text or ""
    # Try to load PDF text if it exists on disk and wasn't cached yet
    if not text.strip() and profile.cv_filename:
        filepath = os.path.join(CV_DIR, f"{profile.id}.pdf")
        if os.path.exists(filepath):
            try:
                from app.utils.pdf_handler import extract_text_from_pdf
                text = extract_text_from_pdf(filepath)
                profile.cv_extracted_text = text
                await db.commit()
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

    import re
    text_lower = text.lower()
    target_role_lower = (profile.target_role or "").lower()

    # Find the best suggestions cluster
    matched_cluster = None
    if target_role_lower:
        for cluster in SUGGESTIONS_CLUSTERS:
            if any(key in target_role_lower for key in cluster["keys"]):
                matched_cluster = cluster
                break

    if not matched_cluster and text_lower:
        for cluster in SUGGESTIONS_CLUSTERS:
            if any(key in text_lower for key in cluster["keys"]):
                matched_cluster = cluster
                break

    # Extract specific words from the target role
    role_words = []
    if profile.target_role:
        clean_role_name = re.sub(
            r'\b(júnior|pleno|sênior|jr|sr|pl|intern|estagiário|estagiario|de|para|com|em|do|da|dos|das|o|a)\b', 
            '', 
            profile.target_role, 
            flags=re.IGNORECASE
        ).strip()
        clean_role_name = re.sub(r'\s+', ' ', clean_role_name)
        role_words = [w.capitalize() for w in clean_role_name.split() if len(w) > 2]

    # Initialize lists
    keywords = []
    roles = []

    if matched_cluster:
        keywords = list(matched_cluster["keywords"])
        roles = list(matched_cluster["roles"])

        # Inject words from user's target role so it matches their specific job title variations
        for word in role_words:
            if word not in keywords:
                keywords.insert(0, word)
        if profile.target_role and profile.target_role not in roles:
            roles.insert(0, profile.target_role)
    elif profile.target_role:
        # Dynamic suggestions for completely custom roles
        role_base = profile.target_role.strip()
        clean_role = re.sub(r'\b(júnior|pleno|sênior|jr|sr|pl|intern|estagiário|estagiario)\b', '', role_base, flags=re.IGNORECASE).strip()
        clean_role = re.sub(r'\s+', ' ', clean_role)

        roles = [
            role_base,
            f"Analista de {clean_role}" if not clean_role.lower().startswith(("analista", "auxiliar", "assistente", "gerente", "coordenador")) else f"{clean_role} Sênior",
            f"Assistente de {clean_role}" if not clean_role.lower().startswith(("assistente", "auxiliar", "gerente")) else f"{clean_role} Pleno",
            f"Consultor de {clean_role}" if not clean_role.lower().startswith(("consultor", "gerente")) else f"{clean_role} Sênior",
            f"{clean_role} Sênior",
            f"{clean_role} Pleno",
            f"{clean_role} Júnior"
        ]

        keywords = list(role_words)

        dynamic_industry_keywords = {
            "profess": ["Ensino", "Didática", "Aulas", "Metodologia", "Educação", "Planejamento Pedagógico"],
            "medic": ["Saúde", "Atendimento", "Prontuário", "Clínica", "Enfermagem", "Triagem"],
            "enfer": ["Saúde", "Atendimento", "Prontuário", "Clínica", "Enfermagem", "Triagem", "Cuidado"],
            "advog": ["Jurídico", "Processos", "Petições", "Audiências", "Direito", "Contratos", "Assessoria"],
            "direit": ["Jurídico", "Processos", "Petições", "Audiências", "Direito", "Contratos", "Assessoria"],
            "motor": ["Logística", "Transporte", "Rotas", "Carga", "Trânsito", "Manutenção Preventiva"],
            "profission": ["Atendimento", "Organização", "Comunicação", "Excel", "Gestão"],
            "nutri": ["Nutrição", "Dieta", "Avaliação Nutricional", "Cardápios", "Saúde", "Atendimento"],
            "psic": ["Psicologia", "Terapia", "Avaliação Psicológica", "Clínica", "Recrutamento", "Saúde Mental"],
            "cozinh": ["Gastronomia", "Preparo de Alimentos", "Higiene", "Organização", "Cardápios", "Cozinha"],
            "chefe": ["Gastronomia", "Preparo de Alimentos", "Higiene", "Organização", "Cardápios", "Cozinha"],
            "estet": ["Estética", "Atendimento", "Beleza", "Procedimentos", "Cosmetologia"],
        }

        added_industry_kws = False
        for key, kws in dynamic_industry_keywords.items():
            if key in target_role_lower:
                keywords.extend(kws)
                added_industry_kws = True
                break

        if not added_industry_kws:
            keywords.extend(["Atendimento", "Gestão", "Excel", "Planejamento", "Organização", "Comunicação", "Trabalho em Equipe"])
    else:
        # Absolute fallback to general defaults
        keywords = list(DEFAULT_KEYWORDS)
        roles = list(DEFAULT_ROLES)

    # Filter/order by matching text (like CV)
    matched_keywords = []
    for kw in keywords:
        escaped = re.escape(kw)
        if kw.lower() in ("c#", ".net", "next.js", "node.js"):
            pattern = rf"{escaped}"
        else:
            pattern = rf"\b{escaped}\b"

        if re.search(pattern, text_lower, re.IGNORECASE):
            matched_keywords.append(kw)

    for kw in keywords:
        if kw not in matched_keywords:
            matched_keywords.append(kw)
    matched_keywords = matched_keywords[:10]

    matched_roles = []
    for r in roles:
        if r.lower() in text_lower:
            matched_roles.append(r)

    for r in roles:
        if r not in matched_roles:
            matched_roles.append(r)
    matched_roles = matched_roles[:5]

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

    if not matched_locations:
        matched_locations = DEFAULT_LOCATIONS[:3]

    # Convert to unique list using set to avoid duplicates while retaining case
    return CVSuggestionsResponse(
        keywords=list(dict.fromkeys(matched_keywords)),
        target_roles=list(dict.fromkeys(matched_roles)),
        preferred_locations=list(dict.fromkeys(matched_locations))
    )
