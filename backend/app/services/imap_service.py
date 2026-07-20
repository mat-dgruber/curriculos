import logging
import imaplib
import email
from email.header import decode_header
from datetime import datetime, timedelta
from urllib.parse import urlparse
import re

from sqlalchemy import select
from app.core.database import async_session
from app.core.config import settings
from app.models.company import FixedCompany
from app.services import notification_service

logger = logging.getLogger(__name__)

def extract_domain(url: str | None) -> str | None:
    if not url:
        return None
    try:
        # Check if the url has schema, otherwise add it for urlparse to work correctly
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        parsed = urlparse(url)
        netloc = parsed.netloc
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc.lower()
    except Exception as e:
        logger.warning(f"Error parsing domain from url '{url}': {e}")
        return None

def extract_email_domain(email_str: str | None) -> str | None:
    if not email_str or "@" not in email_str:
        return None
    try:
        parts = email_str.split("@")
        return parts[-1].strip().lower()
    except Exception:
        return None

def decode_mime_words(s: str) -> str:
    try:
        parts = []
        for word, encoding in decode_header(s):
            if isinstance(word, bytes):
                try:
                    parts.append(word.decode(encoding or "utf-8", errors="ignore"))
                except Exception:
                    parts.append(word.decode("latin1", errors="ignore"))
            else:
                parts.append(str(word))
        return "".join(parts)
    except Exception:
        return s

async def check_company_responses() -> dict:
    """
    Connect to IMAP server and check for replies from active fixed companies.
    Updates company status to 'Respondeu' if a matching reply is found.
    """
    if not settings.imap_user or not settings.imap_password:
        logger.warning("IMAP user/password not configured. Skipping response check.")
        return {"processed": 0, "matched": 0, "error": "Not configured"}

    # Get active companies
    async with async_session() as db:
        result = await db.execute(
            select(FixedCompany).where(
                FixedCompany.is_active,
                FixedCompany.status != "Respondeu"
            )
        )
        companies = result.scalars().all()

        if not companies:
            logger.info("No active fixed companies found to monitor.")
            return {"processed": 0, "matched": 0}

        # Build lookup tables
        company_lookup = []
        for company in companies:
            domains = []
            if company.email:
                email_dom = extract_email_domain(company.email)
                if email_dom:
                    domains.append(email_dom)
            if company.application_url:
                web_dom = extract_domain(company.application_url)
                if web_dom and "gupy" not in web_dom and "vagas" not in web_dom:
                    domains.append(web_dom)
            
            company_lookup.append({
                "company": company,
                "name_clean": re.sub(r"[^\w\s]", "", company.name.lower()).strip(),
                "domains": domains,
                "email_clean": company.email.lower() if company.email else None
            })

        logger.info(f"Connecting to IMAP {settings.imap_host}:{settings.imap_port} for {settings.imap_user}...")
        try:
            # Connect via SSL
            mail = imaplib.IMAP4_SSL(settings.imap_host, settings.imap_port)
            mail.login(settings.imap_user, settings.imap_password)
            mail.select("inbox")

            # Search for emails in the last 7 days to keep it quick and efficient
            date_since = (datetime.now() - timedelta(days=7)).strftime("%d-%b-%Y")
            status, messages = mail.search(None, f'(SINCE "{date_since}")')

            if status != "OK":
                logger.error("Failed to search IMAP messages")
                return {"processed": 0, "matched": 0, "error": "Search failed"}

            email_ids = messages[0].split()
            logger.info(f"Found {len(email_ids)} emails in the last 7 days to analyze.")

            matched_count = 0
            processed_count = 0

            # Process in reverse order (most recent first)
            for e_id in reversed(email_ids):
                processed_count += 1
                # Fetch headers
                res, data = mail.fetch(e_id, "(RFC822.HEADER)")
                if res != "OK":
                    continue

                raw_email = data[0][1]
                msg = email.message_from_bytes(raw_email)

                sender = decode_mime_words(msg.get("From", ""))
                subject = decode_mime_words(msg.get("Subject", ""))
                
                # Parse sender email
                sender_email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", sender)
                if not sender_email_match:
                    continue
                sender_email = sender_email_match.group(0).lower()
                sender_domain = extract_email_domain(sender_email)

                # Analyze matches
                for item in company_lookup:
                    company = item["company"]
                    matched = False

                    # 1. Direct email match
                    if item["email_clean"] and sender_email == item["email_clean"]:
                        matched = True
                        logger.info(f"Matched by direct email '{sender_email}' for company '{company.name}'")

                    # 2. Domain match (excluding public domains like gmail/outlook)
                    elif sender_domain and sender_domain not in ("gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "uol.com.br", "terra.com.br"):
                        if sender_domain in item["domains"]:
                            matched = True
                            logger.info(f"Matched by sender domain '{sender_domain}' for company '{company.name}'")

                    # 3. Subject and Name heuristics
                    if not matched:
                        subject_lower = subject.lower()
                        name_clean = item["name_clean"]
                        
                        # If subject mentions company name and recruitment keywords
                        if name_clean in subject_lower or (company.name.lower() in sender.lower()):
                            keywords = ["processo", "seletivo", "vaga", "entrevista", "curriculo", "candidatura", "oportunidade", "agradecemos"]
                            if any(k in subject_lower for k in keywords):
                                matched = True
                                logger.info(f"Matched by subject heuristic for company '{company.name}': Sender='{sender}', Subject='{subject}'")

                    if matched:
                        # Update status
                        company.status = "Respondeu"
                        company.is_active = False
                        company.notes = (company.notes or "") + f"\n[System] Envio recorrente pausado: Resposta detectada por e-mail em {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}."
                        
                        # Send notification email to user
                        await notification_service.send_email(
                            subject=f"Candidatura Pausada: {company.name} respondeu ao seu contato",
                            body=f"Olá! O JobHunter detectou um e-mail de <b>{company.name}</b> (Remetente: {sender}, Assunto: {subject}).<br><br>"
                                 f"Por esse motivo, pausamos os envios recorrentes para esta empresa para manter a naturalidade do contato.<br>"
                                 f"Você pode reativar os envios manualmente na dashboard se desejar."
                        )
                        matched_count += 1
                        break # Go to next email

            if matched_count > 0:
                await db.commit()

            mail.close()
            mail.logout()

            return {"processed": processed_count, "matched": matched_count}

        except Exception as e:
            logger.error(f"Error processing IMAP responses: {e}")
            return {"processed": 0, "matched": 0, "error": str(e)}
