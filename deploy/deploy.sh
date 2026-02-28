#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOCKERFILE_PATH="${SCRIPT_DIR}/Dockerfile"

DIST_DIR="${DIST_DIR:-dist}"
IMAGE_NAME="${IMAGE_NAME:-rail-react}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CONTAINER_NAME="${CONTAINER_NAME:-rail-react-web}"
BIND_ADDRESS="${BIND_ADDRESS:-0.0.0.0}"
HTTP_PORT="${HTTP_PORT:-80}"
HTTPS_PORT="${HTTPS_PORT:-443}"
INTERNAL_HTTP_PORT=8080
INTERNAL_HTTPS_PORT=8443
TLS_DOMAIN="${TLS_DOMAIN:-localhost}"
TLS_CERT_DAYS="${TLS_CERT_DAYS:-365}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-90}"
BUILD_RETRIES="${BUILD_RETRIES:-3}"

NO_CACHE=false
PULL_BASE=true
BUILD_ONLY=false
SKIP_HEALTHCHECK=false

log() {
  printf '[deploy] %s\n' "$1"
}

fail() {
  printf '[deploy] ERROR: %s\n' "$1" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage:
  ./deploy/deploy.sh [options]

Options:
  --dist <path>               Build folder to serve (default: dist)
  --image-name <name>         Docker image name (default: rail-react)
  --tag <tag>                 Docker image tag (default: latest)
  --container-name <name>     Docker container name (default: rail-react-web)
  --bind-address <addr>       Host bind address (default: 0.0.0.0)
  --http-port <port>          Host HTTP port mapped to container 8080 (default: 80)
  --https-port <port>         Host HTTPS port mapped to container 8443 (default: 443)
  --port <port>               Alias for --https-port
  --tls-domain <domain>       Domain used in self-signed cert (default: localhost)
  --tls-cert-days <days>      Self-signed cert validity days (default: 365)
  --wait-timeout <seconds>    Health check timeout seconds (default: 90)
  --build-retries <count>     Docker build retries on failure (default: 3)
  --no-cache                  Build image without Docker cache
  --no-pull                   Do not pull base images
  --build-only                Build image only (do not run container)
  --skip-healthcheck          Skip post-deploy health check wait
  -h, --help                  Show this help
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

is_valid_port() {
  local port="$1"
  [[ "$port" =~ ^[0-9]+$ ]] && ((port >= 1 && port <= 65535))
}

run_with_retries() {
  local attempts="$1"
  shift

  local try=1
  while true; do
    if "$@"; then
      return 0
    fi
    if ((try >= attempts)); then
      return 1
    fi
    local sleep_seconds=$((try * 5))
    log "Command failed (attempt ${try}/${attempts}). Retrying in ${sleep_seconds}s..."
    sleep "$sleep_seconds"
    try=$((try + 1))
  done
}

while (($# > 0)); do
  case "$1" in
    --dist)
      DIST_DIR="${2:-}"
      shift 2
      ;;
    --image-name)
      IMAGE_NAME="${2:-}"
      shift 2
      ;;
    --tag)
      IMAGE_TAG="${2:-}"
      shift 2
      ;;
    --container-name)
      CONTAINER_NAME="${2:-}"
      shift 2
      ;;
    --bind-address)
      BIND_ADDRESS="${2:-}"
      shift 2
      ;;
    --http-port)
      HTTP_PORT="${2:-}"
      shift 2
      ;;
    --https-port)
      HTTPS_PORT="${2:-}"
      shift 2
      ;;
    --port)
      HTTPS_PORT="${2:-}"
      shift 2
      ;;
    --tls-domain)
      TLS_DOMAIN="${2:-}"
      shift 2
      ;;
    --tls-cert-days)
      TLS_CERT_DAYS="${2:-}"
      shift 2
      ;;
    --wait-timeout)
      WAIT_TIMEOUT="${2:-}"
      shift 2
      ;;
    --build-retries)
      BUILD_RETRIES="${2:-}"
      shift 2
      ;;
    --no-cache)
      NO_CACHE=true
      shift
      ;;
    --no-pull)
      PULL_BASE=false
      shift
      ;;
    --build-only)
      BUILD_ONLY=true
      shift
      ;;
    --skip-healthcheck)
      SKIP_HEALTHCHECK=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

