from pathlib import Path

from alembic import command
from alembic.config import Config


def init_db() -> None:
    config_path = Path(__file__).resolve().parents[2] / "alembic.ini"
    command.upgrade(Config(str(config_path)), "head")


if __name__ == "__main__":
    init_db()