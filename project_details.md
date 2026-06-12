# DevFlow — Complete Project Documentation

> **DevOps Dashboard & CI/CD Pipeline Monitor**  
> A full-stack lab project demonstrating Git workflows, Jenkins CI/CD, Docker containerization, security scanning (OWASP), and Azure cloud deployment.

**Repository:** [https://github.com/Manjunath3155/Devops-Lab-Demo](https://github.com/Manjunath3155/Devops-Lab-Demo)  
**Lab context:** DevOps lab demo — Total marks: 30 | Demo time: ~15–20 minutes

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What Problem Does DevFlow Solve?](#2-what-problem-does-devflow-solve)
3. [High-Level Architecture](#3-high-level-architecture)
4. [End-to-End DevOps Flow](#4-end-to-end-devops-flow)
5. [Technology Stack](#5-technology-stack)
6. [Project Structure](#6-project-structure)
7. [Application Features (Frontend)](#7-application-features-frontend)
8. [Task → Pipeline Integration](#8-task--pipeline-integration)
9. [Backend Architecture](#9-backend-architecture)
10. [Database Schema](#10-database-schema)
11. [REST API Reference](#11-rest-api-reference)
12. [WebSocket Real-Time Updates](#12-websocket-real-time-updates)
13. [Jenkins CI/CD Pipeline](#13-jenkins-cicd-pipeline)
14. [Docker & Containerization](#14-docker--containerization)
15. [Azure Cloud Deployment](#15-azure-cloud-deployment)
16. [Git Workflow & Branching Strategy](#16-git-workflow--branching-strategy)
17. [Environment Variables](#17-environment-variables)
18. [Local Development Setup](#18-local-development-setup)
19. [Running with Docker Compose](#19-running-with-docker-compose)
20. [Testing](#20-testing)
21. [Lab Marks Distribution](#21-lab-marks-distribution)
22. [Demo Script Summary](#22-demo-script-summary)
23. [Viva Questions & Answers](#23-viva-questions--answers)
24. [Troubleshooting](#24-troubleshooting)
25. [Security Notes](#25-security-notes)
26. [Related Documentation Files](#26-related-documentation-files)

---

## 1. Executive Summary

**DevFlow** is a real-time DevOps dashboard built as a full-stack web application. It combines:

- A **Kanban task board** (To Do → In Progress → Done)
- A **CI/CD build monitor** with live WebSocket updates
- **Jenkins integration** (trigger jobs, sync build history, fetch console logs)
- **Docker** packaging for backend + frontend
- A **Jenkinsfile** pipeline with OWASP Dependency-Check security scanning

The app itself is the demo vehicle: you show how developer work (tasks) connects to automated pipelines (builds), while also demonstrating Git, Jenkins, Docker, and Azure as separate DevOps toolchain components.

| Component | Role |
|-----------|------|
| **React frontend** | Dashboard UI, Kanban board, build monitor |
| **Express backend** | REST API, JWT auth, SQLite persistence, Jenkins API client |
| **Jenkins** | Runs `Jenkinsfile` pipeline on code changes |
| **Docker** | Packages and runs the application |
| **Azure** | Optional cloud deployment target (ACR + Container Instances) |

---

## 2. What Problem Does DevFlow Solve?

In a typical DevOps workflow, developers use separate tools:

- Jira/Trello for tasks
- Jenkins for builds
- Docker for deployment
- Git for source control

DevFlow **unifies the visibility layer**: one dashboard where you can:

1. Track development tasks on a Kanban board
2. See builds triggered by task status changes
3. Monitor pipeline status in real time
4. Sync and inspect Jenkins build logs
5. Present the full Git → Jenkins → Docker → Azure story in a lab demo

---

## 3. High-Level Architecture

### Application Architecture

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────┐
│  React + Vite   │  HTTP   │   Express Backend    │  SQL    │   SQLite    │
│  (Port 5173 dev │────────▶│   (Port 5000)        │────────▶│  devflow.db │
│   Port 80 prod) │         │   + WebSocket /ws    │         └─────────────┘
└────────┬────────┘         └──────────┬───────────┘
         │                               │
         │ WebSocket                     │ Jenkins REST API
         │ BUILD_UPDATE                  │ (trigger + sync)
         ▼                               ▼
   Live build UI                  ┌─────────────┐
                                  │   Jenkins   │
                                  │  :8080      │
                                  └──────┬──────┘
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │   Docker    │
                                  │  build/run  │
                                  └─────────────┘
```

### Production Docker Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    docker-compose network                     │
│  ┌─────────────────────┐      ┌─────────────────────────┐  │
│  │  frontend (nginx)   │      │  backend (node)         │  │
│  │  Port 80            │─────▶│  Port 5000              │  │
│  │  Serves React dist  │ proxy│  Express + WebSocket    │  │
│  │  Proxies /api /ws   │      │  Volume: devflow-data   │  │
│  └─────────────────────┘      └─────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         │                                    │
    http://localhost                   host.docker.internal:8080
                                              (Jenkins on host)
```

---

## 4. End-to-End DevOps Flow

### Flow A — Developer moves a task on the board

```
User drags task to "In Progress"
        │
        ▼
PUT /api/tasks/:id  { status: "in_progress" }
        │
        ▼
buildTrigger.js → CI build on branch "develop"
        │
        ├── Insert build record (status: running)
        ├── WebSocket broadcast → UI updates live
        └── After ~3s → simulate success/fail + broadcast again

User drags task to "Done"
        │
        ▼
buildTrigger.js → Deploy build on branch "main"
        │
        ├── Insert build record
        ├── POST Jenkins /job/{name}/build  (queue real Jenkins job)
        └── WebSocket + simulated completion
```

### Flow B — Manual build from Builds page

```
User selects Pipeline + Branch → clicks "Trigger Build"
        │
        ▼
POST /api/builds  { branch, jenkins_job, trigger_jenkins: true }
        │
        ▼
triggerManualBuild() → local build record + Jenkins job queued
```

### Flow C — Sync from Jenkins

```
User clicks "Sync from Jenkins"
        │
        ▼
POST /api/builds/sync-from-jenkins  { jenkins_job }
        │
        ▼
Fetch job builds from Jenkins API
        │
        ├── Pull consoleText logs per build
        ├── Upsert into SQLite builds table
        └── WebSocket broadcast for each synced build
```

### Flow D — Git push → Jenkins pipeline (standard CI/CD)

```
git push → Jenkins pollSCM / webhook
        │
        ▼
Jenkinsfile stages:
  Checkout → Info → OWASP Dependency-Check → Build Docker → Start App
```

---

## 5. Technology Stack

| Layer | Technology | Version / Notes |
|-------|------------|-----------------|
| **Frontend** | React | 19.x |
| **Build tool** | Vite | 8.x |
| **Styling** | TailwindCSS | 4.x |
| **Drag & drop** | @hello-pangea/dnd | Kanban board |
| **Backend** | Node.js + Express | 4.x |
| **Database** | SQLite (better-sqlite3) | WAL mode, file-based |
| **Auth** | JWT + bcryptjs | 24h token expiry |
| **Real-time** | ws (WebSocket) | Path: `/ws` |
| **Containerization** | Docker + docker-compose | Multi-service |
| **Web server (prod)** | Nginx Alpine | Serves frontend, proxies API |
| **CI/CD** | Jenkins Declarative Pipeline | Jenkinsfile in repo root |
| **Security scan** | OWASP Dependency-Check | Jenkins plugin stage |
| **Cloud** | Microsoft Azure | ACR + Container Instances |

---

## 6. Project Structure

```
Devops lab demo/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # JWT generate + verify
│   ├── routes/
│   │   ├── auth.js              # Register, login, /me
│   │   ├── tasks.js             # Task CRUD + pipeline triggers
│   │   └── builds.js            # Builds, Jenkins sync, stats
│   ├── services/
│   │   ├── buildTrigger.js      # Task→build mapping, simulate completion
│   │   └── jenkins.js           # Jenkins config, list jobs, trigger build
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── builds.test.js
│   │   ├── tasks.test.js
│   │   └── helpers.js           # Test app factory + seed user
│   ├── database.js              # Schema + migrations
│   ├── server.js                # Express + WebSocket server
│   ├── package.json
│   └── devflow.db               # SQLite DB (gitignored, created at runtime)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # All pages: Login, Dashboard, Board, Builds
│   │   ├── main.jsx             # React entry
│   │   ├── index.css            # Tailwind imports
│   │   └── utils/
│   │       └── api.js           # API client (fetch + JWT)
│   ├── index.html
│   ├── vite.config.js           # Dev proxy: /api → :5000, /ws → ws://:5000
│   └── package.json
│
├── Dockerfile.backend           # Node 22 Alpine backend image
├── Dockerfile.frontend          # Vite build + Nginx serve
├── docker-compose.yml           # Backend + frontend orchestration
├── docker_setup.sh              # Add Docker to PATH (Git Bash)
├── Jenkinsfile                  # Declarative CI/CD pipeline
├── .dockerignore
├── .gitignore
├── README.md                    # Quick start guide
├── PROJECT_DEMO.md              # Step-by-step demo script for lab
└── project_details.md           # This file — full project documentation
```

---

## 7. Application Features (Frontend)

The entire UI lives in `frontend/src/App.jsx` as a single-page application with four main views.

### 7.1 Authentication (`LoginPage`)

- **Register:** username, email, password (min 6 chars)
- **Login:** username + password
- JWT stored in `localStorage` under key `devflow_token`
- Auto-login on refresh if token is valid (`GET /api/auth/me`)

### 7.2 Dashboard (`DashboardPage`)

Overview of the DevOps pipeline at a glance:

| Section | Content |
|---------|---------|
| **Stat cards** | Total builds, task completion, running builds, success rate |
| **Quick actions** | New Task (→ Board), Trigger Build (→ Builds) |
| **Build health bar** | Success vs failed ratio |
| **Task distribution** | To Do / In Progress / Done counts |
| **Branch breakdown** | Builds per branch |
| **Recent builds** | Latest 4 builds with status |
| **Recent tasks** | Latest 5 tasks |
| **Activity feed** | Combined chronological build + task events |

### 7.3 Board (`BoardPage`)

Kanban task management with pipeline integration:

| Column ID | Display name |
|-----------|--------------|
| `todo` | To Do |
| `in_progress` | In Progress |
| `done` | Done |

**Features:**
- Drag-and-drop between columns (`@hello-pangea/dnd`)
- Quick add via **+** button on each column
- Full task modal: title, description, priority, status
- Priority badges: low, medium, high, critical
- **Pipeline banner** when a status change triggers a build
- Subtitle explains: *In Progress → CI on develop*, *Done → deploy on main + Jenkins*

### 7.4 Builds (`BuildsPage`)

CI/CD pipeline monitor:

| Feature | Description |
|---------|-------------|
| **Pipeline selector** | Choose Jenkins job (fetched from API or fallback list) |
| **Branch selector** | main, develop, or branches from build history |
| **Trigger Build** | Manual build + Jenkins queue |
| **Sync from Jenkins** | Pull real Jenkins history + console logs |
| **Refresh** | Reload builds from local DB |
| **Live indicator** | WebSocket connected / offline |
| **Expandable rows** | Build logs, timestamps, triggered-by user |

Selected pipeline is persisted in `localStorage` (`devflow_jenkins_job`).

---

## 8. Task → Pipeline Integration

Implemented in `backend/services/buildTrigger.js` and wired through `backend/routes/tasks.js`.

| Task status | Pipeline action | Branch | Jenkins triggered? |
|-------------|-----------------|--------|-------------------|
| `todo` | None | — | No |
| `in_progress` | CI validation | `develop` | No |
| `done` | Deploy pipeline | `main` | **Yes** |

**When it fires:**
- Creating a task directly in `in_progress` or `done`
- Updating task status (drag on board or save in modal)
- Does **not** re-fire if status unchanged

**API response includes optional `pipeline` object:**

```json
{
  "task": { "id": 1, "title": "...", "status": "done" },
  "pipeline": {
    "build": { "id": 5, "build_number": 3, "status": "running", "branch": "main" },
    "action": "Deploy pipeline",
    "branch": "main",
    "jenkinsJob": "Devops-Lab-Demo",
    "jenkinsQueued": true
  }
}
```

**Build simulation:** After insert, a 3-second timeout randomly marks the build success (~70%) or failed (~30%), updates logs, and broadcasts via WebSocket. Jenkins trigger runs in parallel (real queue, not waited on).

---

## 9. Backend Architecture

### 9.1 Server (`server.js`)

- Express HTTP server on port **5000**
- CORS enabled
- JSON body parsing
- WebSocket server at path **`/ws`**
- Routes mounted under `/api/auth`, `/api/tasks`, `/api/builds`
- Health check: `GET /api/health`
- In production (`NODE_ENV=production`): serves `frontend/dist` as static files

### 9.2 Authentication (`middleware/auth.js`)

- JWT signed with `JWT_SECRET` (default: `devflow-secret-key-change-in-production`)
- Payload: `{ id, username, role }`
- Expiry: **24 hours**
- Protected routes use `Authorization: Bearer <token>`

### 9.3 Jenkins Service (`services/jenkins.js`)

| Function | Purpose |
|----------|---------|
| `getJenkinsConfig()` | Read URL, job name, credentials from env |
| `getAuthHeaders()` | Basic auth header from user + token |
| `listJenkinsJobs()` | `GET /api/json?tree=jobs[name]` |
| `triggerJenkinsJob(name)` | `POST /job/{name}/build` with CSRF crumb |

**Default configuration:**

| Variable | Default |
|----------|---------|
| `JENKINS_URL` | `http://host.docker.internal:8080` (Docker) / use `http://localhost:8080` locally |
| `JENKINS_JOB_NAME` | `Devops-Lab-Demo` |
| `JENKINS_USER` | `manjunathpatil` |
| `JENKINS_TOKEN` | Falls back to `JENKINS_PASSWORD` or demo password |

### 9.4 Build Trigger Service (`services/buildTrigger.js`)

| Function | Purpose |
|----------|---------|
| `getPipelineForStatus(status)` | Map status → branch + Jenkins flag |
| `shouldTriggerPipeline(old, new)` | Only on status change to in_progress/done |
| `startBuild(userId, opts)` | Insert build, simulate, optional Jenkins |
| `triggerBuildForTask(userId, task)` | Called from task routes |
| `triggerManualBuild(userId, opts)` | Called from builds POST route |

---

## 10. Database Schema

SQLite database file: `backend/devflow.db` (or `/app/data/devflow.db` in Docker).

### `users`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| username | TEXT UNIQUE | Required |
| email | TEXT UNIQUE | Required |
| password | TEXT | bcrypt hash |
| role | TEXT | Default: `developer` |
| created_at | DATETIME | Auto |

### `tasks`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| title | TEXT | Required |
| description | TEXT | Optional |
| status | TEXT | `todo`, `in_progress`, `done` |
| priority | TEXT | `low`, `medium`, `high`, `critical` |
| assigned_to | INTEGER FK | → users.id |
| created_by | INTEGER FK | → users.id |
| created_at / updated_at | DATETIME | |

### `builds`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| build_number | INTEGER | Per Jenkins job sequence |
| jenkins_job | TEXT | Default: `Devops-Lab-Demo` |
| branch | TEXT | e.g. main, develop |
| status | TEXT | pending, running, success, failed, cancelled |
| commit_sha | TEXT | e.g. `task-5` for task-triggered builds |
| commit_message | TEXT | e.g. `Task #5: Set up Jenkins` |
| triggered_by | INTEGER FK | → users.id |
| started_at / finished_at | DATETIME | |
| logs | TEXT | Simulated or Jenkins console |
| created_at | DATETIME | |

### `deployments`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| build_id | INTEGER FK | → builds.id |
| environment | TEXT | staging, production |
| status | TEXT | pending, deploying, success, failed |
| url | TEXT | Deployment URL |
| deployed_at | DATETIME | |

> **Note:** Deployments table exists for future Azure deployment tracking; primary demo flow uses builds.

---

## 11. REST API Reference

Base URL: `http://localhost:5000/api` (dev) or `http://localhost/api` (Docker via Nginx proxy)

### Authentication

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/auth/register` | No | `{ username, email, password }` | `{ user, token }` |
| POST | `/auth/login` | No | `{ username, password }` | `{ user, token }` |
| GET | `/auth/me` | Yes | — | `{ user }` |

### Health

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | `/health` | No | `{ status, version, timestamp }` |

### Tasks

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/tasks` | Yes | Query: `?status=&priority=&assigned_to=` |
| GET | `/tasks/:id` | Yes | Single task with creator/assignee names |
| POST | `/tasks` | Yes | Creates task; may include `pipeline` in response |
| PUT | `/tasks/:id` | Yes | Updates task; may trigger pipeline |
| DELETE | `/tasks/:id` | Yes | Deletes task |

**Create/update body example:**

```json
{
  "title": "Set up Jenkins pipeline",
  "description": "Configure DevFlow-Pipeline job",
  "priority": "high",
  "status": "in_progress"
}
```

### Builds

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/builds` | Yes | Query: `?status=&branch=&jenkins_job=` |
| GET | `/builds/jenkins/jobs` | Yes | List Jenkins pipeline jobs |
| GET | `/builds/:id` | Yes | Build + related deployments |
| POST | `/builds` | Yes | Manual trigger |
| GET | `/builds/latest/:branch` | Yes | Latest build for branch |
| GET | `/builds/stats/summary` | Yes | Dashboard statistics |
| POST | `/builds/sync-from-jenkins` | Yes | Sync Jenkins history |

**Trigger build body:**

```json
{
  "branch": "main",
  "commit_sha": "",
  "commit_message": "Manual deploy",
  "jenkins_job": "Devops-Lab-Demo",
  "trigger_jenkins": true
}
```

**Sync body:**

```json
{
  "jenkins_job": "Devops-Lab-Demo"
}
```

---

## 12. WebSocket Real-Time Updates

**Endpoint:** `ws://localhost:5000/ws` (dev) or `ws://localhost/ws` (Docker)

**Message format:**

```json
{
  "type": "BUILD_UPDATE",
  "data": {
    "id": 1,
    "build_number": 5,
    "branch": "main",
    "status": "success",
    "logs": "...",
    "jenkins_job": "Devops-Lab-Demo"
  }
}
```

**When broadcast fires:**
- New build inserted (task trigger or manual)
- Simulated build completion (~3 seconds later)
- Jenkins sync upserts builds

Frontend listens on Builds page and Board page (for pipeline banner completion updates).

---

## 13. Jenkins CI/CD Pipeline

Defined in root **`Jenkinsfile`**. GitHub repo: `Manjunath3155/Devops-Lab-Demo`.

### Pipeline configuration

| Setting | Value |
|---------|-------|
| Agent | `any` |
| SCM poll | Every ~2 minutes (`H/2 * * * *`) |
| Timeout | 30 minutes |
| Build retention | Last 10 builds |
| Docker command | `C:/Program Files/Docker/Docker/resources/bin/docker` |

### Stages (actual Jenkinsfile)

| # | Stage | What it does |
|---|-------|--------------|
| 1 | **Checkout** | Pulls code from SCM; logs branch, commit, PR info |
| 2 | **Info** | Logs build number and start message |
| 3 | **OWASP Dependency-Check** | Scans `backend/` and `frontend/` for vulnerable dependencies; HTML + XML reports; fails on CVSS ≥ 7 |
| 4 | **Build Docker Images** | `docker build -f Dockerfile.backend` and `Dockerfile.frontend` |
| 5 | **Start Application** | `docker compose up -d --force-recreate` |

### Jenkins job setup

**Option A — Pipeline from SCM:**
1. New Item → Pipeline
2. Pipeline script from SCM → Git
3. Repository URL: your GitHub repo
4. Script Path: `Jenkinsfile`

**Option B — Multibranch Pipeline (recommended for PRs):**
- Branch Sources → GitHub
- Behaviours: discover branches + pull requests
- Build configuration: by Jenkinsfile

### Required Jenkins plugins

- Git Plugin
- Docker Pipeline Plugin
- **OWASP Dependency-Check Plugin** (for security stage)
- NodeJS Plugin (if extended)
- SonarQube Scanner (optional, for SonarQube integration)

### OWASP Dependency-Check setup

1. **Manage Jenkins → Plugins** → install **OWASP Dependency-Check**
2. **Manage Jenkins → Tools** → add Dependency-Check installation named `dependency-check`
3. Pipeline uses:
   ```groovy
   dependencyCheck additionalArguments: '--scan backend --scan frontend ...',
                   odcInstallation: 'dependency-check'
   dependencyCheckPublisher pattern: 'dependency-check-report/dependency-check-report.xml'
   ```

### Jenkins access (local demo)

| Item | Value |
|------|-------|
| URL | http://localhost:8080 |
| Default job names | `Devops-Lab-Demo`, `DevFlow-Pipeline` |
| CLI trigger | `java -jar jenkins-cli.jar -s http://localhost:8080 build Devops-Lab-Demo` |

---

## 14. Docker & Containerization

### Dockerfile.backend

- Base: `node:22-alpine`
- Production deps only (`npm ci --only=production`)
- Runs as non-root `node` user
- DB path: `/app/data/devflow.db`
- Exposes port **5000**

### Dockerfile.frontend

- **Build stage:** Node 22 Alpine → `npm run build`
- **Serve stage:** Nginx Alpine
- Custom Nginx config:
  - `/` → React SPA (`try_files`)
  - `/api/` → proxy to `http://backend:5000`
  - `/ws` → WebSocket proxy to backend
- Exposes port **80**

### docker-compose.yml

| Service | Port | Notes |
|---------|------|-------|
| backend | 5000:5000 | Jenkins env vars, healthcheck, volume |
| frontend | 80:80 | Depends on backend |

**Backend environment (compose):**
- `JENKINS_URL=http://host.docker.internal:8080`
- `JENKINS_JOB_NAME=Devops-Lab-Demo`
- `extra_hosts: host.docker.internal:host-gateway` (reach Jenkins on Windows host)

### Useful commands

```powershell
# Add Docker to PATH (PowerShell session)
$env:Path += ";C:\Program Files\Docker\Docker\resources\bin"

# Build and run
docker compose up --build -d

# Check status
docker compose ps
docker ps

# Logs
docker compose logs -f

# Stop
docker compose down

# Reset database volume
docker compose down -v
```

### Docker not in PATH?

Use full path or run `docker_setup.sh` in Git Bash:

```bash
export PATH="$PATH:/c/Program Files/Docker/Docker/resources/bin"
```

---

## 15. Azure Cloud Deployment

DevFlow supports deployment to Azure as documented in `README.md`. Typical flow:

```
Git Push → Jenkins → Docker Build → Azure Container Registry → Azure Container Instances
```

### Prerequisites

- Azure subscription (free tier works)
- Azure CLI (`az`)
- Docker images built locally or in Jenkins

### Key commands

```bash
# Login
az login

# Resource group
az group create --name devflow-rg --location eastus

# Container Registry
az acr create --resource-group devflow-rg --name devflowregistry --sku Basic --admin-enabled true
az acr login --name devflowregistry

# Tag and push
docker tag devflow-backend devflowregistry.azurecr.io/devflow-backend:latest
docker push devflowregistry.azurecr.io/devflow-backend:latest

# Deploy
az container create \
  --resource-group devflow-rg \
  --name devflow-backend \
  --image devflowregistry.azurecr.io/devflow-backend:latest \
  --ports 5000 \
  --dns-name-label devflow-backend \
  --registry-login-server devflowregistry.azurecr.io
```

### Demo talking points

- Resource groups organize all project resources
- ACR is private Docker image storage on Azure
- Container Instances run containers without managing VMs
- Pay-per-use pricing on free tier

---

## 16. Git Workflow & Branching Strategy

```
main ──────────────► Production-ready (deploy)
  │
  └── develop ─────► Integration / CI testing
        │
        ├── feature/* ──► New features
        └── fix/* ──────► Bug fixes
```

### Conventional commits (recommended)

```
feat: add task pipeline integration
fix: resolve Jenkins sync 502 error
docs: update project_details.md
chore: update dependencies
```

### Commands

```bash
git checkout -b feature/my-feature
git add .
git commit -m "feat: describe change"
git push origin feature/my-feature
git checkout develop
git merge feature/my-feature
```

### .gitignore highlights

- `node_modules/`, `frontend/dist/`
- `*.db`, `*.db-wal`, `*.db-shm`
- `.env`, `.env.local`
- IDE and OS junk files

---

## 17. Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | HTTP server port |
| `NODE_ENV` | — | Set `production` in Docker |
| `JWT_SECRET` | `devflow-secret-key-change-in-production` | JWT signing key |
| `DB_PATH` | `./devflow.db` | SQLite file path |
| `JENKINS_URL` | `http://host.docker.internal:8080` | Jenkins base URL |
| `JENKINS_JOB_NAME` | `Devops-Lab-Demo` | Default pipeline job |
| `JENKINS_USER` | `manjunathpatil` | Jenkins username |
| `JENKINS_TOKEN` | — | API token (preferred) |
| `JENKINS_PASSWORD` | fallback | Used if token not set |

> **Production:** Always set strong `JWT_SECRET` and use Jenkins API tokens, not passwords.

---

## 18. Local Development Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Git
- Docker Desktop (for container demo)
- Jenkins (Windows service or standalone)

### Steps

```powershell
# Terminal 1 — Backend
cd "C:\Users\Manjunath\OneDrive\Desktop\CODE\Devops lab demo\backend"
npm install
npm start
# → http://localhost:5000

# Terminal 2 — Frontend
cd "C:\Users\Manjunath\OneDrive\Desktop\CODE\Devops lab demo\frontend"
npm install
npm run dev
# → http://localhost:5173
```

Vite dev server proxies:
- `/api/*` → `http://localhost:5000`
- `/ws` → `ws://localhost:5000`

### First use

1. Open http://localhost:5173
2. Register an account
3. Create tasks on **Board**
4. Drag to **In Progress** or **Done** to trigger pipelines
5. Monitor on **Builds** page

---

## 19. Running with Docker Compose

```powershell
cd "C:\Users\Manjunath\OneDrive\Desktop\CODE\Devops lab demo"
$env:Path += ";C:\Program Files\Docker\Docker\resources\bin"
docker compose up --build -d
```

| URL | Service |
|-----|---------|
| http://localhost | Frontend (Nginx) |
| http://localhost:5000/api/health | Backend health |
| http://localhost:8080 | Jenkins (host) |
| http://localhost:9000 | SonarQube (if running in Docker) |

---

## 20. Testing

Backend tests use Node.js built-in test runner:

```powershell
cd backend
node --test tests/*.test.js
```

### Test suites

| File | Covers |
|------|--------|
| `auth.test.js` | Register, login, /me, validation |
| `tasks.test.js` | CRUD, filters, **task→pipeline integration** |
| `builds.test.js` | Trigger, stats, filters, auth |

### Task pipeline tests verify

- Moving task to `done` → build on `main`, status `running`
- Moving to `in_progress` → build on `develop`
- Creating in `todo` → no pipeline in response

---

## 21. Lab Marks Distribution

| Component | Marks | What to demonstrate |
|-----------|-------|---------------------|
| **Git** | 10 | Branching, commits, .gitignore, workflow |
| **Jenkins** | 10 | Declarative pipeline, stages, console output |
| **Docker** | 10 | Dockerfiles, compose, containers running |
| **Azure** | 5 | Architecture, ACR, container deployment |
| **Demo / Viva** | 5 | Live app + Q&A |

**Total: 30 marks**

---

## 22. Demo Script Summary

Full step-by-step script: see **`PROJECT_DEMO.md`**.

### Recommended demo order (~15–20 min)

1. **Intro** (2 min) — What DevFlow is, toolchain overview
2. **Git** (4 min) — `git log`, branches, feature branch, `.gitignore`
3. **Docker** (4 min) — Dockerfiles, compose, `docker compose up`, `docker ps`
4. **Jenkins** (4 min) — Dashboard, Jenkinsfile stages, Build Now, console output
5. **Azure** (3 min) — Portal, architecture diagram, CLI commands
6. **Live app** — Register, create task, drag to Done, show build + Jenkins
7. **Viva** (3 min) — DevOps concepts Q&A

### Pre-demo checklist

- [ ] Docker Desktop running
- [ ] Backend: `npm start` (or `docker compose up`)
- [ ] Frontend: `npm run dev` (or use Docker on port 80)
- [ ] Jenkins running at :8080
- [ ] Pipeline job exists (`Devops-Lab-Demo`)
- [ ] Browser tabs ready: app, Jenkins, optional Azure portal

---

## 23. Viva Questions & Answers

**Q: What is DevOps?**  
Combining development and operations practices to deliver software faster with automation, CI/CD, and monitoring.

**Q: What is CI/CD?**  
CI automatically builds and tests code on every change. CD automatically deploys tested code to staging/production.

**Q: What is Docker?**  
A containerization platform that packages apps + dependencies into portable, lightweight containers sharing the host OS kernel.

**Q: Docker vs VM?**  
Containers share the host kernel (MB, seconds to start). VMs include a full guest OS (GB, minutes to start).

**Q: What is Jenkins?**  
Open-source automation server for CI/CD. Pipelines are defined in a `Jenkinsfile`.

**Q: How does Git integrate with Jenkins?**  
Jenkins polls SCM or receives webhooks; on change it runs the pipeline from the repo.

**Q: What is OWASP Dependency-Check?**  
Scans project dependencies for known CVEs; integrated as a Jenkins pipeline stage.

**Q: What is Azure used for here?**  
Hosting Docker images (ACR) and running containers (Container Instances) without managing servers.

**Q: How would you scale DevFlow?**  
Kubernetes/Docker Swarm for multi-instance deployment, load balancer, managed DB instead of SQLite.

**Q: What happens when I move a task to Done?**  
Backend creates a build on `main`, broadcasts via WebSocket, and queues the Jenkins pipeline job.

---

## 24. Troubleshooting

| Problem | Solution |
|---------|----------|
| `docker` not recognized | Add `C:\Program Files\Docker\Docker\resources\bin` to PATH |
| Backend won't start | Check port 5000 free; run `npm install` in backend |
| Frontend API errors | Ensure backend running; check Vite proxy in `vite.config.js` |
| Jenkins sync 502 | Verify Jenkins at :8080; check `JENKINS_URL`, user, token |
| Jenkins trigger fails | Confirm job name matches; check crumb + credentials |
| WebSocket shows Offline | Normal if backend down; refresh after backend starts |
| Task drag doesn't trigger build | Restart backend after code changes; only fires on status **change** |
| OWASP stage fails in Jenkins | Install Dependency-Check plugin + tool named `dependency-check` |
| SonarQube won't load | Wait 2–5 min after first `docker run`; check `docker logs sonarqube` |
| SQLite locked | Only one backend instance should write to same DB file |

---

## 25. Security Notes

This project is a **lab demo**, not production-hardened:

- Default JWT secret is weak — change in production
- Jenkins credentials appear in `docker-compose.yml` for demo convenience
- Build success/failure is partially **simulated** (random 70/30) for UI demo
- Passwords hashed with bcrypt (cost 10)
- OWASP Dependency-Check stage scans for dependency vulnerabilities in CI
- SonarQube (optional) adds static code analysis when configured in Jenkins

**Before any public deployment:**
- Rotate all secrets
- Use Jenkins API tokens, not passwords
- Remove credentials from compose files (use `.env` + secrets manager)
- Enable HTTPS

---

## 26. Related Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Quick start, API table, Azure commands |
| `PROJECT_DEMO.md` | Lab presentation script with talking points |
| `project_details.md` | This document — comprehensive reference |
| `Jenkinsfile` | CI/CD pipeline definition |
| `docker-compose.yml` | Multi-container runtime config |

---

## Quick Reference — Ports & URLs

| Service | URL |
|---------|-----|
| DevFlow (dev frontend) | http://localhost:5173 |
| DevFlow (Docker frontend) | http://localhost |
| Backend API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |
| WebSocket | ws://localhost:5000/ws |
| Jenkins | http://localhost:8080 |
| SonarQube (Docker) | http://localhost:9000 |

---

*Last updated to reflect: task→pipeline integration, Jenkins sync with console logs, OWASP Dependency-Check stage, multi-job Jenkins support, and Board pipeline notifications.*
