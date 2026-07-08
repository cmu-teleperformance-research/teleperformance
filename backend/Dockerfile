# syntax=docker/dockerfile:1

# --- Base image -------------------------------------------------------
# Match the Python version pinned in runtime.txt (python-3.11.9) so
# behavior is identical to the current Render deployment. The "slim"
# variant keeps the image small while still being Debian-based, which
# is what psycopg2-binary and other compiled wheels expect.
FROM python:3.11-slim

# --- Runtime environment ------------------------------------------------
# Don't write .pyc files or buffer stdout/stderr — buffered logs would
# otherwise get lost or delayed in Cloud Run's log collector.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# --- Working directory ----------------------------------------------
# All subsequent COPY/RUN/CMD instructions are relative to this path.
WORKDIR /app

# --- Dependencies (cached layer) -------------------------------------
# Copy only requirements.txt first so Docker can cache the pip install
# layer. As long as requirements.txt doesn't change, rebuilds skip
# reinstalling dependencies even if application code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Application source ------------------------------------------------
# Copy the rest of the backend/ directory (main.py, config.py, prompts/,
# workflows/, services/, api/, etc.) into the image. A .dockerignore
# file keeps local junk (venv, __pycache__, .env, *.db) out of the image.
COPY . .

# --- Networking ----------------------------------------------------
# Cloud Run injects the PORT environment variable at runtime (defaults
# to 8080) and routes external traffic to whatever port the container
# listens on. EXPOSE is documentation for humans/tools — Cloud Run
# ignores it and relies on $PORT — but it's good practice to keep it
# accurate.
ENV PORT=8080
EXPOSE 8080

# --- Start command -------------------------------------------------
# Shell form (not exec-array form) so that $PORT is expanded by the
# shell at container start. Binding to 0.0.0.0 (not 127.0.0.1) is
# required for Cloud Run to reach the process from outside the
# container's network namespace.
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
