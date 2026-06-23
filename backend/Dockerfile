FROM mcr.microsoft.com/playwright/python:v1.50.0-jammy

WORKDIR /app

# Install uv for fast dependency resolution
RUN pip install --no-cache-dir uv==0.6.2

# Copy dependency manifest first for better layer caching
COPY pyproject.toml uv.lock* ./

# Install all deps (including dev for uvicorn/hot-reload)
RUN uv sync --frozen

# Copy source
COPY app ./app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
