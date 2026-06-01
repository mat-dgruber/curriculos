from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.services.scheduler_service import start_scheduler, stop_scheduler

from app.api.routes import jobs, applications, companies, profile, scheduler

app = FastAPI(title="JobHunter API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/api/v1", tags=["Jobs"])
app.include_router(applications.router, prefix="/api/v1", tags=["Applications"])
app.include_router(companies.router, prefix="/api/v1", tags=["Companies"])
app.include_router(profile.router, prefix="/api/v1", tags=["Profile"])
app.include_router(scheduler.router, prefix="/api/v1", tags=["Scheduler"])


@app.on_event("startup")
async def startup():
    # DEPRECATED: create_all was replaced by Alembic migrations.
    # To apply migrations: cd backend && alembic upgrade head
    # To create new migration after model changes: cd backend && alembic revision --autogenerate -m "description"
    await init_db()
    start_scheduler()


@app.on_event("shutdown")
async def shutdown():
    stop_scheduler()


@app.get("/health")
async def health():
    return {"status": "ok"}
