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

## Production settings

Set `ENVIRONMENT=production` before starting a production deployment. Startup
then rejects the development JWT key, non-PostgreSQL databases, and wildcard,
local, or non-HTTPS CORS origins. Generate a unique signing key rather than
reusing the example value:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Configure `SECRET_KEY`, `DATABASE_URL`, and `BACKEND_CORS_ORIGINS` in the
deployment environment. `BACKEND_CORS_ORIGINS` is a JSON array, for example
`["https://app.example.com"]`. Interactive API documentation and the OpenAPI
schema are disabled in production.

## Container deployment

Build the API image from the `server` directory:

```powershell
docker build -t healthbridge-api .
```

For a local containerized stack, copy the repository-root `.env.example` to
`.env`, replace placeholder secrets, and run:

```powershell
docker compose up --build
```

This starts PostgreSQL, applies Alembic migrations, and runs the API on port
8000. The PostgreSQL data volume is persistent. Stop the stack with
`docker compose down`; add `--volumes` only when explicitly resetting all local
database data.

Provide a strong `SECRET_KEY`, a PostgreSQL `DATABASE_URL`, and HTTPS
`BACKEND_CORS_ORIGINS` through the deployment platform's secret/environment
configuration. Apply database migrations before starting the API:

```powershell
docker run --rm --entrypoint alembic `
  -e ENVIRONMENT=production `
  -e SECRET_KEY=$env:SECRET_KEY `
  -e DATABASE_URL=$env:DATABASE_URL `
  -e BACKEND_CORS_ORIGINS=$env:BACKEND_CORS_ORIGINS `
  healthbridge-api upgrade head
```

Then run the service with the same environment variables and publish port 8000
behind a TLS-terminating reverse proxy or load balancer. The image runs as a
non-root user and its health check uses `/health/ready`, which requires the
database to be reachable. Do not bake `.env` files or production secrets into
the image.

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

## Continuous integration

The GitHub Actions workflow runs the backend test suite and checks the frontend
with Oxlint and a production Vite build on pushes and pull requests. Run the
backend check from `server`:

```powershell
python -m pytest -q
```

Run the frontend checks from `client/api`:

```powershell
npm ci
npm run lint
npm run build
```

The API does not create or alter tables at startup. Apply migrations before
starting the service. For a database that already has the complete schema
created by an older HealthBridge version, back it up and verify the schema
before marking it as migrated with `alembic stamp head`; do not run the initial
migration against existing tables.
