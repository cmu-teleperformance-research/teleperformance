#!/usr/bin/env bash
# Deploy CSR Simulator to Cloud Run (API + frontend, one public URL).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-us-east1}"
SERVICE_NAME="${SERVICE_NAME:-csr-simulator}"
ENV_FILE="${ENV_FILE:-backend/.env}"

if [[ -z "$PROJECT_ID" || "$PROJECT_ID" == "(unset)" ]]; then
  echo "ERROR: Set GOOGLE_CLOUD_PROJECT or run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Missing $ENV_FILE (needed for LLM keys / SECRET_KEY / Firestore settings)"
  exit 1
fi

# Parse selected keys from .env into a Cloud Run env-vars YAML (never printed)
ENV_YAML="$(mktemp)"
trap 'rm -f "$ENV_YAML"' EXIT

KEYS=(LLM_PROVIDER OPENAI_API_KEY GROQ_API_KEY MODEL_NAME SECRET_KEY GOOGLE_CLOUD_PROJECT FIRESTORE_DATABASE DEBUG_PROMPTS)

python3 - "$ENV_FILE" "$ENV_YAML" "$PROJECT_ID" "${KEYS[@]}" <<'PY'
import sys
from pathlib import Path

env_file, out_file, project_id, *keys = sys.argv[1:]
wanted = set(keys)
values = {}
for raw in Path(env_file).read_text().splitlines():
    line = raw.split("#", 1)[0].strip()
    if not line or "=" not in line:
        continue
    k, _, v = line.partition("=")
    k, v = k.strip(), v.strip().strip('"').strip("'")
    if k in wanted and v:
        values[k] = v

values.setdefault("GOOGLE_CLOUD_PROJECT", project_id)
values.setdefault("FIRESTORE_DATABASE", "tp-feedback-study")
values.setdefault("LLM_PROVIDER", "openai")
values.setdefault("MODEL_NAME", "gpt-4o")
values.setdefault("DEBUG_PROMPTS", "false")

# Skip placeholder keys
for placeholder_key, placeholder in (("OPENAI_API_KEY", "sk-..."), ("GROQ_API_KEY", "gsk_...")):
    if values.get(placeholder_key) == placeholder:
        values.pop(placeholder_key, None)

if not values.get("SECRET_KEY") or values["SECRET_KEY"] == "your-secret-key":
    raise SystemExit("SECRET_KEY must be set to a real value in backend/.env")

# Prefer real provider key
if values.get("LLM_PROVIDER") == "openai" and "OPENAI_API_KEY" not in values:
    raise SystemExit("OPENAI_API_KEY must be set in backend/.env for LLM_PROVIDER=openai")

with open(out_file, "w") as f:
    for k, v in values.items():
        # YAML double-quoted escaping
        escaped = v.replace("\\", "\\\\").replace('"', '\\"')
        f.write(f'{k}: "{escaped}"\n')
PY

echo "==> Project: $PROJECT_ID"
echo "==> Region:  $REGION"
echo "==> Service: $SERVICE_NAME"
echo "==> Enabling required APIs..."

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  --project="$PROJECT_ID"

echo "==> Building and deploying to Cloud Run (this may take several minutes)..."

gcloud run deploy "$SERVICE_NAME" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --source="." \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --min-instances=0 \
  --max-instances=10 \
  --env-vars-file="$ENV_YAML"

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# echo "==> Granting Firestore access to Cloud Run service account..."
# gcloud projects add-iam-policy-binding "$PROJECT_ID" \
#   --member="serviceAccount:${RUNTIME_SA}" \
#   --role="roles/datastore.user" \
#   --condition=None \
#   --quiet >/dev/null || true

URL="$(gcloud run services describe "$SERVICE_NAME" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"
echo ""
echo "Deployed. Share this link:"
echo "  $URL"
echo ""
echo "Health check: ${URL}/health"
