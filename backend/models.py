"""Firestore document helpers for users, sessions, messages, and reports.

Collections:
  users/{userId}
  usernames/{username}          → { user_id }  (uniqueness index)
  sessions/{sessionId}
  sessions/{sessionId}/messages/{messageId}
  experiment_balance/{condition} → { counts: { travel, retail } }
  experiment_balance/{condition}/assignments/{userId} → { domain }
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from google.api_core import exceptions as gcp_exceptions
from google.cloud import firestore


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _as_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    return _utcnow()


# End the path once this many attention checks are wrong (2 welcome + 2 post-scenario).
ATTENTION_FAIL_LIMIT = 2


@dataclass
class User:
    id: str
    name: str
    username: str
    hashed_password: str
    created_at: datetime
    completions: dict | None = None
    attention_checks: dict | None = None


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
    ended_reason: str | None = None
    ended_at: datetime | None = None


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
        attention_checks=data.get("attention_checks") or {},
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
        ended_reason=data.get("ended_reason"),
        ended_at=_as_datetime(data["ended_at"]) if data.get("ended_at") else None,
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


def get_or_create_user(db: firestore.Client, name: str, username: str, hashed_password: str) -> User:
    """Idempotent user lookup/create. Safe when two join requests race for the same pid."""
    existing = get_user_by_username(db, username)
    if existing:
        return existing

    last_error: Exception | None = None
    for attempt in range(5):
        try:
            return create_user(db, name=name, username=username, hashed_password=hashed_password)
        except ValueError:
            existing = get_user_by_username(db, username)
            if existing:
                return existing
            last_error = ValueError("Username already taken")
        except gcp_exceptions.GoogleAPICallError as exc:
            existing = get_user_by_username(db, username)
            if existing:
                return existing
            last_error = exc
            time.sleep(0.05 * (2 ** attempt))

    if last_error:
        raise last_error
    raise RuntimeError("Failed to create user")


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


def _tally_from_items(items: list[dict]) -> dict:
    wrong_count = sum(1 for item in items if not item.get("correct"))
    return {
        "items": items,
        "wrong_count": wrong_count,
        "total_answered": len(items),
        "path_ended": wrong_count >= ATTENTION_FAIL_LIMIT,
    }


def get_attention_tally(db: firestore.Client, user_id: str, condition: str) -> dict:
    snap = db.collection("users").document(user_id).get()
    if not snap.exists:
        return _tally_from_items([])
    buckets = (snap.to_dict() or {}).get("attention_checks") or {}
    bucket = buckets.get(condition) or {}
    return _tally_from_items(list(bucket.get("items") or []))


def record_attention_items(
    db: firestore.Client,
    user_id: str,
    condition: str,
    items: list[dict],
) -> dict:
    """Append new attention-check items for this condition. First answer for an id wins.

    Ends the path (attention_failed completion) once wrong_count hits ATTENTION_FAIL_LIMIT.
    """
    ref = db.collection("users").document(user_id)

    @firestore.transactional
    def _record(transaction: firestore.Transaction) -> tuple[dict, dict]:
        snap = ref.get(transaction=transaction)
        if not snap.exists:
            raise ValueError("User not found")
        data = snap.to_dict() or {}
        buckets = dict(data.get("attention_checks") or {})
        existing_items = list((buckets.get(condition) or {}).get("items") or [])
        seen = {item.get("id") for item in existing_items}
        for item in items:
            item_id = item.get("id")
            if not item_id or item_id in seen:
                continue
            existing_items.append(item)
            seen.add(item_id)
        tally = _tally_from_items(existing_items)
        buckets[condition] = tally
        update = {"attention_checks": buckets}
        completions = dict(data.get("completions") or {})
        if tally["path_ended"]:
            existing = completions.get(condition) or {}
            if not existing.get("code") and existing.get("status") != "attention_failed":
                completion = {
                    "status": "attention_failed",
                    "reason": "attention_check_failed",
                    "condition": condition if condition != "default" else None,
                    "wrong_count": tally["wrong_count"],
                    "total_answered": tally["total_answered"],
                    "ended_at": _utcnow().isoformat(),
                    "code": None,
                }
                completions[condition] = completion
                update["completions"] = completions
        transaction.update(ref, update)
        return tally, completions

    tally, _completions = _record(db.transaction())
    return tally


# ── Experiment domain balance ─────────────────────────────────────────────────

ASSIGNMENT_DOMAINS = ("travel", "retail")


def assign_domain(db: firestore.Client, *, user_id: str, condition: str) -> dict:
    """Assign the least-used domain for this condition in a transaction.

    The same participant always keeps their original domain so refreshes
    do not inflate counts. Returns { domain, counts, already_assigned }.
    """
    condition = condition or "default"
    counter_ref = db.collection("experiment_balance").document(condition)
    assignment_ref = counter_ref.collection("assignments").document(user_id)

    @firestore.transactional
    def _assign(transaction: firestore.Transaction) -> dict:
        existing = assignment_ref.get(transaction=transaction)
        counter_snap = counter_ref.get(transaction=transaction)
        stored = (counter_snap.to_dict() or {}).get("counts") or {} if counter_snap.exists else {}
        counts = {d: int(stored.get(d) or 0) for d in ASSIGNMENT_DOMAINS}

        if existing.exists:
            domain = (existing.to_dict() or {}).get("domain")
            if domain in ASSIGNMENT_DOMAINS:
                return {"domain": domain, "counts": counts, "already_assigned": True}

        chosen = min(ASSIGNMENT_DOMAINS, key=lambda d: (counts[d], ASSIGNMENT_DOMAINS.index(d)))
        counts[chosen] += 1
        now = _utcnow()
        transaction.set(
            assignment_ref,
            {
                "user_id": user_id,
                "condition": condition,
                "domain": chosen,
                "assigned_at": now,
            },
        )
        transaction.set(counter_ref, {"counts": counts, "updated_at": now}, merge=True)
        return {"domain": chosen, "counts": counts, "already_assigned": False}

    return _assign(db.transaction())


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
    *,
    ended_reason: str | None = None,
) -> None:
    ref = db.collection("sessions").document(session_id)
    if not ref.get().exists:
        return
    update = {"attention_check": attention_check}
    if ended_reason:
        update["ended_reason"] = ended_reason
        update["ended_at"] = _utcnow()
    ref.update(update)


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
    print(f"[firestore] data: {data}")
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
