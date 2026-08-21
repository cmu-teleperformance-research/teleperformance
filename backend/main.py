import hashlib
import json as json_lib
import os
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timezone
from pydantic import BaseModel
from google.cloud import firestore

from services.llm_service import call_llm, start_conversation, generate_report, stream_llm_response, run_feedback_pipeline
from services.prompt_metadata import extract_portal_data, inject_metadata
from database import get_db, get_client
from auth import hash_password, verify_password, create_access_token, get_current_user, get_role, require_researcher
import models

app = FastAPI(title="CSR Training Simulator API")

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
_ASSETS_DIR = os.path.join(STATIC_DIR, "assets")
_INDEX_HTML = os.path.join(STATIC_DIR, "index.html")
_HAS_FRONTEND = os.path.isfile(_INDEX_HTML)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-User-Message-Id"],
)

VALID_SCENARIOS = {"flight_cancellation", "baggage_delay", "book_flight", "loan_delay", "refund_request", "package_never_arrived", "exchange_item"}
VALID_PERSONAS = {"angry", "confused", "demanding", "anxious"}
VALID_CONDITIONS = {"cond1", "cond2", "cond3", "cond4"}
PATH_SESSION_COUNT = 3


def _completion_code_for(user_id: str, condition: str) -> str:
    """Deterministic completion hash for a participant + condition (for survey forms)."""
    secret = os.getenv("COMPLETION_SECRET", "csr-completion-v1")
    digest = hashlib.sha256(f"{user_id}:{condition}:{secret}".encode()).hexdigest()[:12].upper()
    cond_tag = condition.upper().replace("COND", "C")
    return f"TP-{cond_tag}-{digest}"

SCENARIO_LABELS = {
    "flight_cancellation": "Flight Cancellation",
    "baggage_delay": "Lost Baggage",
    "book_flight": "Book Flight",
    "loan_delay": "Loan Delay",
    "refund_request": "Refund Request",
    "package_never_arrived": "Package Never Arrived",
    "exchange_item": "Exchange Item",
}

# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    username: str
    password: str


class ParticipantJoinRequest(BaseModel):
    pid: str


@app.post("/participant/join")
def participant_join(request: ParticipantJoinRequest, db: firestore.Client = Depends(get_db)):
    pid = request.pid.strip()
    if not pid:
        raise HTTPException(status_code=400, detail="Participant ID cannot be empty")
    user = models.get_user_by_username(db, pid)
    if not user:
        # Hash a random secret so this account can never be accessed via password login
        random_hash = hash_password(os.urandom(32).hex())
        try:
            user = models.create_user(db, name=pid, username=pid, hashed_password=random_hash)
        except ValueError:
            user = models.get_user_by_username(db, pid)
            if not user:
                raise HTTPException(status_code=500, detail="Failed to create participant")
    return {
        "access_token": create_access_token(user.id, user.username),
        "token_type": "bearer",
        "name": user.name,
        "role": get_role(user.username),
    }


@app.post("/register")
def register(request: RegisterRequest, db: firestore.Client = Depends(get_db)):
    try:
        user = models.create_user(
            db,
            name=request.name,
            username=request.username,
            hashed_password=hash_password(request.password),
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Username already taken")
    return {
        "access_token": create_access_token(user.id, user.username),
        "token_type": "bearer",
        "name": user.name,
        "role": get_role(user.username),
    }


@app.post("/login")
def login(request: LoginRequest, db: firestore.Client = Depends(get_db)):
    user = models.get_user_by_username(db, request.username)
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    role = get_role(user.username)
    from auth import RESEARCHER_USERNAMES
    print(f"[DEBUG login] username={user.username!r}  role={role!r}  in_allowlist={user.username in RESEARCHER_USERNAMES}")
    return {
        "access_token": create_access_token(user.id, user.username),
        "token_type": "bearer",
        "name": user.name,
        "role": role,
    }


@app.get("/me")
def me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "username": current_user.username,
        "role": get_role(current_user.username),
        "completions": current_user.completions or {},
    }


class AssignDomainRequest(BaseModel):
    condition: str | None = None


