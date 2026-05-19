"""
Migration: remove legacy score columns from the reports table.

Run once after deploying the updated models.py:
    cd backend && python migrate_reports.py

SQLite  — drops and recreates the reports table (safe; no data loss on report rows
          because the column removal means old rows can't be read correctly anyway).
Postgres — issues ALTER TABLE ... DROP COLUMN IF EXISTS for each legacy column.
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./csr_simulator.db")
IS_SQLITE = DATABASE_URL.startswith("sqlite")

LEGACY_COLUMNS = [
    "empathy_score",
    "transparency_score",
    "ownership_score",
    "overall_score",
]

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if IS_SQLITE else {},
)


def columns_in_table(conn, table: str) -> list[str]:
    inspector = inspect(conn)
    return [c["name"] for c in inspector.get_columns(table)]


def migrate_sqlite(conn):
    existing = columns_in_table(conn, "reports")
    legacy_present = [c for c in LEGACY_COLUMNS if c in existing]

    if not legacy_present:
        print("SQLite: no legacy columns found — nothing to do.")
        return

    print(f"SQLite: dropping legacy columns {legacy_present} via table recreation.")

    # Recreate with clean schema — preserving all current rows minus legacy cols
    conn.execute(text("""
        CREATE TABLE reports_new (
            id          INTEGER PRIMARY KEY,
            session_id  INTEGER REFERENCES sessions(id),
            scenario    VARCHAR NOT NULL,
            persona     VARCHAR NOT NULL,
            training    BOOLEAN NOT NULL,
            report_json TEXT,
            created_at  DATETIME
        )
    """))

    # Copy rows that have the non-legacy columns populated
    conn.execute(text("""
        INSERT INTO reports_new (id, session_id, scenario, persona, training, report_json, created_at)
        SELECT id, session_id, scenario, persona, training, report_json, created_at
        FROM reports
    """))

    conn.execute(text("DROP TABLE reports"))
    conn.execute(text("ALTER TABLE reports_new RENAME TO reports"))
    print("SQLite: migration complete.")


def migrate_postgres(conn):
    existing = columns_in_table(conn, "reports")
    legacy_present = [c for c in LEGACY_COLUMNS if c in existing]

    if not legacy_present:
        print("Postgres: no legacy columns found — nothing to do.")
        return

    for col in legacy_present:
        print(f"Postgres: dropping column '{col}'...")
        conn.execute(text(f"ALTER TABLE reports DROP COLUMN IF EXISTS {col}"))

    print(f"Postgres: removed {legacy_present}. Migration complete.")


with engine.begin() as conn:
    try:
        cols = columns_in_table(conn, "reports")
    except Exception:
        print("reports table does not exist yet — create_all will build it correctly on startup.")
        sys.exit(0)

    print(f"Current reports columns: {cols}")

    if IS_SQLITE:
        migrate_sqlite(conn)
    else:
        migrate_postgres(conn)
