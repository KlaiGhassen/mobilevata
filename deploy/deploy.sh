#!/usr/bin/env bash
#
# Update an existing Autovia deployment: pull latest code,
# rebuild images and restart. Run from the repo directory or
# with APP_DIR pointing at it.
#
# Usage:  sudo bash deploy/deploy.sh
#
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/autovia}"
COMPOSE_FILE="docker-compose.prod.yml"

log()  { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

if [[ $EUID -eq 0 ]]; then
  # copy of APP_DIR for docker command executed below as root
  :
elif docker info >/dev/null 2>&1; then
  # non-root user that already has docker access — fine
  :
else
  die "Run with sudo (or add your user to the docker group)."
fi

cd "$APP_DIR" || die "App directory not found: ${APP_DIR} (set APP_DIR=/path/to/repo)"
[[ -f .env ]] || die ".env missing — did you run setup-server.sh?"

log "Pulling latest code..."
git pull --ff-only origin "$(git rev-parse --abbrev-ref HEAD)"

log "Building images..."
docker compose -f "$COMPOSE_FILE" build --pull

log "Recreating containers..."
docker compose -f "$COMPOSE_FILE" up -d

log "Waiting for the API to become healthy..."
for _ in $(seq 1 60); do
  status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' autovia-api-1 2>/dev/null || echo starting)
  [[ "$status" == "healthy" ]] && break
  sleep 5
done
[[ "$status" == "healthy" ]] || die "API did not become healthy. Check: docker compose -f ${COMPOSE_FILE} logs api"

log "Pruning old images..."
docker image prune -f >/dev/null 2>&1 || true
log "Done."