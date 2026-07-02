"""Testes unitários para os scrapers de vagas."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.scraper.arbeitnow_scraper import ArbeitnowScraper
from app.services.scraper.gupy_portal_scraper import GupyPortalScraper
from app.services.scraper.adzuna_scraper import AdzunaScraper


# ─── Arbeitnow Scraper (substituiu Jooble) ──────────────────────


@pytest.mark.asyncio
async def test_arbeitnow_returns_jobs():
    """ArbeitnowScraper retorna ScrapedJob quando API responde."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": [
            {
                "title": "Senior Angular Developer",
                "company_name": "Tech Corp",
                "location": "Remote",
                "description": "Vaga Angular sênior",
                "url": "https://arbeitnow.com/job/1",
                "tags": ["angular", "typescript"],
            },
            {
                "title": "Python Backend Dev",
                "company_name": "Startup X",
                "location": "Berlin, Germany",
                "description": "Backend com Python",
                "url": "https://arbeitnow.com/job/2",
                "tags": [],
            },
        ],
        "meta": {"total": 2},
    }
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.aclose = AsyncMock()

    with patch(
        "app.services.scraper.base_scraper.httpx.AsyncClient", return_value=mock_client
    ):
        scraper = ArbeitnowScraper()
        async with scraper:
            jobs = await scraper.scrape(
                {"title": ["Angular", "Python"], "keywords": ["angular", "python"]}
            )

    assert len(jobs) >= 2
    assert any(j.title == "Senior Angular Developer" for j in jobs)
    assert all(j.platform == "arbeitnow" for j in jobs)
    assert jobs[0].requirements == ["angular", "typescript"]


@pytest.mark.asyncio
async def test_arbeitnow_returns_empty_on_no_results():
    """ArbeitnowScraper retorna [] quando não há resultados."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"data": [], "meta": {"total": 0}}
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.aclose = AsyncMock()

    with patch(
        "app.services.scraper.base_scraper.httpx.AsyncClient", return_value=mock_client
    ):
        scraper = ArbeitnowScraper()
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["quantum computing"]})

    assert jobs == []


@pytest.mark.asyncio
async def test_arbeitnow_handles_api_error():
    """ArbeitnowScraper captura exceções e retorna []."""
    mock_client = AsyncMock()
    mock_client.get.side_effect = Exception("Connection error")
    mock_client.aclose = AsyncMock()

    with patch(
        "app.services.scraper.base_scraper.httpx.AsyncClient", return_value=mock_client
    ):
        scraper = ArbeitnowScraper()
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["python"]})

    assert jobs == []


# ─── Gupy Portal Scraper (Scrapling) ─────────────────────────────


@pytest.mark.asyncio
async def test_gupy_portal_extracts_jobs_from_playwright_dom():
    """GupyPortalScraper extrai vagas via Scrapling."""
    mock_response = MagicMock()

    mock_link = MagicMock()
    mock_link.attrib = {"href": "https://portal.gupy.io/job/42"}
    mock_link.get_all_text.return_value = "Acme\nDev Angular\nSão Paulo"

    mock_response.css.return_value = [mock_link]

    scraper = GupyPortalScraper()
    scraper._fetch = AsyncMock(return_value=mock_response)

    jobs = await scraper.scrape({"keywords": ["angular"]})

    assert len(jobs) == 1
    assert jobs[0].title == "Dev Angular"
    assert jobs[0].company == "Acme"
    assert jobs[0].location == "São Paulo"

    from app.services.scraper.base_scraper import ScraplingScraper

    assert isinstance(scraper, ScraplingScraper)


@pytest.mark.asyncio
async def test_gupy_portal_handles_navigation_error():
    """GupyPortalScraper captura erros de navegação e retorna []."""
    scraper = GupyPortalScraper()
    scraper._fetch = AsyncMock(side_effect=Exception("Navigation timeout"))
    jobs = await scraper.scrape({"keywords": ["angular"]})
    assert jobs == []


@pytest.mark.asyncio
async def test_gupy_portal_deduplicates_jobs():
    """GupyPortalScraper deduplica vagas com mesma URL."""
    mock_response = MagicMock()

    mock_link = MagicMock()
    mock_link.attrib = {"href": "https://portal.gupy.io/job/42"}
    mock_link.get_all_text.return_value = "Acme\nDev Angular\nSão Paulo"

    mock_response.css.return_value = [mock_link, mock_link]

    scraper = GupyPortalScraper()
    scraper._fetch = AsyncMock(return_value=mock_response)
    jobs = await scraper.scrape({"keywords": ["angular"]})

    assert len(jobs) == 1
    urls = [j.url for j in jobs]
    assert urls.count("https://portal.gupy.io/job/42") <= 1


# ─── Adzuna Scraper ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_adzuna_returns_jobs():
    """AdzunaScraper retorna ScrapedJob com credenciais válidas."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "results": [
            {
                "id": "a1",
                "title": "Backend Developer",
                "company": {"display_name": "Corp A"},
                "location": {"display_name": "São Paulo"},
                "description": "Vaga backend",
                "redirect_url": "https://adzuna.com/jobs/1",
                "salary_min": 8000,
                "salary_max": 12000,
            },
        ]
    }
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.aclose = AsyncMock()

    with patch(
        "app.services.scraper.base_scraper.httpx.AsyncClient", return_value=mock_client
    ):
        scraper = AdzunaScraper(app_id="id", app_key="key")
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["python"]})

    assert len(jobs) == 1
    assert jobs[0].title == "Backend Developer"
    assert jobs[0].company == "Corp A"
    assert jobs[0].platform == "adzuna"


@pytest.mark.asyncio
async def test_adzuna_handles_missing_credentials():
    """AdzunaScraper retorna [] se credenciais ausentes."""
    scraper = AdzunaScraper(app_id="", app_key="")
    async with scraper:
        jobs = await scraper.scrape({"keywords": ["python"]})

    assert jobs == []


@pytest.mark.asyncio
async def test_adzuna_handles_api_error():
    """AdzunaScraper captura erros HTTP."""
    mock_client = AsyncMock()
    mock_client.get.side_effect = Exception("Network error")
    mock_client.aclose = AsyncMock()

    with patch(
        "app.services.scraper.base_scraper.httpx.AsyncClient", return_value=mock_client
    ):
        scraper = AdzunaScraper(app_id="id", app_key="key")
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["python"]})

    assert jobs == []
