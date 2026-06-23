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
                "description": "Vaga Python backend",
                "url": "https://arbeitnow.com/job/2",
                "tags": ["python", "fastapi"],
            },
        ],
        "meta": {"total": 2},
    }
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.aclose = AsyncMock()

    with patch("app.services.scraper.base_scraper.httpx.AsyncClient", return_value=mock_client):
        scraper = ArbeitnowScraper()
        async with scraper:
            jobs = await scraper.scrape({
                "keywords": ["angular"],
                "location": "Remote",
            })

    assert len(jobs) >= 2
    assert jobs[0].title == "Senior Angular Developer"
    assert jobs[0].platform == "arbeitnow"
    assert jobs[0].company == "Tech Corp"
    assert "angular" in jobs[0].requirements


@pytest.mark.asyncio
async def test_arbeitnow_handles_empty_response():
    """ArbeitnowScraper retorna [] quando data está vazio."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"data": [], "meta": {"total": 0}}
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.aclose = AsyncMock()

    with patch("app.services.scraper.base_scraper.httpx.AsyncClient", return_value=mock_client):
        scraper = ArbeitnowScraper()
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["nonexistent"]})

    assert jobs == []


@pytest.mark.asyncio
async def test_arbeitnow_handles_api_error():
    """ArbeitnowScraper captura exceções e retorna []."""
    mock_client = AsyncMock()
    mock_client.get.side_effect = Exception("Connection error")
    mock_client.aclose = AsyncMock()

    with patch("app.services.scraper.base_scraper.httpx.AsyncClient", return_value=mock_client):
        scraper = ArbeitnowScraper()
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["python"]})

    assert jobs == []


# ─── Gupy Portal Scraper ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_gupy_portal_extracts_jobs_from_next_data():
    """GupyPortalScraper parseia __NEXT_DATA__ com jobList."""
    html_payload = (
        '<html><script id="__NEXT_DATA__" type="application/json">'
        '{"props":{"pageProps":{"dehydratedState":{"queries":['
        '{"state":{"data":{"jobList":[{"id":42,"name":"Dev Angular",'
        '"company":{"name":"Acme"},"address":{"city":"São Paulo"},'
        '"description":"Vaga"},{"id":43,"name":"Dev Python",'
        '"company":{"name":"Beta"},"address":{"city":"Remoto"},'
        '"description":""}]}}}]}}}}'
        '</script></html>'
    )

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = html_payload
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.aclose = AsyncMock()

    with patch("app.services.scraper.base_scraper.httpx.AsyncClient", return_value=mock_client):
        scraper = GupyPortalScraper()
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["angular"]})

    assert len(jobs) == 2
    assert jobs[0].title == "Dev Angular"
    assert jobs[0].company == "Acme"
    assert jobs[0].location == "São Paulo"
    assert jobs[0].platform == "gupy"
    assert "portal.gupy.io/jobs/42" in jobs[0].url


@pytest.mark.asyncio
async def test_gupy_portal_handles_missing_next_data():
    """GupyPortalScraper retorna [] quando não há __NEXT_DATA__."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "<html><body>no data here</body></html>"
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.aclose = AsyncMock()

    with patch("app.services.scraper.base_scraper.httpx.AsyncClient", return_value=mock_client):
        scraper = GupyPortalScraper()
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["angular"]})

    assert jobs == []


@pytest.mark.asyncio
async def test_gupy_portal_handles_http_error():
    """GupyPortalScraper captura erros HTTP e retorna []."""
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.raise_for_status.side_effect = Exception("500")
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.aclose = AsyncMock()

    with patch("app.services.scraper.base_scraper.httpx.AsyncClient", return_value=mock_client):
        scraper = GupyPortalScraper()
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["angular"]})

    assert jobs == []


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

    with patch("app.services.scraper.base_scraper.httpx.AsyncClient", return_value=mock_client):
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

    with patch("app.services.scraper.base_scraper.httpx.AsyncClient", return_value=mock_client):
        scraper = AdzunaScraper(app_id="id", app_key="key")
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["python"]})

    assert jobs == []
