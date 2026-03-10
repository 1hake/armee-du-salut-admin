# Docker Swarm Deployment Generator

You are generating a complete Docker Swarm deployment setup for a project. This follows a proven pattern used across multiple production projects deployed on a private server with Traefik reverse proxy and Docker Swarm orchestration.

## Architecture Overview (for context)

All projects follow this deployment flow:
```
Push to branch → GitHub Actions → Build & push image to Docker Hub → SCP compose files to server → SSH docker stack deploy → Traefik routes traffic with HTTPS
```

Infrastructure:
- **Server:** Hostinger VPS, root access via SSH key
- **Orchestration:** Docker Swarm
- **Reverse proxy:** Traefik with Let's Encrypt TLS (entrypoint: `websecure`, resolver: `myresolver`)
- **Registry:** Docker Hub (org: `thegobc`)
- **Network:** External overlay network `webnet` (shared by all stacks + Traefik)

## Step 1: Gather Project Information

Ask the user the following questions using AskUserQuestion (ask them all at once, use multiple questions):

1. **Project name** — What is the project name? (used for stack name, image name, directory on server)
2. **Services** — What services does the project have? Options:
   - Frontend only (static SPA served by nginx)
   - Backend only (API server)
   - Frontend + Backend (separate subdomains like `app.gobc.fr` + `api.app.gobc.fr`)
   - Frontend + Backend (same domain with path-based routing like `/api/*`)
   - Custom / monorepo (let user describe)
3. **Tech stack for each service** — For each service, ask:
   - Framework: Next.js / Vite (React/Vue) / Express / Fastify / NestJS / Other
   - Package manager: npm / yarn / pnpm
   - Node version: 18 / 20 / 21 / 22
4. **Domain(s)** — What domain(s) should be used? (e.g., `myapp.gobc.fr`, `api.myapp.gobc.fr`). Also ask if www redirect is needed.
5. **Port(s)** — What port(s) do the services listen on? (e.g., 3000, 3001, 5173)
6. **Runtime secrets** — Does the app need runtime secrets (API keys, DB URLs, etc.)? If yes, list them with their environment variable names (e.g., `DATABASE_URL`, `STRIPE_SECRET_KEY`). These will become Docker Swarm secrets.
7. **Build-time environment variables** — Are there frontend env vars baked at build time? (e.g., `VITE_API_URL`, `NEXT_PUBLIC_API_URL`)
8. **Database** — Does the project need a database? Options:
   - PostgreSQL (containerized in dev, managed or Docker secret URL in prod)
   - MySQL
   - MongoDB
   - SQLite (file-based, persistent volume needed)
   - Prisma
   - Supabase
   - None
9. **Message queue** — Does the project need a message queue? (e.g., RabbitMQ, Redis)
10. **WebSocket/Socket.IO** — Does the project use real-time connections?
11. **Persistent volumes** — Does the app need persistent storage in production? (e.g., uploads directory, SQLite DB file, model cache)
12. **ORM** — Does the project use Prisma? (affects entrypoint: needs `prisma generate` + `prisma migrate deploy`)
13. **GitHub branches** — Which branch(es) should trigger deployment? (default: `main`)
14. **Docker Hub image name(s)** — Under which Docker Hub org/user? (default: `thegobc`)
15. **Health checks** — Should services have health check endpoints? (recommended: yes, at `/health`)

## Step 2: Generate All Files

Based on the answers, generate the following files. Use the patterns below as templates.

---

### 2.1 — `docker-compose.yml` (Base Configuration)

This is the minimal base. It defines services, images, and basic shared environment. It is used as the foundation for both dev (with override) and prod (with swarm).

```yaml
services:
  <service_name>:
    image: <dockerhub_org>/<image_name>
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    environment:
      NODE_ENV: development
      PORT: <port>
```

Rules:

- One entry per service

---

### 2.2 — `docker-compose.override.yml` (Development Overrides)

Automatically loaded by `docker compose up` in development. NEVER deployed to production (never SCPed).

