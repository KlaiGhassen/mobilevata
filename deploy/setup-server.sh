#!/usr/bin/env bash
#
# One-time bootstrap for a FRESH Ubuntu/Debian server.
# - Installs Docker + Compose plugin + Git
# - Clones the repository
# - Generates a .env (detected public IP + random secrets)
# - Builds and starts the full stack
# - Seeds MongoDB with demo data + an admin account
#
# Usage:  sudo bash deploy/setup-server.sh
#
set -euo pipefail

# ---------------------------------------------------------------
# Configuration (edit before running if needed)
# ---------------------------------------------------------------
GIT_REPO_URL="${GIT_REPO_URL:-https://github.com/KlaiGhassen/mobilevata.git}"
GIT_BRANCH="${GIT_BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/autovia}"
COMPOSE_FILE="docker-compose.prod.yml"

# ---------------------------------------------------------------

log()  { printf '\033[1;34m[setup]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

if [[ $EUID -ne 0 ]]; then
  die "Run as root: sudo bash deploy/setup-server.sh"
fi

detect_ip() {
  local ip
  ip=$(curl -fsSL --max-time 10 ifconfig.me 2>/dev/null) && { echo "$ip"; return; }
  ip=$(ip route get 1 2>/dev/null | awk '{print $7; exit}') && [[ -n "$ip" ]] && { echo "$ip"; return; }
  echo ""
}

ensure_secret() {
  local key="$1" v
  if grep -qE "^${key}=(CHANGE_ME|)$" .env; then
    v=$(openssl rand -hex 32)
    sed -i -E "s|^${key}=.*|${key}=${v}|" .env
    log "generated ${key}"
  fi
}

# 1) System packages --------------------------------------------------
export DEBIAN_FRONTEND=noninteractive
log "Updating packages and installing git/curl..."
apt-get update -y
apt-get install -y ca-certificates curl git

# 2) Docker + Compose plugin -----------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version >/dev/null 2>&1; then
  log "Installing Docker Compose plugin..."
  apt-get install -y docker-compose-plugin
fi
systemctl enable --now docker >/dev/null 2>&1 || true
docker version >/dev/null 2>&1 || die "Docker is not usable — log out/in and rerun, or check the error above."

# 3) Get the code -----------------------------------------------------
if [[ ! -d "$APP_DIR/.git" ]]; then
  log "Cloning ${GIT_REPO_URL} (branch ${GIT_BRANCH}) -> ${APP_DIR}"
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --branch "$GIT_BRANCH" "$GIT_REPO_URL" "$APP_DIR"
else
  log "Repo already present — pulling latest..."
  git -C "$APP_DIR" pull --ff-only origin "$GIT_BRANCH"
fi
cd "$APP_DIR"

# 4) Environment ------------------------------------------------------
if [[ ! -f .env ]]; then
  log "Creating .env from deploy/.env.example"
  cp deploy/.env.example .env
fi

if grep -qE '^SERVER_IP=(YOUR_SERVER_PUBLIC_IP|)$' .env; then
  local_ip=$(detect_ip)
  [[ -n "$local_ip" ]] || die "Could not detect the public IP. Set SERVER_IP manually in .env and re-run."
  sed -i -E "s|^SERVER_IP=.*|SERVER_IP=${local_ip}|" .env
  log "SERVER_IP set to ${local_ip}"
fi
ensure_secret JWT_SECRET
ensure_secret REINDEX_SECRET
ensure_secret REDIS_PASSWORD
ensure_secret MINIO_ROOT_PASSWORD

# 5) Build + start ----------------------------------------------------
log "Building images (first build takes a few minutes)..."
docker compose -f "$COMPOSE_FILE" up -d --build

log "Waiting for the API to become healthy..."
for _ in $(seq 1 60); do
  status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' autovia-api-1 2>/dev/null || echo starting)
  [[ "$status" == "healthy" ]] && break
  sleep 5
done
[[ "$status" == "healthy" ]] || die "API did not become healthy. Check: docker compose -f ${COMPOSE_FILE} logs api"

# 6) Seed + reindex ---------------------------------------------------
log "Seeding MongoDB (demo content + admin account)..."
docker compose -f "$COMPOSE_FILE" run --rm --no-deps -e NODE_ENV=development api node -r ts-node/register src/database/seed.ts

log "Indexing seeded vehicles into Elasticsearch..."
reindex_secret=$(grep -E '^REINDEX_SECRET=' .env | cut -d= -f2-)
curl -fsS -X POST -H "x-reindex-secret: ${reindex_secret}" http://127.0.0.1:4000/vehicles/reindex || echo "Reindex failed — you can re-trigger it from the Admin panel."

# 7) Done -------------------------------------------------------------
source .env
echo
log "======================================================"
log "Deployment ready."
log "  Marketplace : http://${SERVER_IP}:3000"
log "  Admin panel : http://${SERVER_IP}:3001"
log "  API         : http://${SERVER_IP}:4000"
log "  MinIO       : http://${SERVER_IP}:9001  (console, user ${MINIO_ROOT_USER})"
log "  Demo admin  : admin@autovia.local / AdminPass123!"
log "  Demo buyer  : buyer@mobile.de / password123"
log "  Reinforce firewall: allow only ports 80/443/3000/3001/4000/9000/9001."
log "  To update later: sudo bash deploy/deploy.sh"
log "======================================================"