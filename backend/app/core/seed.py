import asyncio
import json
from datetime import datetime, timedelta

from app.core.database import async_session, init_db
from app.models.job import Job
from app.models.application import Application
from app.models.company import FixedCompany
from app.models.profile import CandidateProfile


async def seed():
    await init_db()

    async with async_session() as session:
        existing = await session.get(CandidateProfile, "seed-profile")
        if existing:
            print("Seed data already exists. Skipping.")
            return

        # Profile
        profile = CandidateProfile(
            id="seed-profile",
            name="Matheus Diniz",
            email="matheus@email.com",
            phone="+55 11 99999-0000",
            location="São Paulo, SP",
            target_role="Desenvolvedor Angular/Python",
            linkedin_url="https://linkedin.com/in/matheusdiniz",
            keywords=json.dumps(["angular", "python", "typescript", "fastapi", "playwright"]),
            target_roles=json.dumps(["Desenvolvedor Frontend", "Desenvolvedor Full Stack", "Desenvolvedor Angular"]),
            preferred_locations=json.dumps(["São Paulo", "Remoto", "Híbrido"]),
            scan_interval_hours=6,
            auto_apply=False,
        )
        session.add(profile)

        # Jobs
        jobs = [
            Job(
                id="job-1",
                title="Desenvolvedor Angular Sênior",
                company="Tech Corp",
                location="São Paulo, SP (Híbrido)",
                platform="linkedin",
                url="https://linkedin.com/jobs/view/123456",
                description="Buscamos desenvolvedor Angular com experiência em projetos grandes. Requisitos: Angular 15+, TypeScript, RxJS, testes unitários. Oferecemos: plano de saúde, vale refeição, home office parcial.",
                requirements=json.dumps(["Angular 15+", "TypeScript", "RxJS", "Jest"]),
                salary_range="R$ 12.000 - R$ 18.000",
                score=92,
                status="Nova",
                found_at=datetime.utcnow() - timedelta(hours=2),
            ),
            Job(
                id="job-2",
                title="Desenvolvedor Full Stack Python + React",
                company="StartupXYZ",
                location="Remoto",
                platform="gupy",
                url="https://gupy.io/jobs/789012",
                description="Vaga para desenvolvedor full stack com foco em Python e React. Ambiente ágil, cultura de inovação. Trabalho 100% remoto.",
                requirements=json.dumps(["Python", "React", "PostgreSQL", "Docker"]),
                salary_range="R$ 10.000 - R$ 15.000",
                score=78,
                status="Nova",
                found_at=datetime.utcnow() - timedelta(hours=5),
            ),
            Job(
                id="job-3",
                title="Engenheiro de Software Pleno",
                company="Banco Digital",
                location="São Paulo, SP",
                platform="vagas",
                url="https://vagas.com.br/vagas/345678",
                description="Oportunidade para engenheiro de software pleno em banco digital. Trabalhe com microsserviços, Kubernetes e arquitetura orientada a eventos.",
                requirements=json.dumps(["Java", "Kubernetes", "Kafka", "Microservices"]),
                salary_range="R$ 14.000 - R$ 20.000",
                score=65,
                status="Visualizada",
                found_at=datetime.utcnow() - timedelta(days=1),
            ),
            Job(
                id="job-4",
                title="Desenvolvedor Angular Júnior",
                company="Agência Digital",
                location="Remoto",
                platform="linkedin",
                url="https://linkedin.com/jobs/view/456789",
                description="Vaga para desenvolvedor Angular júnior com muita vontade de aprender. Projetos variados para clientes nacionais e internacionais.",
                requirements=json.dumps(["Angular", "TypeScript", "CSS", "Git"]),
                salary_range="R$ 4.000 - R$ 6.000",
                score=71,
                status="Nova",
                found_at=datetime.utcnow() - timedelta(hours=8),
            ),
            Job(
                id="job-5",
                title="Desenvolvedor Python Sênior - Automação",
                company="Enterprise Corp",
                location="São Paulo, SP (Remoto)",
                platform="gupy",
                url="https://gupy.io/jobs/567890",
                description="Buscamos desenvolvedor Python com experiência em automação de processos, web scraping e integração de sistemas. Playwright, Selenium, APIs REST.",
                requirements=json.dumps(["Python", "Playwright", "Selenium", "REST APIs"]),
                salary_range="R$ 15.000 - R$ 22.000",
                score=88,
                status="Nova",
                found_at=datetime.utcnow() - timedelta(hours=1),
            ),
        ]
        session.add_all(jobs)

        # Applications
        applications = [
            Application(
                id="app-1",
                job_id="job-1",
                company_name="Tech Corp",
                status="Enviado",
                sent_at=datetime.utcnow() - timedelta(hours=1),
                is_recurring=False,
                notes="Candidatura manual via painel",
            ),
            Application(
                id="app-2",
                job_id="job-3",
                company_name="Banco Digital",
                status="Falhou",
                error_message="Captcha detectado no formulário Gupy",
                is_recurring=False,
                notes="Tentativa automática",
            ),
        ]
        session.add_all(applications)

        # Fixed Companies
        companies = [
            FixedCompany(
                id="company-1",
                name="Banco XYZ",
                application_url="https://bancoxyz.com.br/trabalhe-conosco",
                status="Ativo",
                is_active=True,
                interval_days=30,
                last_sent_at=datetime.utcnow() - timedelta(days=15),
                next_send_at=datetime.utcnow() + timedelta(days=15),
                total_sent=3,
                notes="Formulário simples, aceita PDF direto",
            ),
            FixedCompany(
                id="company-2",
                name="Empresa ABC Tech",
                application_url="https://abctech.com.br/careers",
                status="Ativo",
                is_active=True,
                interval_days=30,
                last_sent_at=datetime.utcnow() - timedelta(days=5),
                next_send_at=datetime.utcnow() + timedelta(days=25),
                total_sent=2,
                notes="Usa Gupy como ATS",
            ),
            FixedCompany(
                id="company-3",
                name="Startup Inovadora",
                application_url="https://startupinovadora.io/join",
                status="Pausado",
                is_active=False,
                interval_days=15,
                last_sent_at=datetime.utcnow() - timedelta(days=45),
                total_sent=1,
                notes="Pausado — processo seletivo em andamento",
            ),
        ]
        session.add_all(companies)

        await session.commit()
        print("Seed data created successfully!")
        print(f"  - 1 profile")
        print(f"  - {len(jobs)} jobs")
        print(f"  - {len(applications)} applications")
        print(f"  - {len(companies)} fixed companies")


if __name__ == "__main__":
    asyncio.run(seed())