```yaml
# Local development overrides
services:
  <service_name>:
    build:
      target: development
    volumes:
      - .:/app
      - /app/node_modules  # Anonymous volume to prevent overwriting node_modules
    ports:
      - "<port>:<port>"
    environment:
      NODE_ENV: development
    # If service has a health check:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:<port>/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # === PostgreSQL (if needed) ===
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: <project_name>
    volumes:
      - db-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # === RabbitMQ (if needed) ===
  rabbitmq:
    image: rabbitmq:4.2.1-management
    restart: always
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    ports:
      - "5672:5672"    # AMQP
      - "15672:15672"  # Management UI
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_running"]
      interval: 10s
      timeout: 10s
      retries: 5

volumes:
  db-data:
```

Rules:

- Mount source code for hot reload: `.:/app`
- Use anonymous volume for node_modules: `/app/node_modules`
- Expose ports for local access
- Add `depends_on` with condition `service_healthy` when a service depends on DB/queue
- Add healthchecks to infrastructure services (DB, queue)
- If the project uses a `.env.development` file, reference it:

  ```yaml
  env_file:
    - .env.development
  ```

---

### 2.3 — `docker-compose.swarm.yml` (Production / Docker Swarm)

This is the production overlay. Deployed via `docker stack deploy`.

```yaml
# Production Swarm configuration
services:
  <service_name>:
    image: <dockerhub_org>/<image_name>:latest
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
        order: stop-first
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.<router_name>.rule=Host(`<domain>`)'
      - 'traefik.http.routers.<router_name>.entrypoints=websecure'
      - 'traefik.http.routers.<router_name>.tls.certresolver=myresolver'
      - 'traefik.http.services.<router_name>.loadbalancer.server.port=<port>'
    environment:
      NODE_ENV: production
      PORT: <port>
      HOST: 0.0.0.0
    networks:
      - webnet
    # If runtime secrets are needed:
    secrets:
      - <PROJECT_PREFIX>_<SECRET_NAME>
    # If health check endpoint exists:
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:<port>/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # === RabbitMQ in production (if needed) ===
  rabbitmq:
    image: rabbitmq:4.2.1-management-alpine
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    secrets:
      - <PROJECT_PREFIX>_RABBITMQ_USER
      - <PROJECT_PREFIX>_RABBITMQ_PASSWORD
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_running"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - app-network  # Internal only, NOT webnet

# Secrets (all external, created manually on the server)
secrets:
  <PROJECT_PREFIX>_<SECRET_NAME>:
    external: true

# Volumes
volumes:
  postgres_data:
    external: true  # Use external for critical data persistence
  rabbitmq_data:

networks:
  webnet:
    external: true
  # If services need internal communication (DB, queue):
  app-network:
    driver: overlay
```

#### Secret Naming Convention

Use a project prefix for all Docker secrets to avoid collisions between stacks:
- Format: `<PROJECT_PREFIX>_<SECRET_NAME>`
- Example: `GHOST_DATABASE_URL`, `KONAMA_API_CLIENT_SCALEWAY_ACCESS_KEY_ID`

#### Traefik Label Patterns

**Simple service (one domain, one service):**
```yaml
labels:
  - 'traefik.enable=true'
  - 'traefik.http.routers.<name>.rule=Host(`<domain>`)'
  - 'traefik.http.routers.<name>.entrypoints=websecure'
  - 'traefik.http.routers.<name>.tls.certresolver=myresolver'
  - 'traefik.http.services.<name>.loadbalancer.server.port=<port>'
```

**With www redirect:**
```yaml
labels:
  - 'traefik.enable=true'
  - 'traefik.http.routers.<name>.rule=Host(`<domain>`)'
  - 'traefik.http.routers.<name>.entrypoints=websecure'
  - 'traefik.http.routers.<name>.tls.certresolver=myresolver'
  - 'traefik.http.services.<name>.loadbalancer.server.port=<port>'
  # WWW redirect
  - 'traefik.http.routers.<name>-www.rule=Host(`www.<domain>`)'
  - 'traefik.http.routers.<name>-www.entrypoints=websecure'
  - 'traefik.http.routers.<name>-www.tls.certresolver=myresolver'
  - 'traefik.http.middlewares.<name>-redirect.redirectregex.regex=^https?://www\.<domain_escaped>/(.*)'
  - 'traefik.http.middlewares.<name>-redirect.redirectregex.replacement=https://<domain>/$${1}'
  - 'traefik.http.routers.<name>-www.middlewares=<name>-redirect'
```

