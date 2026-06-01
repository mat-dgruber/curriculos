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
        assert score == 40 + 5  # role + platform bonus

    def test_partial_role_match(self):
        job = _make_job(title="Desenvolvedor Full Stack Angular")
        score = calculate_score(job, ["Angular"], [], [])
        assert score == 40 + 5  # role + platform bonus

    def test_case_insensitive_role(self):
        job = _make_job(title="DESENVOLVEDOR ANGULAR")
        score = calculate_score(job, ["desenvolvedor angular"], [], [])
        assert score == 40 + 5

    def test_no_role_match(self):
        job = _make_job(title="Analista de Suporte")
        score = calculate_score(job, ["Desenvolvedor Angular"], [], [])
        assert score == 5  # only platform bonus


class TestKeywordMatch:
    """Keywords in description award 7 points each, max 5 keywords."""

    def test_single_keyword(self):
        job = _make_job(description="Buscamos dev com experiência em angular")
        score = calculate_score(job, [], ["angular"], [])
        assert score == 7 + 5  # keyword + platform bonus

    def test_multiple_keywords(self):
        job = _make_job(description="Requisitos: angular, typescript, python, docker, kubernetes")
        score = calculate_score(job, [], ["angular", "typescript", "python", "docker", "kubernetes"], [])
        assert score == 35 + 5  # 5*7 + platform bonus

    def test_max_5_keywords_counted(self):
        job = _make_job(description="angular typescript python docker kubernetes react vue")
        score = calculate_score(job, [], ["angular", "typescript", "python", "docker", "kubernetes", "react", "vue"], [])
        assert score == 35 + 5  # capped at 5 keywords

    def test_keyword_in_title(self):
        job = _make_job(title="Desenvolvedor Angular", description="")
        score = calculate_score(job, [], ["angular"], [])
        assert score == 7 + 5  # keyword found in title + platform bonus

    def test_penalty_when_no_keyword_matches(self):
        job = _make_job(
            title="Designer Gráfico",
            description="Trabalho com Photoshop e Illustrator",
            platform="gupy",
        )
        score = calculate_score(
            job,
            target_roles=["desenvolvedor"],
            keywords=["python", "react", "angular"],
            preferred_locations=[],
        )
        # No keyword match: penalty -20 + platform 5 = -15, clamped to 0
        assert score == 0


class TestLocationMatch:
    """Location match awards 15 points."""

    def test_exact_location(self):
        job = _make_job(location="São Paulo, SP")
        score = calculate_score(job, [], [], ["São Paulo"])
        assert score == 15 + 5  # location + platform bonus

    def test_partial_location(self):
        job = _make_job(location="Remoto")
        score = calculate_score(job, [], [], ["Remoto"])
        assert score == 15 + 5

    def test_case_insensitive_location(self):
        job = _make_job(location="SÃO PAULO")
        score = calculate_score(job, [], [], ["são paulo"])
        assert score == 15 + 5

    def test_no_location_match(self):
        job = _make_job(location="Curitiba")
        score = calculate_score(job, [], [], ["São Paulo"])
        assert score == 5  # only platform bonus

    def test_remoto_auto_match(self):
        """If user has 'Remoto' in preferred_locations and job is 'Remote', it should match."""
        job = _make_job(location="Remote")
        score = calculate_score(job, [], [], ["Remoto"])
        assert score == 15 + 5  # remoto auto-match + platform

    def test_remoto_auto_match_english(self):
        job = _make_job(location="Remote Work")
        score = calculate_score(job, [], [], ["Home Office"])
        assert score == 15 + 5  # remoto auto-match + platform


class TestPlatformBonus:
    """Trusted platforms (linkedin, gupy) award 5 points."""

    def test_linkedin_bonus(self):
        job = _make_job(platform="linkedin")
        score = calculate_score(job, [], [], [])
        assert score == 5

    def test_gupy_bonus(self):
        job = _make_job(platform="gupy")
        score = calculate_score(job, [], [], [])
        assert score == 5

    def test_vagas_no_bonus(self):
        job = _make_job(platform="vagas")
        score = calculate_score(job, [], [], [])
        assert score == 0

    def test_unknown_platform_no_bonus(self):
        job = _make_job(platform="jooble")
        score = calculate_score(job, [], [], [])
        assert score == 0


class TestScoreCap:
    """Score caps at 100 and floors at 0."""

    def test_max_score_is_95(self):
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
        # role: 40 + keywords: 35 (5*7) + location: 15 + platform: 5 = 95
        assert score == 95

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
        # Penalty -20 (no kw match) + 0 = clamped to 0
        assert score == 0

    def test_penalty_when_no_keyword_matches(self):
        """When keywords are provided but none match, score gets -20 penalty."""
        job = _make_job(
            title="Designer Gráfico",
            description="Trabalho com Photoshop e Illustrator",
            location="São Paulo",
            platform="gupy",
        )
        score = calculate_score(
            job,
            target_roles=["desenvolvedor"],
            keywords=["python", "react", "angular"],
            preferred_locations=["São Paulo"],
        )
        # Location: 15 + platform: 5 - penalty: 20 = 0
        assert score == 0

    def test_score_minimum_filter(self):
        from app.services.matcher import match_jobs

        jobs = [
            _make_job(title="Dev Python", description="Python flask", platform="gupy"),
            _make_job(title="Designer", location="RJ", description="Photoshop", platform="vagas"),
        ]
        scored = match_jobs(
            jobs,
            target_roles=["desenvolvedor"],
            keywords=["python", "django"],
            preferred_locations=["São Paulo"],
        )
        # Filter out jobs below score 20
        filtered = [(j, s) for j, s in scored if s >= 20]
        assert len(filtered) >= 1
        assert all(s >= 20 for _, s in filtered)


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
        # role: 40 + keywords: 21 (3*7) + location: 15 + platform: 5 = 81
        assert score == 81

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
        # role: 0 + keywords: 7 (python, kw_matched=True) + location: 15 + platform: 0 = 22
        assert score == 22


# --- match_jobs tests ---

class TestMatchJobs:
    """Test the match_jobs batch scoring function."""

    def test_returns_sorted_by_score_descending(self):
        jobs = [
            _make_job(title="Analista RH", platform="vagas"),
            _make_job(title="Desenvolvedor Angular", platform="linkedin"),
            _make_job(title="Dev Angular Sênior", description="angular typescript", platform="gupy"),
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