@app.post("/assign-domain")
def assign_domain(
    request: AssignDomainRequest,
    db: firestore.Client = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Assign the least-used domain for this condition so cells stay balanced."""
    condition = (request.condition or "").strip() or None
    if condition and condition not in VALID_CONDITIONS:
        raise HTTPException(status_code=400, detail=f"condition must be one of {VALID_CONDITIONS}")
    return models.assign_domain(db, user_id=current_user.id, condition=condition or "default")


class CompletePathRequest(BaseModel):
    condition: str | None = None
    domain: str | None = None


@app.post("/complete-path")
def complete_path(
    request: CompletePathRequest,
    db: firestore.Client = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Issue (or return) a completion code after the participant finishes all path scenarios."""
    condition = (request.condition or "").strip() or None
    if condition and condition not in VALID_CONDITIONS:
        raise HTTPException(status_code=400, detail=f"condition must be one of {VALID_CONDITIONS}")

    # Key completions by condition, or "default" when no experimental condition is set
    completion_key = condition or "default"
    existing = (current_user.completions or {}).get(completion_key)
    if existing and existing.get("code"):
        return existing

    reported = [
        s for s in models.list_sessions_for_user(db, current_user.id)
        if s.report is not None and (not condition or s.condition == condition)
    ]
    if len(reported) < PATH_SESSION_COUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Complete all {PATH_SESSION_COUNT} scenarios before requesting a completion code "
                   f"(found {len(reported)} with reports).",
        )

    completion = {
        "code": _completion_code_for(current_user.id, completion_key),
        "condition": condition,
        "domain": request.domain,
        "session_count": len(reported),
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }
    models.save_user_completion(db, current_user.id, completion_key, completion)
    return completion


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@app.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    db: firestore.Client = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    models.update_user_password(db, current_user.id, hash_password(request.new_password))
    return {"detail": "Password updated successfully"}


# ── Sessions history ──────────────────────────────────────────────────────────

