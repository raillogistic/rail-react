# Frontend deployment script guide

This guide explains how to use `rail-react/deploy/deploy.sh` for Docker-based
frontend deployment, including attached mode with `--no-detach`.

## Default deployment (detached)

Use this mode for normal server deployments where the container runs in the
background.

```bash
./deploy/deploy.sh
```

The script builds the image, starts the container with `--restart
unless-stopped`, and waits for container health unless you disable it.

## Attached deployment (no detached mode)

Use this mode when you want foreground logs and direct process control from the
terminal.

```bash
./deploy/deploy.sh --no-detach
```

In this mode, the script runs `docker run` without `-d`. Press `Ctrl+C` to
stop the container process.

## Common options

Use these options to adapt deployment behavior.

- `--no-detach`: run in attached mode (foreground).
- `--build-only`: build the image and exit without running a container.
- `--skip-healthcheck`: skip waiting for healthy status after startup.
- `--no-cache`: build without Docker cache.
- `--no-pull`: skip pulling base images.
- `--tls-domain <domain>`: set certificate domain used by container startup.
- `--http-port <port>` and `--https-port <port>`: host ports mapped to
  container ports.

## Example command

Use this command when you need foreground logs and custom ports.

```bash
./deploy/deploy.sh \
  --no-detach \
  --http-port 8080 \
  --https-port 8443 \
  --tls-domain rail-logistic.dz
```
