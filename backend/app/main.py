from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import init_db
from app.services.scheduler_service import start_scheduler, stop_scheduler

from app.api.routes import jobs, applications, companies, profile, scheduler

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await init_db()
    await start_scheduler()
    yield
    # Shutdown actions
    stop_scheduler()

app = FastAPI(title="JobHunter API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "https://hotel-cittari.web.app",
        "http://localhost:4200",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure screenshots directory exists and mount it
os.makedirs(settings.screenshots_path, exist_ok=True)
app.mount("/screenshots", StaticFiles(directory=settings.screenshots_path), name="screenshots")

app.include_router(jobs.router, prefix="/api/v1", tags=["Jobs"])
app.include_router(applications.router, prefix="/api/v1", tags=["Applications"])
app.include_router(companies.router, prefix="/api/v1", tags=["Companies"])
app.include_router(profile.router, prefix="/api/v1", tags=["Profile"])
app.include_router(scheduler.router, prefix="/api/v1", tags=["Scheduler"])


@app.get("/health")
async def health():
    return {"status": "ok"}
