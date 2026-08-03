"""Firestore document helpers for users, sessions, messages, and reports.

Collections:
  users/{userId}
  usernames/{username}          → { user_id }  (uniqueness index)
  sessions/{sessionId}
  sessions/{sessionId}/messages/{messageId}
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from google.cloud import firestore


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _as_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    return _utcnow()


@dataclass
class User:
    id: str
    name: str
    username: str
    hashed_password: str
    created_at: datetime
    completions: dict | None = None


@dataclass
class SessionRecord:
    id: str
    user_id: str | None
    username: str | None
    display_name: str | None
    scenario: str
    persona: str
    training: bool
    condition: str | None
    created_at: datetime
    report: dict | None = None
    attention_check: dict | None = None


@dataclass
class MessageRecord:
    id: str
    session_id: str
    role: str
    content: str
    feedback_json: str | None
    created_at: datetime


def _user_from_doc(doc_id: str, data: dict) -> User:
    return User(
        id=doc_id,
        name=data["name"],
        username=data["username"],
        hashed_password=data["hashed_password"],
        created_at=_as_datetime(data.get("created_at")),
        completions=data.get("completions") or {},
    )


def _session_from_doc(doc_id: str, data: dict) -> SessionRecord:
    return SessionRecord(
        id=doc_id,
        user_id=data.get("user_id"),
        username=data.get("username"),
        display_name=data.get("display_name"),
        scenario=data["scenario"],
        persona=data["persona"],
        training=bool(data.get("training", False)),
        condition=data.get("condition"),
        created_at=_as_datetime(data.get("created_at")),
        report=data.get("report"),
        attention_check=data.get("attention_check"),
    )


def _message_from_doc(doc_id: str, session_id: str, data: dict) -> MessageRecord:
    feedback_json = data.get("feedback_json")
    if not feedback_json and data.get("feedback") is not None:
        feedback_json = json.dumps(data["feedback"])
    return MessageRecord(
        id=doc_id,
        session_id=session_id,
        role=data["role"],
        content=data["content"],
        feedback_json=feedback_json,
        created_at=_as_datetime(data.get("created_at")),
    )


# ── Users ─────────────────────────────────────────────────────────────────────

def get_user_by_id(db: firestore.Client, user_id: str) -> User | None:
    snap = db.collection("users").document(user_id).get()
    if not snap.exists:
        return None
    return _user_from_doc(snap.id, snap.to_dict() or {})


def get_user_by_username(db: firestore.Client, username: str) -> User | None:
    uname = db.collection("usernames").document(username).get()
    if not uname.exists:
        return None
    user_id = (uname.to_dict() or {}).get("user_id")
    if not user_id:
        return None
    return get_user_by_id(db, user_id)


def create_user(db: firestore.Client, name: str, username: str, hashed_password: str) -> User:
    """Create user + username uniqueness doc in a transaction. Raises ValueError if taken."""
    user_ref = db.collection("users").document()
    username_ref = db.collection("usernames").document(username)
    created_at = _utcnow()
    payload = {
        "name": name,
        "username": username,
        "hashed_password": hashed_password,
        "created_at": created_at,
    }

    @firestore.transactional
    def _create(transaction: firestore.Transaction) -> None:
        existing = username_ref.get(transaction=transaction)
        if existing.exists:
            raise ValueError("Username already taken")
        transaction.set(user_ref, payload)
        transaction.set(username_ref, {"user_id": user_ref.id})

    _create(db.transaction())
    return User(
        id=user_ref.id,
        name=name,
        username=username,
        hashed_password=hashed_password,
        created_at=created_at,
    )


def update_user_password(db: firestore.Client, user_id: str, hashed_password: str) -> None:
    db.collection("users").document(user_id).update({"hashed_password": hashed_password})


def save_user_completion(
    db: firestore.Client,
    user_id: str,
    condition: str,
    completion: dict,
) -> None:
    """Merge a path-completion record under users/{id}.completions.{condition}."""
    ref = db.collection("users").document(user_id)
    snap = ref.get()
    if not snap.exists:
        return
    existing = (snap.to_dict() or {}).get("completions") or {}
    existing[condition] = completion
    ref.update({"completions": existing})


# ── Sessions ──────────────────────────────────────────────────────────────────

def create_session(
    db: firestore.Client,
    *,
    user_id: str,
    username: str,
    display_name: str,
    scenario: str,
    persona: str,
    training: bool,
    condition: str | None,
) -> SessionRecord:
    ref = db.collection("sessions").document()
    created_at = _utcnow()
    data = {
        "user_id": user_id,
        "username": username,
        "display_name": display_name,
        "scenario": scenario,
        "persona": persona,
        "training": training,
        "condition": condition,
        "created_at": created_at,
        "report": None,
    }
    ref.set(data)
    return _session_from_doc(ref.id, data)


def get_session(db: firestore.Client, session_id: str) -> SessionRecord | None:
    snap = db.collection("sessions").document(session_id).get()
    if not snap.exists:
        return None
    return _session_from_doc(snap.id, snap.to_dict() or {})


def list_sessions_for_user(db: firestore.Client, user_id: str) -> list[SessionRecord]:
    docs = (
        db.collection("sessions")
        .where("user_id", "==", user_id)
        .stream()
    )
    sessions = [_session_from_doc(d.id, d.to_dict() or {}) for d in docs]
    sessions.sort(key=lambda s: s.created_at, reverse=True)
    return sessions


def list_all_sessions(db: firestore.Client) -> list[SessionRecord]:
    docs = db.collection("sessions").stream()
    sessions = [_session_from_doc(d.id, d.to_dict() or {}) for d in docs]
    sessions.sort(key=lambda s: s.created_at, reverse=True)
    return sessions


def save_session_report(db: firestore.Client, session_id: str | None, report: dict) -> None:
    if not session_id:
        return
    ref = db.collection("sessions").document(session_id)
    if not ref.get().exists:
        return
    ref.update({"report": report})


def save_attention_check(
    db: firestore.Client,
    session_id: str,
    attention_check: dict,
) -> None:
    ref = db.collection("sessions").document(session_id)
    if not ref.get().exists:
        return
    ref.update({"attention_check": attention_check})


# ── Messages ──────────────────────────────────────────────────────────────────

def _messages_col(db: firestore.Client, session_id: str):
    return db.collection("sessions").document(session_id).collection("messages")


def add_message(
    db: firestore.Client,
    *,
    session_id: str,
    role: str,
    content: str,
    feedback_json: str | None = None,
    feedback: dict | None = None,
) -> MessageRecord:
    ref = _messages_col(db, session_id).document()
    created_at = _utcnow()
    if feedback is not None and feedback_json is None:
        feedback_json = json.dumps(feedback)
    if feedback is None and feedback_json:
        try:
            feedback = json.loads(feedback_json)
        except json.JSONDecodeError:
            feedback = None
    data = {
        "role": role,
        "content": content,
        "feedback_json": feedback_json,
        "feedback": feedback,
        "created_at": created_at,
    }
    ref.set(data)
    print(f"[firestore] saved message {ref.id} role={role} session={session_id}")
    return _message_from_doc(ref.id, session_id, data)


def update_message_feedback(
    db: firestore.Client,
    *,
    session_id: str,
    message_id: str,
    feedback: dict,
) -> bool:
    ref = _messages_col(db, session_id).document(message_id)
    snap = ref.get()
    if not snap.exists:
        return False
    ref.update({
        "feedback": feedback,
        "feedback_json": json.dumps(feedback),
    })
    print(f"[firestore] updated feedback on message {message_id} session={session_id}")
    return True


def get_latest_user_message(db: firestore.Client, session_id: str) -> MessageRecord | None:
    messages = list_messages(db, session_id)
    for msg in reversed(messages):
        if msg.role == "user":
            return msg
    return None


def list_messages(db: firestore.Client, session_id: str) -> list[MessageRecord]:
    docs = _messages_col(db, session_id).order_by("created_at").stream()
    return [_message_from_doc(d.id, session_id, d.to_dict() or {}) for d in docs]


def ping(db: firestore.Client) -> None:
    """Lightweight connectivity check for /health."""
    next(db.collection("users").limit(1).stream(), None)
