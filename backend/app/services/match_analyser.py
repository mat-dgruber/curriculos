import re
import logging
import httpx

logger = logging.getLogger(__name__)

# Palavras-chave de tecnologia mapeadas para análise comparativa
SKILL_KEYWORDS = [
    # Frontend
    "angular", "react", "vue", "javascript", "typescript", "html", "css", "tailwind", "sass", "bootstrap", "rxjs", "ngrx", "pinia", "redux", "jquery",
    # Backend
    "python", "django", "fastapi", "flask", "java", "spring", "node", "express", "golang", "go", "ruby", "rails", "c#", ".net", "php", "laravel", "rust",
    # Bancos de Dados
    "sql", "postgresql", "mysql", "oracle", "mongodb", "redis", "cassandra", "elasticsearch", "sqlite", "mariadb", "firebase",
    # DevOps & Nuvem
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible", "jenkins", "ci/cd", "github actions", "linux", "nginx", "apache",
    # Outros
    "git", "github", "scrum", "agile", "kanban", "rest", "graphql", "microservices", "tdd", "clean code", "unit testing", "jest", "pytest", "junit"
]

def extract_skills_from_text(text: str, additional_keywords: list[str] = None) -> set[str]:
    """Extrai tecnologias e competências de um texto usando expressões regulares."""
    if not text:
        return set()

    text_lower = text.lower()
    found_skills = set()

    # ponytail: mescla as palavras-chave estáticas com as configuradas dinamicamente no perfil do usuário
    search_keywords = list(SKILL_KEYWORDS)
    if additional_keywords:
        for kw in additional_keywords:
            kw_clean = kw.strip().lower()
            if kw_clean and kw_clean not in search_keywords:
                search_keywords.append(kw_clean)

    for skill in search_keywords:
        # Busca a palavra-chave isolada (boundary) para evitar falsos positivos
        pattern = r"\b" + re.escape(skill) + r"\b"
        if skill in [".net", "c#", "gcp", "ci/cd", "github actions"]:
            pattern = re.escape(skill)

        if re.search(pattern, text_lower):
            # Normalização estética (se for palavra conhecida de TI, usa capitalização correta, senão Capitalize)
            if skill in SKILL_KEYWORDS:
                display_name = skill.upper() if len(skill) <= 4 or skill in ["java", "node", "rust", "go", "scrum", "git", "rxjs", "ngrx", "pinia", "redux", "jest", "pytest", "junit"] else skill.capitalize()
                if skill == "javascript": display_name = "JavaScript"
                elif skill == "typescript": display_name = "TypeScript"
                elif skill == "fastapi": display_name = "FastAPI"
                elif skill == "node": display_name = "Node.js"
                elif skill == "ci/cd": display_name = "CI/CD"
                elif skill == "github actions": display_name = "GitHub Actions"
                elif skill == ".net": display_name = ".NET"
                elif skill == "c#": display_name = "C#"
                elif skill == "html": display_name = "HTML"
                elif skill == "css": display_name = "CSS"
                elif skill == "mysql": display_name = "MySQL"
                elif skill == "postgresql": display_name = "PostgreSQL"
                elif skill == "nosql": display_name = "NoSQL"
            else:
                display_name = skill.title() # Capitalização geral para termos de RH/outros

            found_skills.add(display_name)

    return found_skills

async def try_query_ollama(prompt: str) -> str | None:
    """Tenta consultar o Ollama local se estiver ativo."""
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": "qwen2.5-coder:1.5b", # modelo leve e rápido
        "prompt": prompt,
        "stream": False
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=8.0)
            if response.status_code == 200:
                data = response.json()
                return data.get("response")
    except Exception as e:
        logger.debug(f"Ollama offline ou inalcançável: {e}")
    return None

def generate_fallback_cold_mail(candidate_name: str, job_title: str, company: str, matched_skills: list[str]) -> str:
    """Gera uma carta de apresentação altamente personalizada usando um template dinâmico."""
    skills_str = ", ".join(matched_skills[:4]) if matched_skills else "desenvolvimento de software"

    mail_template = f"""Olá, tudo bem?

Espero que sim! Vi a oportunidade para a vaga de **{job_title}** na **{company}** e fiquei muito interessado pelo alinhamento técnico com minha trajetória.

Sou o **{candidate_name}** e possuo sólida experiência com **{skills_str}**, focado em criar soluções limpas, escaláveis e eficientes. Acredito que minha bagagem possa agregar bastante valor aos desafios atuais do time de engenharia da **{company}**.

Gostaria muito de trocar uma ideia rápida para entender melhor as metas do time e compartilhar como posso contribuir! Segue meu LinkedIn para conexão.

Um abraço,
{candidate_name}"""
    return mail_template

