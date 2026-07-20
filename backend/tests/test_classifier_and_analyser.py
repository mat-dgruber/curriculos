import pytest
from app.services.classifier import classify_job
from app.services.match_analyser import extract_skills_from_text, analyse_match

def test_classify_job_seniority():
    # Teste de títulos explícitos
    assert classify_job("Estagiário de Python", "")["seniority"] == "Estágio"
    assert classify_job("Developer Java Jr", "")["seniority"] == "Júnior"
    assert classify_job("Engenheiro de Software Pleno", "")["seniority"] == "Pleno"
    assert classify_job("Sênior Angular Engineer", "")["seniority"] == "Sênior"
    assert classify_job("Especialista Cloud AWS", "")["seniority"] == "Especialista"
    assert classify_job("Gerente de Projetos", "")["seniority"] == "Não Especificado"

def test_classify_job_area():
    assert classify_job("Desenvolvedor Angular Sênior", "")["area"] == "Frontend"
    assert classify_job("Python FastAPI Developer", "")["area"] == "Backend"
    assert classify_job("Dev Fullstack", "")["area"] == "Fullstack"
    assert classify_job("Android Swift Mobile Architect", "")["area"] == "Mobile"
    assert classify_job("DevOps / Cloud Engineer", "")["area"] == "DevOps"
    assert classify_job("Cientista de Dados", "")["area"] == "Dados"
    assert classify_job("Analista de QA Sênior", "")["area"] == "QA"
    assert classify_job("Padeiro Gourmet", "")["area"] == "Outra"

def test_classify_job_diversity():
    # PCD
    assert classify_job("Desenvolvedor Java - PCD", "")["diversity_category"] == "PCD"
    assert classify_job("Desenvolvedor Sênior", "Vaga exclusiva para PCD.")["diversity_category"] == "PCD"
    # Mulheres
    assert classify_job("Vaga Afirmativa para Mulheres", "")["diversity_category"] == "Mulheres"
    # Geral
    assert classify_job("Desenvolvedor Python", "Venha trabalhar conosco")["diversity_category"] == "Geral"

def test_extract_skills():
    text = "Vaga para desenvolvedor que conheça Python, Django, Angular, Docker e AWS"
    skills = extract_skills_from_text(text)
    assert "Python" in skills
    assert "Django" in skills
    assert "Angular" in skills
    assert "Docker" in skills
    assert "AWS" in skills
    assert "React" not in skills

def test_extract_skills_dynamic_rh():
    # Testando se as competências dinâmicas de RH são extraídas perfeitamente
    text = "Buscamos Analista de Recursos Humanos com forte experiência em Recrutamento e Seleção, além de conhecimento em Folha de Pagamento e leis trabalhistas."
    rh_keywords = ["Recrutamento", "Seleção", "Folha de Pagamento", "Treinamento"]
    skills = extract_skills_from_text(text, rh_keywords)

    assert "Recrutamento" in skills
    assert "Seleção" in skills
    assert "Folha De Pagamento" in skills # Capitalização estética title-case geral para termos customizados
    assert "Treinamento" not in skills # Não está no texto da vaga, então não deve ser extraído!

@pytest.mark.asyncio
async def test_analyse_match_flow():
    # Testa a análise semântica simulada (com Ollama offline - fallback)
    job_title = "Desenvolvedor Python Django Sênior"
    job_desc = "Precisamos de experiência com Python, Django, PostgreSQL e Docker."
    company = "Google"
    cv_text = "Profissional experiente em Python, Django e PostgreSQL."
    candidate_name = "Matheus"
    profile_keywords = ["Git"]

    analysis = await analyse_match(
        job_title=job_title,
        job_description=job_desc,
        company=company,
        cv_text=cv_text,
        candidate_name=candidate_name,
        profile_keywords=profile_keywords
    )

    assert isinstance(analysis["match_score"], int)
    assert 0 <= analysis["match_score"] <= 100
    assert "Python" in analysis["matches"]
    assert "Django" in analysis["matches"]
    # Docker está na vaga mas não está no currículo do candidato
    assert "Docker" in analysis["gaps"]
    # Verificação de geração de cold_mail e conselho
    assert "Matheus" in analysis["cold_mail"]
    assert "Google" in analysis["cold_mail"]
    assert "Django" in analysis["cold_mail"]
    assert "💡 Conselho de Ouro" in analysis["interview_advice"]
