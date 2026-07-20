import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(subject: str, body: str) -> bool:
    """Send an email notification. Returns True if successful."""
    if not settings.smtp_user or not settings.smtp_password:
        logger.warning("SMTP not configured. Email not sent.")
        return False

    if not settings.notification_email:
        logger.warning("No notification email configured.")
        return False

    import asyncio
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    def _send():
        try:
            msg = MIMEMultipart()
            msg["From"] = settings.smtp_user
            msg["To"] = settings.notification_email
            msg["Subject"] = f"[JobHunter] {subject}"

            msg.attach(MIMEText(body, "html"))

            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    if loop and loop.is_running():
        # Offload SMTP I/O (sync) to a worker thread so the event loop
        # isn't blocked. Await the future to preserve delivery True/False
        # semantics for callers that rely on the return value.
        return await asyncio.to_thread(_send)
    else:
        return _send()


def _wrap_in_capycro_template(title_text: str, content_html: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #120f1a;
            color: #e2e8f0;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background-color: #1a1526;
            border-radius: 12px;
            border: 1px solid #2e2445;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);
        }}
        .header {{
            background: linear-gradient(135deg, #7c3aed 0%, #0d9488 100%);
            padding: 30px;
            text-align: center;
        }}
        .header h1 {{
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }}
        .content {{
            padding: 30px;
            line-height: 1.6;
        }}
        .footer {{
            background-color: #120f1a;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #2e2445;
        }}
        h2 {{
            color: #a855f7;
            font-size: 20px;
            margin-top: 0;
            margin-bottom: 15px;
        }}
        ul {{
            padding-left: 20px;
            margin: 15px 0;
        }}
        li {{
            margin-bottom: 8px;
        }}
        strong {{
            color: #38bdf8;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }}
        .badge-success {{
            background-color: rgba(20, 184, 166, 0.2);
            color: #2dd4bf;
            border: 1px solid rgba(20, 184, 166, 0.3);
        }}
        .badge-failure {{
            background-color: rgba(239, 68, 68, 0.2);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }}
        .button-container {{
            margin-top: 25px;
            text-align: center;
        }}
        .button {{
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>JobHunter</h1>
        </div>
        <div class="content">
            {content_html}
        </div>
        <div class="footer">
            <p>Enviado automaticamente pelo <strong>JobHunter Capycro</strong>.</p>
        </div>
    </div>
</body>
</html>"""


async def notify_new_jobs(count: int, platform_summary: dict) -> None:
    """Send notification about new jobs found."""
    platform_names = {
        "linkedin": "LinkedIn",
        "gupy": "Gupy",
        "vagas": "Vagas.com",
        "jooble": "Jooble",
        "adzuna": "Adzuna",
        "remotive": "Remotive",
        "infojobs": "InfoJobs",
        "catho": "Catho",
    }
    items = ""
    for key, label in platform_names.items():
        count_p = platform_summary.get(key, 0)
        if count_p > 0:
            items += f"<li><strong>{label}:</strong> {count_p} vagas</li>"
    
    html_content = f"""
    <h2>🔍 Novas Vagas Encontradas!</h2>
    <p>O robô rastreador analisou as plataformas e identificou <strong>{count}</strong> novas vagas compatíveis com o seu perfil profissional.</p>
    <ul>
        {items}
    </ul>
    <p>Acesse o seu painel web para revisar, ajustar afinidade e enviar candidaturas.</p>
    <div class="button-container">
        <a href="{settings.frontend_url}/jobs" class="button">Ver Recomendações</a>
    </div>
    """
    body = _wrap_in_capycro_template("Varredura Concluída", html_content)
    await send_email(f"{count} novas vagas encontradas", body)


async def notify_application_success(job_title: str, company: str, platform: str) -> None:
    """Send notification about successful application."""
    html_content = f"""
    <h2>✅ Candidatura Enviada com Sucesso!</h2>
    <p>Excelente notícia! O robô de automação preencheu com sucesso os dados e enviou seu currículo.</p>
    <table style="width:100%; border-collapse: collapse; margin: 15px 0;">
        <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Vaga:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #e2e8f0;">{job_title}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Empresa:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #e2e8f0;">{company}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Plataforma:</td>
            <td style="padding: 8px 0;"><span class="badge badge-success">{platform}</span></td>
        </tr>
    </table>
    <div class="button-container">
        <a href="{settings.frontend_url}/applications" class="button">Ver Minhas Candidaturas</a>
    </div>
    """
    body = _wrap_in_capycro_template("Candidatura Confirmada", html_content)
    await send_email(f"Currículo enviado para {company}", body)


async def notify_application_failure(job_title: str, company: str, error: str) -> None:
    """Send notification about failed application."""
    html_content = f"""
    <h2>⚠️ Falha no Envio Automático</h2>
    <p>O robô encontrou um obstáculo ao preencher o formulário para a seguinte vaga:</p>
    <table style="width:100%; border-collapse: collapse; margin: 15px 0;">
        <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Vaga:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #e2e8f0;">{job_title}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Empresa:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #e2e8f0;">{company}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Erro:</td>
            <td style="padding: 8px 0; color: #f87171; font-family: monospace;">{error}</td>
        </tr>
    </table>
    <p>Você pode tentar enviar a candidatura de forma manual pelo link disponível no painel.</p>
    <div class="button-container">
        <a href="{settings.frontend_url}/jobs" class="button">Resolver no Painel</a>
    </div>
    """
    body = _wrap_in_capycro_template("Falha na Automação", html_content)
    await send_email(f"Falha ao enviar para {company}", body)


async def notify_recurring_send(company_name: str, total_sent: int, success: bool) -> None:
    """Send notification about recurring send result."""
    status_badge = '<span class="badge badge-success">Sucesso</span>' if success else '<span class="badge badge-failure">Falhou</span>'
    
    if success:
        html_content = f"""
        <h2>🔄 Envio Recorrente Concluído</h2>
        <p>O seu currículo atualizado foi enviado automaticamente para manter seu perfil ativo no banco de talentos da empresa parceira.</p>
        <table style="width:100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
                <td style="padding: 8px 0; color: #94a3b8;">Empresa:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #e2e8f0;">{company_name}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #94a3b8;">Total de Envios:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #e2e8f0;">{total_sent} envios</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #94a3b8;">Status:</td>
                <td style="padding: 8px 0;">{status_badge}</td>
            </tr>
        </table>
        """
        title = "Envio Recorrente Ativo"
    else:
        html_content = f"""
        <h2>❌ Falha no Envio Recorrente</h2>
        <p>Não foi possível renovar a sua candidatura periódica para a seguinte empresa:</p>
        <table style="width:100%; border-collapse: collapse; margin: 15px 0;">
            <tr>
                <td style="padding: 8px 0; color: #94a3b8;">Empresa:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #e2e8f0;">{company_name}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #94a3b8;">Status:</td>
                <td style="padding: 8px 0;">{status_badge}</td>
            </tr>
        </table>
        <p>Verifique a conectividade da rede ou se o formulário/URL da empresa sofreu modificações recentes.</p>
        """
        title = "Erro no Envio Recorrente"
        
    body = _wrap_in_capycro_template(title, html_content)
    await send_email(f"Envio recorrente: {company_name}" if success else f"Falha no envio recorrente: {company_name}", body)
