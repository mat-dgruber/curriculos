import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(subject: str, body: str) -> bool:
    """Send an email notification. Returns True if successful."""
    if not settings.smtp_user or not settings.smtp_password:
        logger.warning("SMTP not configured. Email not sent.")
        return False

    if not settings.notification_email:
        logger.warning("No notification email configured.")
        return False

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


def notify_new_jobs(count: int, platform_summary: dict) -> None:
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
            items += f"<li>{label}: {count_p} vagas</li>"
    body = f"""
    <h2>Novas vagas encontradas!</h2>
    <p>O JobHunter encontrou <strong>{count}</strong> novas vagas compatíveis.</p>
    <ul>
        {items}
    </ul>
    <p>Acesse o painel para verificar as vagas.</p>
    """
    send_email(f"{count} novas vagas encontradas", body)


def notify_application_success(job_title: str, company: str, platform: str) -> None:
    """Send notification about successful application."""
    body = f"""
    <h2>Currículo enviado com sucesso!</h2>
    <p>Seu currículo foi enviado para <strong>{company}</strong> para a vaga de <strong>{job_title}</strong>.</p>
    <p>Plataforma: {platform}</p>
    """
    send_email(f"Currículo enviado para {company}", body)


def notify_application_failure(job_title: str, company: str, error: str) -> None:
    """Send notification about failed application."""
    body = f"""
    <h2>Falha no envio do currículo</h2>
    <p>Não foi possível enviar seu currículo para <strong>{company}</strong> ({job_title}).</p>
    <p><strong>Motivo:</strong> {error}</p>
    <p>Acesse o painel para tentar novamente manualmente.</p>
    """
    send_email(f"Falha ao enviar para {company}", body)


def notify_recurring_send(company_name: str, total_sent: int, success: bool) -> None:
    """Send notification about recurring send result."""
    if success:
        body = f"""
        <h2>Envio recorrente realizado</h2>
        <p>Envio mensal realizado para <strong>{company_name}</strong>.</p>
        <p>Total de envios: {total_sent}</p>
        """
        send_email(f"Envio recorrente: {company_name}", body)
    else:
        body = f"""
        <h2>Falha no envio recorrente</h2>
        <p>O envio mensal para <strong>{company_name}</strong> falhou.</p>
        <p>Acesse o painel para verificar.</p>
        """
        send_email(f"Falha no envio recorrente: {company_name}", body)