[[ -n "$DIST_DIR" ]] || fail "--dist cannot be empty"
[[ -n "$IMAGE_NAME" ]] || fail "--image-name cannot be empty"
[[ -n "$IMAGE_TAG" ]] || fail "--tag cannot be empty"
[[ -n "$CONTAINER_NAME" ]] || fail "--container-name cannot be empty"
[[ "$TLS_CERT_DAYS" =~ ^[0-9]+$ ]] || fail "--tls-cert-days must be a positive integer"
[[ "$WAIT_TIMEOUT" =~ ^[0-9]+$ ]] || fail "--wait-timeout must be a non-negative integer"
[[ "$BUILD_RETRIES" =~ ^[0-9]+$ ]] || fail "--build-retries must be a positive integer"
((TLS_CERT_DAYS >= 1)) || fail "--tls-cert-days must be >= 1"
((BUILD_RETRIES >= 1)) || fail "--build-retries must be >= 1"
is_valid_port "$HTTP_PORT" || fail "Invalid HTTP port: $HTTP_PORT"
is_valid_port "$HTTPS_PORT" || fail "Invalid HTTPS port: $HTTPS_PORT"

require_cmd docker

DIST_ABS="$DIST_DIR"
if [[ "$DIST_ABS" != /* ]]; then
  DIST_ABS="${PROJECT_ROOT}/${DIST_ABS}"
fi
[[ -d "$DIST_ABS" ]] || fail "Dist folder not found: $DIST_ABS"
[[ -f "${DIST_ABS}/index.html" ]] || fail "Missing ${DIST_ABS}/index.html"

case "$DIST_ABS" in
  "${PROJECT_ROOT}"/*) ;;
  *)
    fail "--dist must be inside project root: ${PROJECT_ROOT}"
    ;;
esac

DIST_REL="${DIST_ABS#${PROJECT_ROOT}/}"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

build_args=(build -f "$DOCKERFILE_PATH" -t "$FULL_IMAGE" --build-arg "DIST_DIR=${DIST_REL}" --load)
$PULL_BASE && build_args+=(--pull)
$NO_CACHE && build_args+=(--no-cache)
build_args+=("$PROJECT_ROOT")

log "Building image ${FULL_IMAGE} from dist folder ${DIST_REL}"
run_with_retries "$BUILD_RETRIES" docker "${build_args[@]}" || fail "Docker build failed after ${BUILD_RETRIES} attempt(s)."
docker image inspect "$FULL_IMAGE" >/dev/null 2>&1 || fail "Built image missing locally: ${FULL_IMAGE}"

if $BUILD_ONLY; then
  log "Build completed (build-only mode)."
  exit 0
fi

existing_container_id="$(docker ps -aq --filter "name=^/${CONTAINER_NAME}$")"
if [[ -n "$existing_container_id" ]]; then
  log "Removing existing container ${CONTAINER_NAME}"
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

HTTP_BINDING="${HTTP_PORT}:${INTERNAL_HTTP_PORT}"
HTTPS_BINDING="${HTTPS_PORT}:${INTERNAL_HTTPS_PORT}"
if [[ -n "$BIND_ADDRESS" && "$BIND_ADDRESS" != "0.0.0.0" ]]; then
  HTTP_BINDING="${BIND_ADDRESS}:${HTTP_BINDING}"
  HTTPS_BINDING="${BIND_ADDRESS}:${HTTPS_BINDING}"
fi

log "Starting container ${CONTAINER_NAME}"
container_id="$(
  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -e "TLS_DOMAIN=${TLS_DOMAIN}" \
    -e "TLS_CERT_DAYS=${TLS_CERT_DAYS}" \
    -p "$HTTP_BINDING" \
    -p "$HTTPS_BINDING" \
    "$FULL_IMAGE"
)"
[[ -n "$container_id" ]] || fail "Container failed to start"

if $SKIP_HEALTHCHECK; then
  log "Deployment successful (healthcheck skipped)."
  exit 0
fi

if ((WAIT_TIMEOUT == 0)); then
  log "Deployment successful (wait-timeout is 0)."
  exit 0
fi

log "Waiting for healthy status (timeout: ${WAIT_TIMEOUT}s)"
deadline=$((SECONDS + WAIT_TIMEOUT))
while ((SECONDS < deadline)); do
  health_state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER_NAME" 2>/dev/null || true)"
  case "$health_state" in
    healthy)
      log "Deployment successful: container is healthy."
      exit 0
      ;;
    unhealthy)
      docker logs --tail 120 "$CONTAINER_NAME" >&2 || true
      fail "Container is unhealthy."
      ;;
    starting|none|"")
      sleep 2
      ;;
    *)
      sleep 2
      ;;
  esac
done

docker logs --tail 120 "$CONTAINER_NAME" >&2 || true
fail "Timed out waiting for container health."