**Same domain with path-based routing (frontend + backend + WebSocket):**
```yaml
# Backend - WebSocket route (highest priority)
labels:
  - 'traefik.http.routers.<name>-ws.rule=Host(`<domain>`) && PathPrefix(`/socket.io`)'
  - 'traefik.http.routers.<name>-ws.entrypoints=websecure'
  - 'traefik.http.routers.<name>-ws.tls.certresolver=myresolver'
  - 'traefik.http.routers.<name>-ws.priority=200'
# Backend - API route
  - 'traefik.http.routers.<name>-api.rule=Host(`<domain>`) && PathPrefix(`/api`)'
  - 'traefik.http.routers.<name>-api.entrypoints=websecure'
  - 'traefik.http.routers.<name>-api.tls.certresolver=myresolver'
  - 'traefik.http.routers.<name>-api.priority=100'
# Backend - Health check
  - 'traefik.http.routers.<name>-health.rule=Host(`<domain>`) && Path(`/health`)'
  - 'traefik.http.routers.<name>-health.entrypoints=websecure'
  - 'traefik.http.routers.<name>-health.tls.certresolver=myresolver'
  - 'traefik.http.routers.<name>-health.priority=150'
  - 'traefik.http.services.<name>-backend.loadbalancer.server.port=<backend_port>'

# Frontend - catch-all (lowest priority)
labels:
  - 'traefik.http.routers.<name>.rule=Host(`<domain>`)'
  - 'traefik.http.routers.<name>.entrypoints=websecure'
  - 'traefik.http.routers.<name>.tls.certresolver=myresolver'
  - 'traefik.http.routers.<name>.priority=1'
  - 'traefik.http.services.<name>.loadbalancer.server.port=<frontend_port>'
```

**Specifying the Docker network for Traefik** (when service is on multiple networks):
```yaml
  - 'traefik.docker.network=webnet'
```

---

### 2.4 — `Dockerfile` (Multi-stage)

Generate a multi-stage Dockerfile appropriate to the framework.

#### For Vite/React/Vue SPA (served by nginx):

```dockerfile
FROM node:<version>-alpine AS base
WORKDIR /app
COPY package.json <lockfile> ./
RUN <install_cmd>

# Development stage
FROM base AS development
COPY . .
EXPOSE <port>
CMD ["<package_manager>", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS builder
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
# ... other build-time args
RUN <build_cmd>

# Production stage
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE <port>
```

#### For Next.js:
```dockerfile
FROM node:<version>-alpine AS base
WORKDIR /app
COPY package.json <lockfile> ./
RUN <install_cmd>

# Development stage
FROM base AS development
ENV NODE_ENV=development
COPY . .
EXPOSE <port>
CMD ["<package_manager>", "run", "dev"]

# Build stage
FROM base AS builder
ENV NODE_ENV=production
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# ... other build-time args
RUN <build_cmd>

# Production stage
FROM node:<version>-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json <lockfile> ./
RUN <install_cmd_prod_only>
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./
EXPOSE <port>
# If runtime secrets exist:
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["<package_manager>", "run", "start"]
```

#### For Backend API (Express/Fastify/NestJS with TypeScript):

```dockerfile
FROM node:<version>-alpine AS base
WORKDIR /app
COPY package.json <lockfile> ./
RUN <install_cmd>

# Development stage
FROM base AS development
COPY . .
EXPOSE <port>
CMD ["<package_manager>", "run", "dev"]

# Build stage
FROM base AS builder
COPY . .
RUN <build_cmd>

# Production stage
FROM node:<version>-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json <lockfile> ./
RUN <install_cmd_prod_only>
COPY --from=builder /app/dist ./dist
# If Prisma:
COPY --from=builder /app/prisma ./prisma
EXPOSE <port>
# If runtime secrets exist:
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
```

Rules:
- Always use multi-stage builds: `development`, `builder`, `production`
- Use Alpine images for smaller size (unless system deps like ffmpeg, openssh needed — then use bookworm/slim)
- Copy lockfile and install deps before copying source (Docker layer caching)
- Frontend build-time env vars go as `ARG` + `ENV`
- Production images should only have production dependencies (`npm ci --omit=dev` or `yarn install --production`)
- Always add `.dockerignore`

---

### 2.6 — `docker-entrypoint.sh` (Only if runtime secrets exist)

