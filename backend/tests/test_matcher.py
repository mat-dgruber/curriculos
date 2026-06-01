"""Tests for the job matcher scoring algorithm."""
from app.services.scraper.base_scraper import ScrapedJob
from app.services.matcher import calculate_score, match_jobs


def _make_job(**kwargs):
    defaults = dict(
        title="Desenvolvedor",
        company="Empresa",
        location="São Paulo",
        description="",
        url="https://test.com",
        platform="gupy",
    )
    defaults.update(kwargs)
    return ScrapedJob(**defaults)


# --- calculate_score tests ---

class TestRoleMatch:
    """Role match in title awards 40 points."""

    def test_exact_role_match(self):
        job = _make_job(title="Desenvolvedor Angular Sênior")
        score = calculate_score(job, ["Desenvolvedor Angular"], [], [])
        assert score == 40 + 10  # role + platform bonus

    def test_partial_role_match(self):
        job = _make_job(title="Desenvolvedor Full Stack Angular")
        score = calculate_score(job, ["Angular"], [], [])
        assert score == 40 + 10  # role + platform bonus

    def test_case_insensitive_role(self):
        job = _make_job(title="DESENVOLVEDOR ANGULAR")
        score = calculate_score(job, ["desenvolvedor angular"], [], [])
        assert score == 40 + 10

    def test_no_role_match(self):
        job = _make_job(title="Analista de Suporte")
        score = calculate_score(job, ["Desenvolvedor Angular"], [], [])
        assert score == 10  # only platform bonus


class TestKeywordMatch:
    """Keywords in description award 6 points each, max 5 keywords."""

    def test_single_keyword(self):
        job = _make_job(description="Buscamos dev com experiência em angular")
        score = calculate_score(job, [], ["angular"], [])
        assert score == 6 + 10  # keyword + platform bonus

    def test_multiple_keywords(self):
        job = _make_job(description="Requisitos: angular, typescript, python, docker, kubernetes")
        score = calculate_score(job, [], ["angular", "typescript", "python", "docker", "kubernetes"], [])
        assert score == 30 + 10  # 5*6 + platform bonus

    def test_max_5_keywords_counted(self):
        job = _make_job(description="angular typescript python docker kubernetes react vue")
        score = calculate_score(job, [], ["angular", "typescript", "python", "docker", "kubernetes", "react", "vue"], [])
        assert score == 30 + 10  # capped at 5 keywords

    def test_keyword_in_title(self):
        job = _make_job(title="Desenvolvedor Angular", description="")
        score = calculate_score(job, [], ["angular"], [])
        assert score == 6 + 10  # keyword found in title + platform bonus


class TestLocationMatch:
    """Location match awards 20 points."""

    def test_exact_location(self):
        job = _make_job(location="São Paulo, SP")
        score = calculate_score(job, [], [], ["São Paulo"])
        assert score == 20 + 10  # location + platform bonus

    def test_partial_location(self):
        job = _make_job(location="Remoto")
        score = calculate_score(job, [], [], ["Remoto"])
        assert score == 20 + 10

    def test_case_insensitive_location(self):
        job = _make_job(location="SÃO PAULO")
        score = calculate_score(job, [], [], ["são paulo"])
        assert score == 20 + 10

    def test_no_location_match(self):
        job = _make_job(location="Curitiba")
        score = calculate_score(job, [], [], ["São Paulo", "Remoto"])
        assert score == 10  # only platform bonus


class TestPlatformBonus:
    """Trusted platforms (linkedin, gupy) award 10 points."""

    def test_linkedin_bonus(self):
        job = _make_job(platform="linkedin")
        score = calculate_score(job, [], [], [])
        assert score == 10

    def test_gupy_bonus(self):
        job = _make_job(platform="gupy")
        score = calculate_score(job, [], [], [])
        assert score == 10

    def test_vagas_no_bonus(self):
        job = _make_job(platform="vagas")
        score = calculate_score(job, [], [], [])
        assert score == 0

    def test_unknown_platform_no_bonus(self):
        job = _make_job(platform="infojobs")
        score = calculate_score(job, [], [], [])
        assert score == 0


class TestScoreCap:
    """Score caps at 100."""

    def test_max_score_is_100(self):
        job = _make_job(
            title="Desenvolvedor Angular Sênior",
            description="angular typescript python docker kubernetes react",
            location="São Paulo, SP",
            platform="linkedin",
        )
        score = calculate_score(
            job,
            target_roles=["Desenvolvedor Angular"],
            keywords=["angular", "typescript", "python", "docker", "kubernetes", "react"],
            preferred_locations=["São Paulo"],
        )
        assert score == 100

    def test_no_match_score_is_zero(self):
        job = _make_job(
            title="Analista de RH",
            description="Recrutamento e seleção",
            location="Curitiba",
            platform="vagas",
        )
        score = calculate_score(
            job,
            target_roles=["Desenvolvedor Angular"],
            keywords=["angular", "python"],
            preferred_locations=["São Paulo", "Remoto"],
        )
        assert score == 0


class TestCombinedScore:
    """Test realistic combined scoring scenarios."""

    def test_good_match(self):
        job = _make_job(
            title="Desenvolvedor Angular Pleno",
            description="Experiência com Angular, TypeScript e Git. Trabalho remoto.",
            location="Remoto",
            platform="gupy",
        )
        score = calculate_score(
            job,
            target_roles=["Desenvolvedor Angular", "Desenvolvedor Frontend"],
            keywords=["angular", "typescript", "git"],
            preferred_locations=["Remoto", "São Paulo"],
        )
        # role: 40 + keywords: 18 (3*6) + location: 20 + platform: 10 = 88
        assert score == 88

    def test_partial_match(self):
        job = _make_job(
            title="Desenvolvedor Python",
            description="Python e Django. Escritório em São Paulo.",
            location="São Paulo, SP",
            platform="vagas",
        )
        score = calculate_score(
            job,
            target_roles=["Desenvolvedor Angular"],
            keywords=["angular", "python"],
            preferred_locations=["São Paulo"],
        )
        # role: 0 + keywords: 6 (python) + location: 20 + platform: 0 = 26
        assert score == 26


# --- match_jobs tests ---

class TestMatchJobs:
    """Test the match_jobs batch scoring function."""

    def test_returns_sorted_by_score_descending(self):
        jobs = [
            _make_job(title="Analista RH", platform="vagas"),  # 0
            _make_job(title="Desenvolvedor Angular", platform="linkedin"),  # 50
            _make_job(title="Dev Angular Sênior", description="angular typescript", platform="gupy"),  # 52
        ]
        result = match_jobs(
            jobs,
            target_roles=["Desenvolvedor Angular"],
            keywords=["angular", "typescript"],
            preferred_locations=[],
        )
        scores = [s for _, s in result]
        assert scores == sorted(scores, reverse=True)

    def test_empty_jobs_list(self):
        result = match_jobs([], ["Angular"], ["python"], ["SP"])
        assert result == []

    def test_returns_all_jobs(self):
        jobs = [_make_job(title=f"Job {i}") for i in range(10)]
        result = match_jobs(jobs, [], [], [])
        assert len(result) == 10
