#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-skillforge}"
DB_ADMIN_USER="${DB_ADMIN_USER:-postgres}"
DB_ADMIN_PASSWORD="${DB_ADMIN_PASSWORD:-postgres}"

export PGPASSWORD="${DB_ADMIN_PASSWORD}"

DB_EXISTS=$(psql \
  --host "${DB_HOST}" \
  --port "${DB_PORT}" \
  --username "${DB_ADMIN_USER}" \
  --dbname "postgres" \
  --tuples-only \
  --no-align \
  --command "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}';")

if [[ "${DB_EXISTS}" == "1" ]]; then
  echo "Database '${DB_NAME}' already exists."
else
  echo "Creating database '${DB_NAME}'..."
  psql \
    --host "${DB_HOST}" \
    --port "${DB_PORT}" \
    --username "${DB_ADMIN_USER}" \
    --dbname "postgres" \
    --command "CREATE DATABASE \"${DB_NAME}\";"
  echo "Database '${DB_NAME}' created."
fi
