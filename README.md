# CSR Conflict Resolution Simulator

An AI-powered training platform for customer service representatives. Trainees practice de-escalation conversations with realistic AI customers, receive per-turn coaching feedback, and get an end-of-session performance report.

## What it does

- **Roleplay scenarios** — the AI plays a difficult customer across four domains (flight cancellation, lost baggage, loan delay, failed refund).
- **Emotional personas** — each scenario can be paired with any of four emotional styles: angry, confused, demanding, or anxious. Scenario facts stay fixed; only the emotional layer changes.
- **Two modes** — *Training* gives live coaching feedback after every CSR reply. *Evaluation* streams the customer response without feedback, assessed only at the end.
- **Internal portal** — a simulated airline/bank tool runs alongside the chat, guiding the trainee through the correct procedural steps (passenger lookup, policy review, resolution).
- **Session history** — every session and turn is stored; trainees can review past conversations and reports.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI |
| Database | Google Cloud Firestore |
| LLM | OpenAI or Groq (configurable) |
| Frontend | React 18, Vite, Tailwind CSS, Axios |
| Auth | JWT (7-day tokens), bcrypt |
| Deployment | Vercel (monorepo); Cloud Run recommended for GCP |

## Local development

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
LLM_PROVIDER=openai          # or "groq"
OPENAI_API_KEY=sk-...        # if using openai
GROQ_API_KEY=gsk_...         # if using groq
MODEL_NAME=gpt-4o            # model name for the chosen provider
SECRET_KEY=your-secret-key
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
FIRESTORE_DATABASE=tp-feedback-study
# Local: FIRESTORE_EMULATOR_HOST=localhost:8080  (omit this to use real GCP)
# Optional: GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
DEBUG_PROMPTS=false          # set true to print the full assembled system prompt
```

### Firestore emulator (recommended for local)

Keeps local sessions out of the study database.

```bash
# once
brew install openjdk@21
npm install -g firebase-tools

# each session — leave this terminal open
./scripts/start-firestore-emulator.sh
```

Emulator UI: http://localhost:4000

Ensure `backend/.env` has `FIRESTORE_EMULATOR_HOST=localhost:8080`. Keep `FIRESTORE_DATABASE=tp-feedback-study` for Cloud Run — when the emulator host is set, the backend ignores that name and uses `(default)` locally (emulator limitation), so real study data is never written. Remove `FIRESTORE_EMULATOR_HOST` only when you intentionally want live GCP data.

```bash
uvicorn main:app --reload --port 8000
```

You should see `[database] Using Firestore (emulator@localhost:8080)` on startup.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

## Deployment (Google Cloud Run)

One Cloud Run service serves the React UI and FastAPI API (single public URL).

```bash
# From teleperformance/
./deploy.sh
```

Requires `gcloud` logged in, billing enabled on the project, and `backend/.env` filled in
(`OPENAI_API_KEY` / `GROQ_API_KEY`, `SECRET_KEY`, `GOOGLE_CLOUD_PROJECT`, `FIRESTORE_DATABASE`).

Optional: `REGION=us-central1 SERVICE_NAME=csr-simulator ./deploy.sh`

## Deployment (Vercel)

The repo uses `vercel.json` to configure a monorepo deployment:
- Frontend served from `/` (Vite build)
- Backend served from `/_/backend` (FastAPI via Mangum)

Set the following environment variables in the Vercel dashboard for the backend service:
`LLM_PROVIDER`, `OPENAI_API_KEY` / `GROQ_API_KEY`, `MODEL_NAME`, `SECRET_KEY`, `GOOGLE_CLOUD_PROJECT` (plus GCP credentials / workload identity for Firestore)

## Scenarios and personas

### Scenarios (factual context)
| Key | Customer | Situation |
|---|---|---|
| `flight_cancellation` | Jordan Blake | Flight cancelled 90 min before departure; needs rebooking and compensation |
| `baggage_delay` | Alex Rivera | Bag missing for 2 days; contains prescription medication and client documents |
| `loan_delay` | Avery Collins | Personal loan delayed past promised 5-day window; financial stress |
| `refund_request` | Morgan | $340 debited for a failed transaction; merchant confirmed failure, money not returned |

### Personas (emotional layer)
| Key | Emotion | Behaviour |
|---|---|---|
| `angry` | Intensely frustrated | Confrontational, escalates quickly, de-escalates only on concrete resolution |
| `confused` | Overwhelmed | Asks many questions, needs plain language, asks for supervisor out of hope not anger |
| `demanding` | Composed but firm | Corporate tone, pushes for exact outcomes, calmly threatens escalation |
| `anxious` | Worried, catastrophising | Revisits same concern repeatedly, needs explicit confirmation, relieved by certainty |

## API endpoints

```
POST /register          Create account
POST /login             Get JWT token
GET  /me                Authenticated user info
POST /change-password

GET  /sessions          List user's past sessions
GET  /sessions/{id}     Retrieve full session with messages and report

POST /start             Begin a new session → returns opening customer message
POST /chat              Send CSR reply → returns customer response + feedback (training mode)
POST /chat-stream       Send CSR reply → streams customer response (evaluation mode)
POST /report            End session → returns coaching report

GET  /workflow/{scenario}   Load the workflow portal config for a scenario
GET  /health
```

## Project structure

```
├── backend/
│   ├── main.py                  API routes and request validation
│   ├── models.py                Firestore document helpers (User, Session, Message)
│   ├── auth.py                  JWT + bcrypt auth
│   ├── database.py              Firestore client setup
│   ├── config.py                LLM provider selection (OpenAI / Groq)
│   ├── services/
│   │   ├── llm_service.py       Prompt assembly, LLM calls, coaching evaluation
│   │   └── prompt_metadata.py   Extracts PORTAL_DATA from scenario files; injects into workflow JSON
│   ├── prompts/
│   │   ├── scenarios/           One file per scenario — factual context only
│   │   ├── emotions/            One file per persona — emotional behaviour only
│   │   ├── shared/              system_rules, behavior_rules, output_format
│   │   ├── formats/             plain.txt, training.txt, stream.txt — JSON response schemas
│   │   ├── evaluation/          coaching.txt (scoring rubric), session_report.txt
│   │   └── openers/             First message prompt per scenario
│   └── workflows/               JSON config for the internal portal per scenario
│
└── frontend/
    ├── src/
    │   ├── App.jsx              Top-level routing and session state
    │   ├── components/
    │   │   ├── ModeSelector.jsx  4-step session setup wizard
    │   │   ├── ChatWindow.jsx    Main chat UI with embedded portal
    │   │   ├── FeedbackPanel.jsx Per-turn coaching display (training mode)
    │   │   ├── ReportPage.jsx    End-of-session report view
    │   │   └── workflow/         Internal portal components per scenario
```
