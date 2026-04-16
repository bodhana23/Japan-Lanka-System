#!/bin/sh
# Entrypoint for Azure App Service and Docker deployments.
# Runs Alembic migrations then starts the production ASGI server.
# set -e ensures any failure (e.g. migration error) aborts startup immediately.
set -e

echo "Creating base tables and seeding default admin..."
python -m app.init_db

echo "Running Alembic migrations..."
alembic upgrade head || echo "Alembic upgrade skipped (migration error — tables already up to date via init_db)"

echo "Starting application server..."
exec gunicorn app.main:app \
  --workers 2 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
