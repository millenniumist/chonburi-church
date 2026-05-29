# GitOps (Pi + Docker Compose)

This folder contains a lightweight, push-driven GitOps setup for a Raspberry Pi using Docker Compose.

## Overview

- GitHub webhook triggers a deploy on the Pi.
- Deploys into versioned release folders under `/srv/cc-financial/releases`.
- Supports multiple stacks via `stacks.conf` and per-stack rollback tags.

## Files

- `bootstrap.sh`: One-time provisioning for a new Pi.
- `deploy.sh`: Pulls the repo, builds images, runs Compose stacks, and performs health checks.
- `webhook.py`: Receives GitHub webhook events and triggers deploys.
- `cc-financial-webhook.service`: Systemd service for the webhook listener.
- `cc-financial-health-monitor.service`: Optional systemd service for the Node health monitor.
- `cc-financial-cloudflared.service`: Optional systemd service for Cloudflare Tunnel.
- `cc-financial-gitops-poll.service` / `cc-financial-gitops-poll.timer`: Polling fallback if webhook is unavailable.
- `watch-deploy.sh`: Live deploy + build log watcher for the Pi.
- `gitops.env.example`: Shared env for deploy + webhook.
- `stacks.conf.example`: Stack definitions for multi-service deploys.
- `cloudflared.env.example`: Cloudflared service env (tunnel name).

## Install on the Pi (recommended)

Run the bootstrap from a clone of the repo on the Pi:

```bash
cd chonburi-church
./deployment/gitops/bootstrap.sh
```

The script installs packages, creates `/srv/cc-financial`, installs services, and generates a webhook secret.
It also enables a polling timer (every 2 minutes) as a fallback if the webhook is unavailable.

## Manual install (if you prefer)

1) Create folders:

```bash
sudo mkdir -p /srv/cc-financial/{bin,releases,shared,logs,rollbacks,cloudflare}
sudo chown -R mill:mill /srv/cc-financial
```

2) Copy `deploy.sh` and `webhook.py` into `/srv/cc-financial/bin` and make them executable.

3) Create `/srv/cc-financial/shared/gitops.env` from `gitops.env.example` and set `WEBHOOK_SECRET`.

4) Copy your app env file to `/srv/cc-financial/shared/.env`.

5) Create `/srv/cc-financial/shared/stacks.conf` from `stacks.conf.example`.

6) Install the systemd service (replace `__RUN_USER__` with your user if installing manually):

```bash
sudo cp cc-financial-webhook.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cc-financial-webhook
```

## GitHub Webhook

- URL (prod): `https://hooks.chonburichurch.com/webhook`
- URL (dev): `https://hooks.millenniumist.dpdns.org/webhook`
- Content type: `application/json`
- Secret: value from `WEBHOOK_SECRET`
- Events: `push`

## Stacks configuration

`stacks.conf` format:

```
name|compose_path|health_url|build_image|build_context|rollback_images|pre_deploy_cmd|post_deploy_cmd
```

Example:

```
app|deployment/docker-compose.selfhost.yml|http://localhost:8358/api/health|nextjs-app|.|nextjs-app|docker rm -f nextjs-app|
```

Notes:
- `build_image` + `build_context` are optional. If set, the image is built before deploy.
- `rollback_images` is a comma-separated list of images that should be tagged for rollback.
- `pre_deploy_cmd` runs before Compose is applied (useful for cleaning old containers).
- `post_deploy_cmd` runs after the stack is healthy.
- `SYNC_PATHS` in `gitops.env` lets you copy shared files into each release (for example `content/site-data.json`).

## Rollback

If a deploy fails, the script restores rollback tags for that stack and restarts Compose using the previous release.
`ROLLBACK_MODE=all` will roll back all stacks; set `ROLLBACK_MODE=failed` to roll back only the failed stack.
