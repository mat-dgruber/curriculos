from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./jobhunter.db"
    environment: str = "development"
    frontend_url: str = "http://localhost:4200"
    secret_key: str = "dev-secret-key-change-in-production"
    cv_storage_path: str = "./storage/cv"
    screenshots_path: str = "./storage/screenshots"
    scan_interval_hours: int = 6
    recurring_send_day: int = 1
    playwright_headless: bool = True
    playwright_slow_mo: int = 100
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    notification_email: str = ""

    # Scraper API keys (opcionais)
    jooble_api_key: str = ""
    adzuna_app_id: str = ""
    adzuna_app_key: str = ""
    scraper_proxy: str = ""

    # Plataformas habilitadas (comma-separated, vazio = todas)
    enabled_scrapers: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
