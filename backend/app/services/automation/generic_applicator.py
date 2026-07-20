import logging
from app.services.automation.base_applicator import BaseApplicator, ApplicationResult

logger = logging.getLogger(__name__)

FIELD_MAPPING = {
    'name': [
        'input[name*="nome"]', 'input[name*="name"]', 'input[placeholder*="nome"]',
        'input[placeholder*="Nome"]', 'input[id*="nome"]', 'input[id*="name"]',
    ],
    'email': [
        'input[type="email"]', 'input[name*="email"]', 'input[placeholder*="e-mail"]',
        'input[placeholder*="email"]', 'input[id*="email"]',
    ],
    'phone': [
        'input[type="tel"]', 'input[name*="phone"]', 'input[name*="telefone"]',
        'input[placeholder*="telefone"]', 'input[placeholder*="phone"]',
        'input[name*="celular"]',
    ],
    'message': [
        'textarea', 'textarea[name*="mensagem"]', 'textarea[name*="message"]',
        'textarea[placeholder*="mensagem"]', 'textarea[placeholder*="apresentação"]',
    ],
    'file': [
        'input[type="file"]',
    ],
}

COVER_LETER_TEMPLATE = """Prezado(a) recrutador(a),

Tenho grande interesse em integrar a equipe da {company}. Possuo experiência relevante para a posição de {role} e acredito que minhas habilidades podem contribuir significativamente para os objetivos da empresa.

Meu currículo em anexo detalha minha trajetória profissional e competências técnicas.

Fico à disposição para uma conversa.

Atenciosamente,
{name}"""


class GenericApplicator(BaseApplicator):
    """Automate job applications on generic 'Trabalhe Conosco' forms."""

    async def apply(self, job_url: str, job_title: str, company_name: str) -> ApplicationResult:
        try:
            await self._safe_goto(job_url)
            await self._random_delay(2, 4)
            await self._take_screenshot(f"generic_{company_name}", step_name="1_loaded")

            filled_fields = 0

            # Fill name
            if self.profile.get("name"):
                for sel in FIELD_MAPPING['name']:
                    try:
                        await self._safe_fill(sel, self.profile["name"], timeout=3000)
                        filled_fields += 1
                        break
                    except Exception:
                        continue

            await self._random_delay(0.5, 1)

            # Fill email
            if self.profile.get("email"):
                for sel in FIELD_MAPPING['email']:
                    try:
                        await self._safe_fill(sel, self.profile["email"], timeout=3000)
                        filled_fields += 1
                        break
                    except Exception:
                        continue

            await self._random_delay(0.5, 1)

            # Fill phone
            if self.profile.get("phone"):
                for sel in FIELD_MAPPING['phone']:
                    try:
                        await self._safe_fill(sel, self.profile["phone"], timeout=3000)
                        filled_fields += 1
                        break
                    except Exception:
                        continue

            await self._random_delay(0.5, 1)

            # Fill cover letter / message
            if self.profile.get("name"):
                message = COVER_LETER_TEMPLATE.format(
                    company=company_name,
                    role=job_title,
                    name=self.profile["name"],
                )
                for sel in FIELD_MAPPING['message']:
                    try:
                        await self._safe_fill(sel, message, timeout=3000)
                        filled_fields += 1
                        break
                    except Exception:
                        continue

            await self._random_delay(0.5, 1)

            # Upload CV
            if self.cv_path:
                try:
                    for sel in FIELD_MAPPING['file']:
                        file_input = await self.page.query_selector(sel)
                        if file_input:
                            await file_input.set_input_files(self.cv_path)
                            filled_fields += 1
                            await self._random_delay(1, 2)
                            break
                except Exception as e:
                    logger.warning(f"CV upload failed on generic form: {e}")

            if filled_fields == 0:
                screenshot = await self._take_screenshot(f"generic_{company_name}", success=False, step_name="failed_detection")
                return ApplicationResult(
                    success=False,
                    status="Falhou",
                    screenshot_path=screenshot,
                    error_message="Nenhum campo do formulário foi detectado",
                    platform="generic",
                )

            # Screenshot before submit
            await self._take_screenshot(f"generic_{company_name}", success=True, step_name="2_filled")

            # Try submit
            submit_selectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Enviar")',
                'button:has-text("Enviar candidatura")',
                'button:has-text("Enviar currículo")',
                'button:has-text("Submit")',
                'button:has-text("Candidatar")',
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
                screenshot = await self._take_screenshot(f"generic_{company_name}", success=True, step_name="3_submitted")
                return ApplicationResult(
                    success=True,
                    status="Enviado",
                    screenshot_path=screenshot,
                    platform="generic",
                )
            else:
                screenshot = await self._take_screenshot(f"generic_{company_name}", success=False, step_name="failed_submit_btn")
                return ApplicationResult(
                    success=False,
                    status="Falhou",
                    screenshot_path=screenshot,
                    error_message="Botão de envio não encontrado",
                    platform="generic",
                )

        except Exception as e:
            screenshot = await self._take_screenshot(f"generic_{company_name}", success=False, step_name="exception_occurred")
            logger.error(f"Generic apply failed: {e}")
            return ApplicationResult(
                success=False,
                status="Falhou",
                screenshot_path=screenshot,
                error_message=str(e),
                platform="generic",
            )
