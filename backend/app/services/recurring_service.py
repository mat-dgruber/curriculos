import json
import logging
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.core.config import settings
from app.models.company import FixedCompany
from app.models.application import Application
from app.models.profile import CandidateProfile
from app.services.automation.gupy_applicator import GupyApplicator
from app.services.automation.generic_applicator import GenericApplicator
from app.services import notification_service

logger = logging.getLogger(__name__)


async def run_recurring_sends() -> dict:
    """
    Send CV to all active fixed companies that are due for a recurring send.
    Returns summary of results.
    """
    async with async_session() as db:
        # Get profile
        profile_result = await db.execute(select(CandidateProfile).limit(1))
        profile = profile_result.scalar_one_or_none()

        if not profile:
            logger.warning("No profile found. Skipping recurring sends.")
            return {"sent": 0, "skipped": 0, "error": "No profile"}

        # Get active companies due for send
        now = datetime.utcnow()
        result = await db.execute(
            select(FixedCompany).where(
                FixedCompany.is_active == True,
                FixedCompany.status != "Respondeu",
            )
        )
        companies = result.scalars().all()

        sent = 0
        skipped = 0
        failed = 0

        for company in companies:
            # Check if it's time to send
            if company.next_send_at and company.next_send_at > now:
                skipped += 1
                continue

            # Determine which applicator to use
            if "gupy" in company.application_url.lower():
                applicator = GupyApplicator(
                    headless=settings.playwright_headless,
                    slow_mo=settings.playwright_slow_mo,
                    screenshots_path=settings.screenshots_path,
                    cv_path=(
                        f"{settings.cv_storage_path}/{profile.cv_filename}"
                        if profile.cv_filename
                        else None
                    ),
                )
            else:
                applicator = GenericApplicator(
                    headless=settings.playwright_headless,
                    slow_mo=settings.playwright_slow_mo,
                    screenshots_path=settings.screenshots_path,
                    cv_path=(
                        f"{settings.cv_storage_path}/{profile.cv_filename}"
                        if profile.cv_filename
                        else None
                    ),
                )

            applicator.profile = {
                "name": profile.name,
                "email": profile.email,
                "phone": profile.phone,
                "location": profile.location,
            }

            try:
                async with applicator:
                    result = await applicator.apply(
                        job_url=company.application_url,
                        job_title="Candidatura recorrente",
                        company_name=company.name,
                    )

                # Create application record
                application = Application(
                    job_id="recurring",
                    company_name=company.name,
                    status=result.status,
                    sent_at=datetime.utcnow() if result.success else None,
                    is_recurring=True,
                    screenshot_path=result.screenshot_path,
                    error_message=result.error_message,
                    fixed_company_id=company.id,
                )
                db.add(application)

                # Update company
                company.last_sent_at = datetime.utcnow()
                company.total_sent += 1
                company.next_send_at = now + timedelta(days=company.interval_days)

                if result.success:
                    sent += 1
                    notification_service.notify_recurring_send(
                        company.name, company.total_sent, True
                    )
                else:
                    failed += 1
                    notification_service.notify_recurring_send(
                        company.name, company.total_sent, False
                    )

            except Exception as e:
                logger.error(f"Recurring send failed for {company.name}: {e}")
                failed += 1

        await db.commit()

        result_summary = {"sent": sent, "skipped": skipped, "failed": failed}
        logger.info(f"Recurring sends complete: {result_summary}")
        return result_summary


async def run_single_company_send(company_id: str, db: AsyncSession) -> dict:
    """
    Manually trigger Playwright automation to send CV to a specific fixed company.
    """
    # Get profile
    profile_result = await db.execute(select(CandidateProfile).limit(1))
    profile = profile_result.scalar_one_or_none()

    if not profile:
        logger.warning("No profile found. Skipping recurring send.")
        return {"success": False, "error": "Perfil não encontrado"}

    # Get company
    result = await db.execute(select(FixedCompany).where(FixedCompany.id == company_id))
    company = result.scalar_one_or_none()

    if not company:
        return {"success": False, "error": "Empresa não encontrada"}

    # Determine which applicator to use
    if "gupy" in company.application_url.lower():
        applicator = GupyApplicator(
            headless=settings.playwright_headless,
            slow_mo=settings.playwright_slow_mo,
            screenshots_path=settings.screenshots_path,
            cv_path=(
                f"{settings.cv_storage_path}/{profile.cv_filename}"
                if profile.cv_filename
                else None
            ),
        )
    else:
        applicator = GenericApplicator(
            headless=settings.playwright_headless,
            slow_mo=settings.playwright_slow_mo,
            screenshots_path=settings.screenshots_path,
            cv_path=(
                f"{settings.cv_storage_path}/{profile.cv_filename}"
                if profile.cv_filename
                else None
            ),
        )

    applicator.profile = {
        "name": profile.name,
        "email": profile.email,
        "phone": profile.phone,
        "location": profile.location,
    }

    try:
        async with applicator:
            result = await applicator.apply(
                job_url=company.application_url,
                job_title="Candidatura recorrente manual",
                company_name=company.name,
            )

        # Create application record
        application = Application(
            job_id="recurring",
            company_name=company.name,
            status=result.status,
            sent_at=datetime.utcnow() if result.success else None,
            is_recurring=True,
            screenshot_path=result.screenshot_path,
            error_message=result.error_message,
            fixed_company_id=company.id,
        )
        db.add(application)

        # Update company
        company.last_sent_at = datetime.utcnow()
        company.total_sent += 1
        company.next_send_at = datetime.utcnow() + timedelta(days=company.interval_days)

        if result.success:
            notification_service.notify_recurring_send(
                company.name, company.total_sent, True
            )
        else:
            notification_service.notify_recurring_send(
                company.name, company.total_sent, False
            )

        await db.commit()
        await db.refresh(company)

        return {
            "success": result.success,
            "status": result.status,
            "screenshotPath": result.screenshot_path,
            "errorMessage": result.error_message,
            "company": {
                "id": company.id,
                "totalSent": company.total_sent,
                "lastSentAt": (
                    company.last_sent_at.isoformat() if company.last_sent_at else None
                ),
                "nextSendAt": (
                    company.next_send_at.isoformat() if company.next_send_at else None
                ),
            },
        }
    except Exception as e:
        logger.error(f"Recurring manual send failed for {company.name}: {e}")
        return {"success": False, "error": str(e)}
