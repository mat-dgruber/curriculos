"""Testes unitários para os scrapers de vagas."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.scraper.jooble_scraper import JoobleScraper
from app.services.scraper.adzuna_scraper import AdzunaScraper
from app.services.scraper.base_scraper import ScrapedJob


# ─── Jooble Scraper ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_jooble_returns_jobs():
    """JoobleScraper retorna ScrapedJob quando API responde."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "totalCount": 2,
        "jobs": [
            {
                "title": "Dev Angular",
                "company": "Tech Corp",
                "location": "São Paulo, SP",
                "snippet": "Buscamos dev Angular",
                "url": "https://jooble.org/job/1",
                "salary": "R$ 8.000",
            },
            {
                "title": "Dev Python",
                "company": "Startup X",
                "location": "Remoto",
                "snippet": "Dev Python backend",
                "url": "https://jooble.org/job/2",
                "salary": "",
            },
        ],
    }
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.scraper.jooble_scraper.httpx.AsyncClient") as mock_client:
        instance = mock_client.return_value.__aenter__.return_value
        instance.post.return_value = mock_response

        scraper = JoobleScraper(api_key="test-key")
        async with scraper:
            jobs = await scraper.scrape({
                "keywords": ["angular"],
                "location": "São Paulo",
            })

    assert len(jobs) == 2
    assert jobs[0].title == "Dev Angular"
    assert jobs[0].platform == "jooble"
    assert jobs[0].salary_range == "R$ 8.000"
    assert jobs[1].salary_range is None  # vazio vira None


@pytest.mark.asyncio
async def test_jooble_skips_empty_title():
    """JoobleScraper ignora jobs sem título ou empresa."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "jobs": [
            {"title": "Dev", "company": "X", "location": "SP", "snippet": "", "url": "u1"},
            {"title": "", "company": "X", "location": "SP", "snippet": "", "url": "u2"},
            {"title": "Dev", "company": "", "location": "SP", "snippet": "", "url": "u3"},
        ],
    }
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.scraper.jooble_scraper.httpx.AsyncClient") as mock_client:
        instance = mock_client.return_value.__aenter__.return_value
        instance.post.return_value = mock_response

        scraper = JoobleScraper()
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["dev"], "location": ""})

    assert len(jobs) == 1


@pytest.mark.asyncio
async def test_jooble_empty_api_key_works():
    """JoobleScraper funciona sem API key."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"jobs": []}
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.scraper.jooble_scraper.httpx.AsyncClient") as mock_client:
        instance = mock_client.return_value.__aenter__.return_value
        instance.post.return_value = mock_response

        scraper = JoobleScraper()
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["dev"], "location": ""})

    assert jobs == []


# ─── Adzuna Scraper ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_adzuna_returns_jobs():
    """AdzunaScraper retorna ScrapedJob quando API responde."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "results": [
            {
                "title": "Engenheiro Python",
                "company": {"display_name": "BigTech BR"},
                "location": {"display_name": "São Paulo, SP"},
                "description": "Python developer",
                "redirect_url": "https://adzuna.com/job/1",
                "salary_min": 7000,
                "salary_max": 12000,
            }
        ]
    }
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.scraper.adzuna_scraper.httpx.AsyncClient") as mock_client:
        instance = mock_client.return_value.__aenter__.return_value
        instance.get.return_value = mock_response

        scraper = AdzunaScraper(app_id="id", app_key="key")
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["python"], "location": "São Paulo"})

    assert len(jobs) == 1
    assert jobs[0].platform == "adzuna"
    assert "R$" in jobs[0].salary_range


@pytest.mark.asyncio
async def test_adzuna_skips_without_keys():
    """AdzunaScraper retorna vazio quando não tem app_id/app_key."""
    scraper = AdzunaScraper()
    async with scraper:
        jobs = await scraper.scrape({"keywords": ["dev"], "location": ""})
    assert jobs == []


@pytest.mark.asyncio
async def test_adzuna_empty_results():
    """AdzunaScraper retorna vazio quando API retorna results vazio."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"results": []}
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.scraper.adzuna_scraper.httpx.AsyncClient") as mock_client:
        instance = mock_client.return_value.__aenter__.return_value
        instance.get.return_value = mock_response

        scraper = AdzunaScraper(app_id="id", app_key="key")
        async with scraper:
            jobs = await scraper.scrape({"keywords": ["dev"], "location": ""})

    assert jobs == []
