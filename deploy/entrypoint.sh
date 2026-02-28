#!/usr/bin/env sh
set -eu

CERT_DIR="/etc/nginx/certs"
CERT_FILE="${CERT_DIR}/tls.crt"
KEY_FILE="${CERT_DIR}/tls.key"
TLS_DOMAIN="${TLS_DOMAIN:-localhost}"
TLS_CERT_DAYS="${TLS_CERT_DAYS:-365}"

if [ ! -s "$CERT_FILE" ] || [ ! -s "$KEY_FILE" ]; then
  echo "[deploy] Generating self-signed TLS certificate for ${TLS_DOMAIN}"
  openssl req \
    -x509 \
    -newkey rsa:2048 \
    -sha256 \
    -nodes \
    -days "$TLS_CERT_DAYS" \
    -subj "/CN=${TLS_DOMAIN}" \
    -addext "subjectAltName=DNS:${TLS_DOMAIN},DNS:localhost,IP:127.0.0.1" \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE"
  chmod 600 "$KEY_FILE"
  chmod 644 "$CERT_FILE"
fi

exec "$@"