def generate_fallback_advice(matched_skills: list[str], missing_skills: list[str], company: str) -> str:
    """Gera dicas de entrevista com base nas tecnologias encontradas e ausentes."""
    advice = f"### 💡 Conselho de Ouro para a {company}\n\n"

    if matched_skills:
        skills_str = ", ".join(matched_skills[:3])
        advice += f"1. **Destaque seus Pontos Fortes:** Na sua entrevista, prepare exemplos práticos de projetos que você construiu usando **{skills_str}**. Recrutadores adoram histórias reais de problemas de produção resolvidos.\n"
    else:
        advice += "1. **Mostre Capacidade de Aprendizado:** Como não identificamos correspondência direta de tecnologias primárias, foque em demonstrar sua velocidade para aprender novas ferramentas e sua flexibilidade técnica.\n"

    if missing_skills:
        missing_str = ", ".join(missing_skills[:3])
        advice += f"2. **Aborde os Gaps com Proatividade:** A vaga menciona **{missing_str}**, que podem não estar explícitos no seu currículo. Caso perguntem, diga que você já conhece os conceitos teóricos e demonstre entusiasmo para dominar a stack prática rapidamente nas primeiras semanas.\n"
    else:
        advice += "2. **Domínio Total da Stack:** Você tem 100% de aderência às tecnologias listadas! Foque em demonstrar maturidade arquitetural (clean code, padrões de projeto e testes automatizados) para se destacar dos demais candidatos.\n"

    advice += f"3. **Estude o Produto:** Pesquise sobre o modelo de negócio da **{company}** antes do bate-papo técnico. Mostrar que você entende as dores dos clientes deles cria uma conexão imediata e muito positiva."

    return advice

async def analyse_match(
    job_title: str,
    job_description: str,
    company: str,
    cv_text: str,
    candidate_name: str,
    profile_keywords: list[str] = None
) -> dict:
    """
    Analisa a afinidade (match) entre o currículo do candidato e a descrição da vaga.
    Tenta usar o Ollama local para gerar a escrita do cold mail e dicas.
    Em caso de Ollama offline, usa um motor algorítmico robusto que garante 100% de disponibilidade.
    """
    # 1. Extração de Skills (Mesclando as palavras-chave do perfil do usuário para suportar qualquer área, como RH)
    job_skills = extract_skills_from_text(f"{job_title} {job_description}", profile_keywords)

    # Consolida texto de busca do candidato (keywords + texto do CV)
    cv_skills_search_text = (cv_text or "") + " " + " ".join(profile_keywords or [])
    cv_skills = extract_skills_from_text(cv_skills_search_text, profile_keywords)

    # 2. Comparações e Intersecções
    matched_skills = list(job_skills.intersection(cv_skills))
    missing_skills = list(job_skills.difference(cv_skills))

    # Cálculo do score de match
    if not job_skills:
        match_score = 50 # Neutro se a vaga não tiver descrição rica de tecnologias
    else:
        match_score = int((len(matched_skills) / len(job_skills)) * 100)
        # Ajustes de borda
        match_score = max(min(match_score, 98), 5) # Evita 100% absoluto por humildade estatística

    # Se houver match estático alto por palavra-chave, dá um pequeno bônus
    if len(matched_skills) >= 4:
        match_score = min(match_score + 10, 98)

    # 3. Geração de Textos (Ollama com Fallback)
    cold_mail = None
    interview_advice = None

    # Tenta usar Ollama
    ollama_prompt = f"""
    Candidate: {candidate_name}
    Skills: {', '.join(matched_skills)}
    Job Title: {job_title}
    Company: {company}
    Description: {job_description[:1000]}

    Crie uma mensagem curta para enviar ao recrutador no LinkedIn (Cold Mail) e dicas para a entrevista técnica.
    Retorne exatamente no formato:
    ---COLD_MAIL---
    [texto do cold mail curto em português brasileiro]
    ---ADVICE---
    [texto com dicas curtas de entrevista técnica]
    """

    ollama_response = await try_query_ollama(ollama_prompt)
    if ollama_response:
        try:
            parts = re.split(r"---COLD_MAIL---|---ADVICE---", ollama_response)
            if len(parts) >= 3:
                cold_mail = parts[1].strip()
                interview_advice = parts[2].strip()
        except Exception as e:
            logger.error(f"Erro ao processar resposta do Ollama: {e}")

    # Fallback Algorítmico Determinístico (Garante 100% de funcionamento offline)
    if not cold_mail:
        cold_mail = generate_fallback_cold_mail(candidate_name, job_title, company, matched_skills)
    if not interview_advice:
        interview_advice = generate_fallback_advice(matched_skills, missing_skills, company)

    return {
        "match_score": match_score,
        "matches": sorted(matched_skills),
        "gaps": sorted(missing_skills),
        "cold_mail": cold_mail,
        "interview_advice": interview_advice
    }
