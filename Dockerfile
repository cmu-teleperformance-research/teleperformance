# Multi-stage: build React frontend, then run FastAPI + static files on Cloud Run.
# Context: teleperformance/ (repo root that contains frontend/ and backend/)

# ── Frontend build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install
COPY frontend/ ./
# Empty VITE_API_URL → same-origin API calls (Cloud Run serves both)
ENV VITE_API_URL=
RUN npm run build

# ── Backend runtime ──────────────────────────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend /app/frontend/dist ./static

ENV PORT=8080
EXPOSE 8080

CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