```bash
#!/bin/sh
set -e

# Read Docker Swarm secrets and export as environment variables
# Pattern: /run/secrets/<PROJECT_PREFIX>_<SECRET_NAME> → <ENV_VAR_NAME>

if [ -f "/run/secrets/<PROJECT_PREFIX>_<SECRET_NAME>" ]; then
    export <ENV_VAR_NAME>=$(cat /run/secrets/<PROJECT_PREFIX>_<SECRET_NAME>)
else
    echo "Warning: <PROJECT_PREFIX>_<SECRET_NAME> secret not found"
fi

# Repeat for each secret...

# === If using Prisma ===
# echo "Generating Prisma client..."
# npx prisma generate
# echo "Running database migrations..."
# npx prisma migrate deploy

# === If waiting for a dependency (RabbitMQ, DB, etc.) ===
# MAX_RETRIES=10
# RETRY_COUNT=0
# until wget -q --spider http://rabbitmq:5672 2>/dev/null || [ $RETRY_COUNT -ge $MAX_RETRIES ]; do
#     echo "Waiting for RabbitMQ... ($RETRY_COUNT/$MAX_RETRIES)"
#     RETRY_COUNT=$((RETRY_COUNT + 1))
#     sleep 5
# done

# === If SSH key secret needs to be placed as a file ===
# if [ -f "/run/secrets/<PROJECT_PREFIX>_SSH_PRIVATE_KEY" ]; then
#     mkdir -p ~/.ssh
#     cp /run/secrets/<PROJECT_PREFIX>_SSH_PRIVATE_KEY ~/.ssh/id_rsa
#     chmod 600 ~/.ssh/id_rsa
# fi

# Set defaults
export PORT=${PORT:-<default_port>}
export HOST=${HOST:-0.0.0.0}

# Execute the main process (CMD)
exec "$@"
```

Rules:
- One `if` block per secret
- Secret file path: `/run/secrets/<PROJECT_PREFIX>_<name>` (Docker Swarm mounts them there)
- Always end with `exec "$@"` to pass control to CMD
- If using Prisma, add `prisma generate` and `prisma migrate deploy`
- If waiting for infrastructure (DB, queue), add a retry loop
- SSH keys: copy from secret to `~/.ssh/` with correct permissions

---

### 2.7 — `.github/workflows/deploy.yml` (GitHub Actions CI/CD)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - <branch>

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      # === One "Build and push" step per service ===
      - name: Build and push <service> image
        uses: docker/build-push-action@v5
        with:
          context: <context_path>
          file: <dockerfile_path>
          push: true
          tags: <dockerhub_org>/<image_name>:latest
          target: production
          no-cache: true
          # If build-time env vars exist:
          build-args: |
            VITE_API_URL=https://<production_api_domain>
            <OTHER_BUILD_ARG>=${{ secrets.<GITHUB_SECRET_NAME> }}

      # === Copy deployment files to server ===
      - name: Copy deployment files to server
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY_NOPW }}
          source: './docker-compose.yml,./docker-compose.swarm.yml<,./docker-entrypoint.sh>'
          target: '~/<project_directory>/'

      # === Deploy to Docker Swarm ===
      - name: Deploy to Docker Swarm
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY_NOPW }}
          script: |
            set -e

            cd <project_directory>

            # Make entrypoint executable (if exists)
            [ -f docker-entrypoint.sh ] && chmod +x docker-entrypoint.sh

            # Create webnet if it doesn't exist
            if ! docker network ls --format "{{.Name}}" | grep -q "^webnet$"; then
                docker network create --driver overlay --attachable webnet
            fi

            # Deploy stack
            docker stack deploy -c docker-compose.yml -c docker-compose.swarm.yml --with-registry-auth <stack_name>

            # Wait for deployment to process
            sleep 5

            # Force update services with latest images
            docker service update --image <dockerhub_org>/<image_name>:latest --force --with-registry-auth <stack_name>_<service_name>
