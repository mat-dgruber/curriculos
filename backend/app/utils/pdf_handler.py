"""
Utilitario para extrair texto de arquivos PDF.

Usa pdfplumber para melhor extraicao de texto em comparacao com PyPDF2.
Ideal para ler curriculos e documentos enviados pelos usuarios.
"""

import io
import logging
from pathlib import Path

import pdfplumber

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    """Extrai todo o texto de um arquivo PDF no disco.

    Args:
        file_path: Caminho absoluto ou relativo para o arquivo PDF.

    Returns:
        Texto extraido do PDF. Retorna string vazia se o arquivo
        nao existir ou nao for um PDF valido.

    Raises:
        FileNotFoundError: Se o arquivo nao for encontrado.
        ValueError: Se o arquivo nao for um PDF valido.
    """
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"Arquivo PDF nao encontrado: {file_path}")

    if path.suffix.lower() != ".pdf":
        raise ValueError(f"Arquivo nao e PDF: {file_path}")

    try:
        text_parts: list[str] = []

        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

        return "\n".join(text_parts)

    except Exception as exc:
        logger.error("Erro ao extrair texto do PDF '%s': %s", file_path, exc)
        raise ValueError(f"Falha ao processar PDF: {exc}") from exc


def extract_text_from_bytes(pdf_bytes: bytes) -> str:
    """Extrai texto de um PDF que ja esta em memoria (bytes).

    Util quando o arquivo vem de um upload (UploadFile do FastAPI)
    e ainda nao foi salvo em disco.

    Args:
        pdf_bytes: Conteudo do PDF em bytes.

    Returns:
        Texto extraido do PDF.

    Raises:
        ValueError: Se os bytes nao representarem um PDF valido.
    """
    if not pdf_bytes:
        raise ValueError("Bytes do PDF estao vazios")

    try:
        text_parts: list[str] = []

        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

        return "\n".join(text_parts)

    except Exception as exc:
        logger.error("Erro ao extrair texto de bytes PDF: %s", exc)
        raise ValueError(f"Falha ao processar PDF (bytes): {exc}") from exc
