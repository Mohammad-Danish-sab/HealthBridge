# HealthBridge API

The API uses async SQLAlchemy with Alembic-managed database schemas. For local
development, it defaults to `server/healthbridge.db` (SQLite); production and
shared environments should use PostgreSQL.

## Database configuration

Set `DATABASE_URL` in `server/.env` to a SQLAlchemy URL when using a non-default
database, for example:

```text
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/healthbridge
```

The synchronous `postgresql://` and `sqlite://` URL schemes are also normalized
to their async drivers. Alternatively, set `POSTGRES_SERVER` and the
`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `POSTGRES_PORT`
variables to build the PostgreSQL URL from its parts. Keep secrets in `.env`;
do not commit that file.

## Apply database migrations

From the `server` directory with the project environment activated:

```powershell
python -m pip install -r requirements.txt
alembic upgrade head
```

To create a migration after changing SQLAlchemy models:

```powershell
alembic revision --autogenerate -m "describe the schema change"
```

Review generated migrations before applying them. To revert one revision, run
`alembic downgrade -1`. The compatibility helper `python -m app.db.init_db`
also applies migrations up to the latest revision.

The API does not create or alter tables at startup. Apply migrations before
starting the service. For a database that already has the complete schema
created by an older HealthBridge version, back it up and verify the schema
before marking it as migrated with `alembic stamp head`; do not run the initial
migration against existing tables.
