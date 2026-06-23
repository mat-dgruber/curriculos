import logging
from datetime import datetime

from sqlalchemy import select

from app.core.database import async_session
from app.core.config import settings
from app.models.job import Job

logger = logging.getLogger(__name__)

# Seletores por plataforma para extrair descrição da página de detalhe
PLATFORM_SELECTORS: dict[str, list[str]] = {
    "linkedin": [
        ".show-more-less-html__markup",
        ".description__text",
        ".show-more-less-html",
    ],
    "vagas": [
        ".job-description",
        ".descricao-vaga",
        "[class*='description']",
        "[class*='descricao']",
    ],
    "infojobs": [
        "[class*='description']",
        "[class*='descricao']",
        "[data-qa='description']",
        ".text-description",
    ],
    "catho": [
        "[class*='description']",
        "[class*='descricao']",
        "[data-qa='description']",
        ".job-description",
    ],
    # APIs retornam descrição direto — não precisam de enrichment
    "gupy": [],
    "jooble": [],
    "adzuna": [],
    "remotive": [],
}


async def enrich_missing_descriptions(limit: int = 50) -> dict:
    """
    Busca vagas sem descrição e tenta extrair da página de detalhe.
    Retorna resumo: {enriched: int, failed: int, skipped: int}.
    """
    from app.services.scraper.base_scraper import PlaywrightScraper

    async with async_session() as db:
        result = await db.execute(
            select(Job).where(
                (Job.description.is_(None)) | (Job.description == "")
            ).limit(limit)
        )
        jobs = result.scalars().all()

        if not jobs:
            logger.info("No jobs missing descriptions.")
            return {"enriched": 0, "failed": 0, "skipped": 0, "total_missing": 0}

        logger.info(f"Found {len(jobs)} jobs without descriptions")

        enriched = 0
        failed = 0
        skipped = 0

        # Agrupa por plataforma para usar os seletores corretos
        playwright_jobs = [j for j in jobs if j.platform in PLATFORM_SELECTORS and PLATFORM_SELECTORS[j.platform]]
        api_jobs = [j for j in jobs if j.platform in PLATFORM_SELECTORS and not PLATFORM_SELECTORS[j.platform]]

        # API jobs já deveriam ter descrição — marcar como skipped
        skipped = len(api_jobs)

        if not playwright_jobs:
            return {"enriched": 0, "failed": 0, "skipped": skipped, "total_missing": len(jobs)}

        # Usa um único browser para todas as plataformas Playwright.
        # Para conter o heap de Chromium em VMs de 1 GiB, fecha e reabre o
        # browser a cada ENRICH_BATCH_SIZE vagas — cada contexto vazado pode
        # reter 30-80 MB; o GC do Playwright é lento.
        ENRICH_BATCH_SIZE = 5

        scraper = PlaywrightScraper(
            headless=settings.playwright_headless,
            slow_mo=settings.playwright_slow_mo,
        )

        try:
            total = len(playwright_jobs)
            batch_start = 0
            while batch_start < total:
                batch_end = min(batch_start + ENRICH_BATCH_SIZE, total)
                batch = playwright_jobs[batch_start:batch_end]
                logger.debug(
                    "Enrichment batch %d-%d of %d", batch_start, batch_end, total
                )
                async with scraper:
                    for job in batch:
                        try:
                            await scraper._safe_goto(job.url, timeout=20000)
                            await scraper._random_delay(1, 2)

                            selectors = PLATFORM_SELECTORS.get(job.platform, [])
                            desc = ""

                            for sel in selectors:
                                el = await scraper.page.query_selector(sel)
                                if el:
                                    desc = (await el.inner_text()).strip()
                                    if desc and len(desc) > 20:
                                        break

                            if desc:
                                job.description = desc[:1000]
                                job.updated_at = datetime.utcnow()
                                db.add(job)
                                enriched += 1
                                logger.info(f"Enriched: {job.title} ({job.platform})")
                            else:
                                failed += 1
                                logger.debug(f"No description found: {job.url}")

                            await scraper._random_delay(1, 2)

                        except Exception as e:
                            failed += 1
                            logger.debug(f"Enrich failed for {job.url}: {e}")

                await db.commit()
                batch_start = batch_end

                # Libera memoria residual entre batches (fastapi-side)
                import gc
                gc.collect()

        except Exception as e:
            logger.error(f"Enrichment browser error: {e}")
            await db.rollback()

        result = {
            "enriched": enriched,
            "failed": failed,
            "skipped": skipped,
            "total_missing": len(jobs),
        }
        logger.info(f"Enrichment complete: {result}")
        return result