```

Rules:
- Use latest action versions (v4 checkout, v3 buildx/login, v5 build-push)
- Use `target: production` in build-push-action
- Use `no-cache: true` to ensure fresh builds
- SCP only docker-compose.yml, docker-compose.swarm.yml, and docker-entrypoint.sh (NEVER the override file)
- Stack deploy uses BOTH compose files: `-c docker-compose.yml -c docker-compose.swarm.yml`
- Use `--with-registry-auth` so Swarm nodes can pull private images
- Force update each service after stack deploy to ensure new image is pulled
- Build-time secrets (VITE_*, NEXT_PUBLIC_*) passed as build-args from `${{ secrets.* }}`
- Use `${{ secrets.SERVER_HOST }}` and `${{ secrets.SSH_USER }}` for server connection (more flexible than hardcoded values)
- Always use `set -e` in SSH script to fail fast

---

### 2.8 — `.dockerignore`

```
node_modules
.git
.gitignore
.env
.env.*
!.env.example
*.md
.vscode
.idea
dist
.next
coverage
.claude
```

---

### 2.9 — `.env.example` (Development reference)

Generate a `.env.example` file listing all environment variables with placeholder values and comments. This file is safe to commit to git.

```
# === Server ===
NODE_ENV=development
PORT=<port>

# === Database (if applicable) ===
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/<project_name>

# === API Keys (if applicable) ===
<SECRET_NAME>=your_secret_here

# === Frontend (if applicable, for Vite/Next.js) ===
VITE_API_URL=http://localhost:<backend_port>
```

Also generate a `.env.development` file with actual dev values (gitignored) if the user confirms dev values.

---

## Step 3: Output Deployment Checklist

After generating all files, output a clear, actionable checklist:

---

### 1. GitHub Secrets to Configure

Go to **GitHub Repo → Settings → Secrets and variables → Actions** and add:

| Secret Name | Description | Required |
|---|---|---|
| `DOCKER_USERNAME` | Docker Hub username (default: `thegobc`) | Always |
| `DOCKER_PASSWORD` | Docker Hub password or access token | Always |
| `SSH_PRIVATE_KEY_NOPW` | SSH private key (no passphrase) for server access | Always |
| `SERVER_HOST` | Server IP address (default: `92.113.25.5`) | Always |
| `SSH_USER` | SSH username (default: `root`) | Always |
| `<BUILD_ARG_NAME>` | Build-time secret for frontend | If build-time vars exist |

Create a script that uploads everything to github to set all those up.
We should link secrets to an environment and also upload all docker swarm secrets.

### 2. Docker Secrets to Create on Server

Create a script that pulls the secret from github to generate the docker secrets on the server.
Don't run the script, only me, your creator, will do it.

### 5. Local Development

```bash
# Clone the repo and start all services:
git clone <repo_url>
cd <project_name>

# Copy env template:
cp .env.example .env.development

# Start with Docker Compose (uses docker-compose.yml + docker-compose.override.yml automatically):
docker compose up --build

# Or without Docker (for faster iteration):
<native_dev_commands>
```

### 6. First Deployment

```bash
# 1. Ensure all GitHub secrets are configured
# 2. Ensure all Docker secrets are created on the server
# 3. Ensure DNS records are set
# 4. Push to the trigger branch:
git push origin <branch>

# 5. Monitor deployment in the GitHub Actions tab
# 6. After deployment, verify:
curl -I https://<domain>/
```

### 7. Troubleshooting Commands

```bash
# SSH into server
ssh root@[ip]

# List all stacks
docker stack ls

# List services in a stack
docker stack services <stack_name>

# Check service logs (follow mode)
docker service logs <stack_name>_<service_name> --follow --tail 100

# Check why a service isn't starting
docker service ps <stack_name>_<service_name> --no-trunc

# Inspect service config (secrets, networks, etc.)
docker service inspect <stack_name>_<service_name> --pretty

# Force redeploy a service
docker service update --force <stack_name>_<service_name>

# Scale a service
docker service scale <stack_name>_<service_name>=2

# Remove a stack entirely
docker stack rm <stack_name>

# Check if secrets are accessible inside a container
docker exec -it $(docker ps -q -f name=<service_name>) ls /run/secrets/

# Prune unused images (free disk space)
docker image prune -af
```

### 8. Security Recommendations

- **Never commit `.env` files** with real credentials to git. Use `.env.example` as a template.
- **Use Docker Hub access tokens** instead of your password for `DOCKER_PASSWORD`.
- **Rotate SSH keys** periodically. Store `SSH_PRIVATE_KEY_NOPW` only in GitHub Secrets.
- **Use `external: true` volumes** for critical data (databases) so `docker stack rm` doesn't delete them.
- **Add `.env*` to `.gitignore`** (except `.env.example`).
