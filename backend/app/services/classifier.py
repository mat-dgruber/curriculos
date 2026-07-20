import re

# Dicionários de palavras-chave para classificação rápida e precisa
SENIORITY_PATTERNS = [
    (r"\b(estag[ií]|intern|trainee|aprendiz)", "Estágio"),
    (r"\b(junior|júnior|jr|i)\b", "Júnior"),
    (r"\b(pleno|pl|ii)\b", "Pleno"),
    (r"\b(senior|sênior|sr|iii)\b", "Sênior"),
    (r"\b(especialista|specialist|lead|lider|líder|principal|staff|architect|arquiteto)\b", "Especialista")
]

AREA_PATTERNS = [
    (r"\b(frontend|front-end|angular|react|vue|javascript|typescript|js|ts|css|html|web)\b", "Frontend"),
    (r"\b(backend|back-end|python|django|fastapi|flask|java|spring|node|express|c#|asp\.net|\.net|golang|go|rust|php|laravel|ruby|rails)\b", "Backend"),
    (r"\b(fullstack|full-stack|full\s+stack)\b", "Fullstack"),
    (r"\b(mobile|android|ios|flutter|kotlin|swift|react\s+native)\b", "Mobile"),
    (r"\b(devops|cloud|aws|azure|gcp|docker|kubernetes|sre|ci/cd|jenkins|terraform|ansible)\b", "DevOps"),
    (r"\b(dados|data|analytics|machine\s+learning|ml|ai|ia|deep\s+learning|python\s+data|sql|postgres|oracle|nosql|mongodb|redis|cassandra|elasticsearch|hadoop|spark|databricks|power\s+bi|tableau)\b", "Dados"),
    (r"\b(qa|testes|teste|testing|tester|cypress|selenium|quality\s+assurance|automation\s+test)\b", "QA")
]

DIVERSITY_PATTERNS = [
    (r"\b(pcd|p\.c\.d\.|pessoas?\s+com\s+defici[eê]ncia|vaga\s+exclusiva\s+para\s+pcd)\b", "PCD"),
    (r"\b(mulher(es)?|g[eê]nero\s+feminino|vaga\s+afirmativa\s+para\s+mulheres)\b", "Mulheres"),
    (r"\b(negros?|pretos?|pardas?|afrodescendente|vaga\s+afirmativa\s+para\s+negros)\b", "Pretos/Pardas"),
    (r"\b(lgbt|lgbtqia\+|g[eê]nero\s+diverso|vaga\s+afirmativa\s+lgbt)\b", "LGBTQIA+"),
    (r"\b(50\+|gera[cç][aã]o\s+50\+|senior\s+50\+)\b", "50+"),
    (r"\b(afirmativa|diversidade|grupos?\s+sub-representados)\b", "Ação Afirmativa")
]

def classify_job(title: str, description: str) -> dict:
    """
    Classifica de forma determinística e sênior a vaga quanto a:
    - Senioridade (Estágio, Júnior, Pleno, Sênior, Especialista ou Não Especificado)
    - Área de Atuação (Frontend, Backend, Fullstack, Mobile, DevOps, Dados, QA ou Outra)
    - Diversidade / Grupo Afirmativo (PCD, Mulheres, Pretos/Pardas, LGBTQIA+, 50+, Ação Afirmativa ou Geral)
    """
    text = f"{title} {description}".lower()

    # 1. Classificar Senioridade
    # Verifica primeiro o título para evitar falso positivo do corpo da vaga
    title_lower = title.lower()
    seniority = "Não Especificado"
    for pattern, name in SENIORITY_PATTERNS:
        if re.search(pattern, title_lower):
            seniority = name
            break
    if seniority == "Não Especificado":
        # Se não achou no título, pesquisa na descrição
        for pattern, name in SENIORITY_PATTERNS:
            if re.search(pattern, text):
                seniority = name
                break

    # 2. Classificar Área de Atuação
    # Dá preferência ao título também
    area = "Outra"
    for pattern, name in AREA_PATTERNS:
        if re.search(pattern, title_lower):
            area = name
            break
    if area == "Outra":
        # Busca no corpo do texto
        for pattern, name in AREA_PATTERNS:
            if re.search(pattern, text):
                area = name
                break

    # 3. Classificar Ações Afirmativas / PCD / Grupos Específicos
    diversity = "Geral"
    # Foca primeiro em termos exclusivos do título ou marcadores explícitos no texto
    for pattern, name in DIVERSITY_PATTERNS:
        if re.search(pattern, text):
            diversity = name
            break

    return {
        "seniority": seniority,
        "area": area,
        "diversity_category": diversity
    }
