import os
from google.cloud import firestore
from dotenv import load_dotenv

load_dotenv()

# Project ID: set GOOGLE_CLOUD_PROJECT (or GCLOUD_PROJECT / FIRESTORE_PROJECT).
# Database ID: set FIRESTORE_DATABASE if not using "(default)" — e.g. tp-feedback-study.
# Local auth: `gcloud auth application-default login`
# Or set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path.
# Emulator: FIRESTORE_EMULATOR_HOST=localhost:8080
_PROJECT = (
    os.getenv("GOOGLE_CLOUD_PROJECT")
    or os.getenv("GCLOUD_PROJECT")
    or os.getenv("FIRESTORE_PROJECT")
)
_DATABASE = os.getenv("FIRESTORE_DATABASE", "(default)")

_emulator = os.getenv("FIRESTORE_EMULATOR_HOST")
# Firestore emulator only supports the "(default)" database.
if _emulator and _DATABASE != "(default)":
    print(
        f"[database] Emulator active — using database=(default) "
        f"(ignoring FIRESTORE_DATABASE={_DATABASE})"
    )
    _DATABASE = "(default)"

_db_label = (
    f"emulator@{_emulator} database={_DATABASE}"
    if _emulator
    else f"project={_PROJECT or '(ADC default)'} database={_DATABASE}"
)
print(f"[database] Using Firestore ({_db_label})")

_client: firestore.Client | None = None


def get_client() -> firestore.Client:
    global _client
    if _client is None:
        kwargs: dict = {"database": _DATABASE}
        if _PROJECT:
            kwargs["project"] = _PROJECT
        _client = firestore.Client(**kwargs)
    return _client


def get_db():
    """FastAPI dependency — yields the shared Firestore client."""
    yield get_client()
