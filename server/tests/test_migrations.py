import os
import sqlite3
import subprocess
import sys
from pathlib import Path

from sqlalchemy.engine import URL


SERVER_ROOT = Path(__file__).resolve().parents[1]


def _run_alembic(database_url: str, *arguments: str) -> None:
    environment = os.environ.copy()
    environment["DATABASE_URL"] = database_url
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "-c", "alembic.ini", *arguments],
        cwd=SERVER_ROOT,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_direct_chat_migration_supports_sqlite_upgrade_and_downgrade(tmp_path):
    database_path = tmp_path / "migration-test.db"
    database_url = URL.create(
        "sqlite+aiosqlite",
        database=str(database_path),
    ).render_as_string(hide_password=False)

    _run_alembic(database_url, "upgrade", "head")

    with sqlite3.connect(database_path) as connection:
        message_columns = {
            column[1]: column for column in connection.execute("PRAGMA table_info(messages)")
        }
        assert message_columns["recipient_id"][3] == 0
        assert message_columns["appointment_id"][3] == 0
        assert message_columns["conversation_id"][3] == 0

        doctor_columns = {
            column[1]: column
            for column in connection.execute(
                "PRAGMA table_info(doctor_profiles)"
            )
        }
        assert "qualifications" in doctor_columns

        foreign_keys = {
            row[2]: row[3]
            for row in connection.execute("PRAGMA foreign_key_list(messages)")
        }
        assert foreign_keys["users"] == "recipient_id"
        assert foreign_keys["appointments"] == "appointment_id"

    _run_alembic(database_url, "downgrade", "-1")
    _run_alembic(database_url, "upgrade", "head")
