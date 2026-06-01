"""Tests for application configuration."""
from app.core.config import Settings, settings


class TestSettings:
    def test_default_database_url(self):
        s = Settings(_env_file=None)
        assert "sqlite" in s.database_url or "aiosqlite" in s.database_url

    def test_default_environment(self):
        s = Settings(_env_file=None)
        assert s.environment in ("development", "test", "production")

    def test_default_scan_interval(self):
        s = Settings(_env_file=None)
        assert s.scan_interval_hours == 6

    def test_default_recurring_send_day(self):
        s = Settings(_env_file=None)
        assert s.recurring_send_day == 1

    def test_default_playwright_headless(self):
        s = Settings(_env_file=None)
        assert s.playwright_headless is True

    def test_default_playwright_slow_mo(self):
        s = Settings(_env_file=None)
        assert s.playwright_slow_mo == 100

    def test_default_smtp_port(self):
        s = Settings(_env_file=None)
        assert s.smtp_port == 587

    def test_default_smtp_empty(self):
        s = Settings(_env_file=None)
        assert s.smtp_user == ""
        assert s.smtp_password == ""

    def test_storage_paths(self):
        s = Settings(_env_file=None)
        assert "storage" in s.cv_storage_path
        assert "storage" in s.screenshots_path

    def test_frontend_url_default(self):
        s = Settings(_env_file=None)
        assert "4200" in s.frontend_url

    def test_settings_singleton_exists(self):
        assert settings is not None
        assert hasattr(settings, "database_url")
        assert hasattr(settings, "environment")
        assert hasattr(settings, "scan_interval_hours")
