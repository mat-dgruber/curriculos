import logging
import asyncio
from app.services.automation.base_applicator import BaseApplicator, ApplicationResult

logger = logging.getLogger(__name__)


class GupyApplicator(BaseApplicator):
    """Automate job applications on Gupy platform."""

    async def apply(self, job_url: str, job_title: str, company_name: str) -> ApplicationResult:
        try:
            await self._safe_goto(job_url)
            await self._random_delay(2, 4)

            # Try to find and click apply button
            apply_selectors = [
                '[data-testid="apply-button"]',
                'button:has-text("Candidatar")',
                'button:has-text("Inscrever")',
                '.apply-button',
            ]

            clicked = False
            for sel in apply_selectors:
                try:
                    await self._safe_click(sel, timeout=5000)
                    clicked = True
                    break
                except Exception:
                    continue

            if not clicked:
                screenshot = await self._take_screenshot(f"gupy_{company_name}", success=False)
                return ApplicationResult(
                    success=False,
                    status="Falhou",
                    screenshot_path=screenshot,
                    error_message="Botão de candidatura não encontrado",
                    platform="gupy",
                )

            await self._random_delay(1, 2)

            # Fill form fields if available
            fields = {
                'input[name*="name"], input[placeholder*="nome"]': self.profile.get("name", ""),
                'input[type="email"], input[name*="email"]': self.profile.get("email", ""),
                'input[type="tel"], input[name*="phone"]': self.profile.get("phone", ""),
            }

            for selector, value in fields.items():
                if value:
                    try:
                        await self._safe_fill(selector, value, timeout=3000)
                        await self._random_delay(0.5, 1)
                    except Exception:
                        pass

            # Upload CV if available
            if self.cv_path:
                try:
                    file_input = await self.page.query_selector('input[type="file"]')
                    if file_input:
                        await file_input.set_input_files(self.cv_path)
                        await self._random_delay(1, 2)
                except Exception as e:
                    logger.warning(f"CV upload failed: {e}")

            # Screenshot before submit
            await self._take_screenshot(f"gupy_{company_name}", success=True)

            # Try submit
            submit_selectors = [
                '[data-testid="submit-button"]',
                'button[type="submit"]',
                'button:has-text("Enviar")',
                'button:has-text("Finalizar")',
            ]

            submitted = False
            for sel in submit_selectors:
                try:
                    await self._safe_click(sel, timeout=5000)
                    submitted = True
                    break
                except Exception:
                    continue

            if submitted:
                await self._random_delay(2, 3)
                screenshot = await self._take_screenshot(f"gupy_{company_name}_confirm", success=True)
                return ApplicationResult(
                    success=True,
                    status="Enviado",
                    screenshot_path=screenshot,
                    platform="gupy",
                )
            else:
                screenshot = await self._take_screenshot(f"gupy_{company_name}", success=False)
                return ApplicationResult(
                    success=False,
                    status="Falhou",
                    screenshot_path=screenshot,
                    error_message="Botão de envio não encontrado",
                    platform="gupy",
                )

        except Exception as e:
            screenshot = await self._take_screenshot(f"gupy_{company_name}", success=False)
            logger.error(f"Gupy apply failed: {e}")
            return ApplicationResult(
                success=False,
                status="Falhou",
                screenshot_path=screenshot,
                error_message=str(e),
                platform="gupy",
            )