@app.get("/sessions")
def list_sessions(
    request: Request,
    db: firestore.Client = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    print("[DEBUG /sessions] incoming request:", {
        "method": request.method,
        "url": str(request.url),
        "query_params": dict(request.query_params),
        "headers": dict(request.headers),
        "user_id": current_user.id,
        "username": current_user.username,
    })
    sessions = models.list_sessions_for_user(db, current_user.id)
    return [
        {
            "id": s.id,
            "scenario": s.scenario,
            "scenario_label": SCENARIO_LABELS.get(s.scenario, s.scenario),
            "persona": s.persona,
            "training": s.training,
            "condition": s.condition,
            "created_at": s.created_at.isoformat(),
            "has_report": s.report is not None,
        }
        for s in sessions
    ]


@app.get("/sessions/{session_id}")
def get_session(
    session_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    session = models.get_session(db, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = models.list_messages(db, session_id)

    return {
        "id": session.id,
        "scenario": session.scenario,
        "scenario_label": SCENARIO_LABELS.get(session.scenario, session.scenario),
        "persona": session.persona,
        "training": session.training,
        "condition": session.condition,
        "created_at": session.created_at.isoformat(),
        "messages": [
            {
                "role": m.role,
                "content": m.content,
                "feedback": json_lib.loads(m.feedback_json) if m.feedback_json else None,
            }
            for m in messages
        ],
        "report": session.report,
        "attention_check": session.attention_check,
    }


# ── Research dashboard ────────────────────────────────────────────────────────

@app.get("/research/sessions")
def research_list_sessions(
    db: firestore.Client = Depends(get_db),
    current_user: models.User = Depends(require_researcher),
):
    sessions = models.list_all_sessions(db)
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "username": s.username,
            "display_name": s.display_name,
            "scenario": s.scenario,
            "scenario_label": SCENARIO_LABELS.get(s.scenario, s.scenario),
            "persona": s.persona,
            "training": s.training,
            "condition": s.condition,
            "created_at": s.created_at.isoformat(),
            "has_report": s.report is not None,
        }
        for s in sessions
    ]


@app.get("/research/sessions/{session_id}")
def research_get_session(
    session_id: str,
    db: firestore.Client = Depends(get_db),
    current_user: models.User = Depends(require_researcher),
):
    session = models.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = models.list_messages(db, session_id)

    return {
        "id": session.id,
        "user_id": session.user_id,
        "username": session.username,
        "display_name": session.display_name,
        "scenario": session.scenario,
        "scenario_label": SCENARIO_LABELS.get(session.scenario, session.scenario),
        "persona": session.persona,
        "training": session.training,
        "condition": session.condition,
        "created_at": session.created_at.isoformat(),
        "messages": [
            {
                "role": m.role,
                "content": m.content,
                "feedback": json_lib.loads(m.feedback_json) if m.feedback_json else None,
            }
            for m in messages
        ],
        "report": session.report,
        "attention_check": session.attention_check,
    }


class AttentionCheckRequest(BaseModel):
    selected_id: str


@app.post("/sessions/{session_id}/attention-check")
def submit_attention_check(
    session_id: str,
    request: AttentionCheckRequest,
    db: firestore.Client = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    session = models.get_session(db, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.attention_check:
        return session.attention_check

    if request.selected_id not in VALID_SCENARIOS:
        raise HTTPException(status_code=400, detail=f"selected_id must be one of {VALID_SCENARIOS}")

    payload = {
        "question_type": "scenario_main_issue",
        "prompt": "What was the customer's main issue?",
        "selected_id": request.selected_id,
        "correct_id": session.scenario,
        "correct": request.selected_id == session.scenario,
        "answered_at": datetime.now(timezone.utc).isoformat(),
    }
    models.save_attention_check(db, session_id, payload)
    return payload


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    scenario: str
    persona: str
    training: bool
    message: str
    history: list[dict]
    session_id: str | None = None
    condition: str | None = None
    feedback: dict | None = None


class FeedbackModel(BaseModel):
    state: str = ""
    score: int = 0
    suggestion: str = ""
    example_response: str = ""


class ChatResponse(BaseModel):
    customer_response: str
    feedback: FeedbackModel | None = None
    session_id: str | None = None
    user_message_id: str | None = None


class StartRequest(BaseModel):
    scenario: str
    persona: str
    training: bool
    condition: str | None = None


@app.post("/start", response_model=ChatResponse)
async def start(
    request: StartRequest,
    db: firestore.Client = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if request.scenario not in VALID_SCENARIOS:
        raise HTTPException(status_code=400, detail=f"scenario must be one of {VALID_SCENARIOS}")
    if request.persona not in VALID_PERSONAS:
        raise HTTPException(status_code=400, detail=f"persona must be one of {VALID_PERSONAS}")

    result = start_conversation(request.scenario, request.persona, request.training)

    session_record = models.create_session(
        db,
        user_id=current_user.id,
        username=current_user.username,
        display_name=current_user.name,
        scenario=request.scenario,
        persona=request.persona,
        training=request.training,
        condition=request.condition,
    )

    models.add_message(
        db,
        session_id=session_record.id,
        role="assistant",
        content=result["customer_response"],
    )

    return ChatResponse(**result, session_id=session_record.id)


@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: firestore.Client = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if request.scenario not in VALID_SCENARIOS:
        raise HTTPException(status_code=400, detail=f"scenario must be one of {VALID_SCENARIOS}")
    if request.persona not in VALID_PERSONAS:
        raise HTTPException(status_code=400, detail=f"persona must be one of {VALID_PERSONAS}")
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="message cannot be empty")

    session = models.get_session(db, request.session_id) if request.session_id else None
    if session is None or session.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Invalid or missing session_id")
    if session.scenario != request.scenario or session.persona != request.persona:
        raise HTTPException(status_code=400, detail="Session scenario/persona mismatch. Start a new session.")

    result = call_llm(
        scenario=request.scenario,
        persona=request.persona,
        training=False,  # Eval pipeline runs separately via /feedback
        message=request.message,
        history=request.history,
        condition=request.condition,
        feedback=request.feedback,
    )

    user_msg = models.add_message(
        db,
        session_id=request.session_id,
        role="user",
        content=request.message,
        feedback=request.feedback,
    )
    models.add_message(
        db,
        session_id=request.session_id,
        role="assistant",
        content=result["customer_response"],
    )

    return ChatResponse(
        customer_response=result["customer_response"],
        session_id=request.session_id,
        user_message_id=user_msg.id,
    )


class FeedbackRequest(BaseModel):
    scenario: str
    persona: str
    message: str
    history: list[dict]
    session_id: str
    user_message_id: str | None = None
    condition: str | None = None


@app.post("/feedback")
async def feedback(
    request: FeedbackRequest,
    db: firestore.Client = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    session = models.get_session(db, request.session_id)
    if session is None or session.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Invalid or missing session_id")

    fb = run_feedback_pipeline(request.message, request.history)

    # Persist coaching feedback onto the CSR (user) message when it already exists.
    # Training mode often calls /feedback before /chat, so there may be no message yet —
    # in that case /chat stores feedback on create.
    message_id = request.user_message_id
    if message_id is None:
        latest = models.get_latest_user_message(db, request.session_id)
        if latest is not None:
            message_id = latest.id

    saved = False
    if message_id is not None:
        saved = models.update_message_feedback(
            db,
            session_id=request.session_id,
            message_id=message_id,
            feedback=fb,
        )
        if not saved:
            print(f"[feedback] message {message_id} not found in session {request.session_id}")
    else:
        print(f"[feedback] no user message yet for session {request.session_id}; /chat will save feedback")

    return {"feedback": fb, "saved": saved, "user_message_id": message_id}


def _stream_with_db_save(base_gen, session_id: str | None):
    """Wraps a text generator: yields all chunks, then saves the full response to DB."""
    full_text = ""
    for chunk in base_gen:
        full_text += chunk
        yield chunk
    if session_id is not None:
        try:
            models.add_message(
                get_client(),
                session_id=session_id,
                role="assistant",
                content=full_text,
            )
        except Exception as e:
            print(f"ERROR saving streamed assistant message: {e}")


@app.post("/chat-stream")
async def chat_stream(
    request: ChatRequest,
    db: firestore.Client = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if request.scenario not in VALID_SCENARIOS:
        raise HTTPException(status_code=400, detail=f"scenario must be one of {VALID_SCENARIOS}")
    if request.persona not in VALID_PERSONAS:
        raise HTTPException(status_code=400, detail=f"persona must be one of {VALID_PERSONAS}")
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="message cannot be empty")

    user_message_id = None
    if request.session_id is not None:
        user_msg = models.add_message(
            db,
            session_id=request.session_id,
            role="user",
            content=request.message,
        )
        user_message_id = user_msg.id

    headers = {}
    if user_message_id is not None:
        headers["X-User-Message-Id"] = str(user_message_id)

    return StreamingResponse(
        _stream_with_db_save(
            stream_llm_response(
                scenario=request.scenario,
                persona=request.persona,
                message=request.message,
                history=request.history,
            ),
            request.session_id,
        ),
        media_type="text/plain",
        headers=headers,
    )


class ReportRequest(BaseModel):
    scenario: str
    persona: str
    training: bool
    history: list[dict]
    session_id: str | None = None
    condition: str | None = None


@app.post("/report")
async def report(
    request: ReportRequest,
    db: firestore.Client = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if request.scenario not in VALID_SCENARIOS:
        raise HTTPException(status_code=400, detail=f"scenario must be one of {VALID_SCENARIOS}")

    result = generate_report(history=request.history)
    models.save_session_report(db, request.session_id, result)
    return result


def load_workflow_config(scenario: str) -> dict:
    path = os.path.join(os.path.dirname(__file__), "workflows", f"{scenario}.json")
    with open(path) as f:
        template = json_lib.load(f)
    metadata = extract_portal_data(scenario)
    return inject_metadata(template, metadata)


@app.get("/workflow/{scenario}")
def get_workflow(scenario: str):
    if scenario not in VALID_SCENARIOS:
        raise HTTPException(status_code=400, detail=f"scenario must be one of {list(VALID_SCENARIOS)}")
    try:
        return load_workflow_config(scenario)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Workflow config not found for scenario: {scenario}")


@app.api_route("/", methods=["GET", "HEAD"])
def root():
    if _HAS_FRONTEND:
        return FileResponse(_INDEX_HTML)
    return {"status": "ok"}


@app.get("/health")
def health(db: firestore.Client = Depends(get_db)):
    models.ping(db)
    return {"status": "ok"}


# Serve Vite build (same Cloud Run URL for UI + API). Registered last so API routes win.
if _HAS_FRONTEND and os.path.isdir(_ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=_ASSETS_DIR), name="assets")


@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    """SPA fallback for React Router paths (e.g. /cond1)."""
    if not _HAS_FRONTEND:
        raise HTTPException(status_code=404, detail="Not found")
    candidate = os.path.join(STATIC_DIR, full_path)
    if full_path and os.path.isfile(candidate):
        return FileResponse(candidate)
    return FileResponse(_INDEX_HTML)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
