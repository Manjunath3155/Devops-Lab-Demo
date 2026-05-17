# DevFlow 🚀

**DevOps Dashboard & CI/CD Pipeline Monitor**

A full-stack DevOps pipeline project demonstrating Git workflows, Jenkins CI/CD, Docker containerization, and Azure cloud deployment.

## 📋 Project Overview

DevFlow is a real-time DevOps dashboard that combines a task/issue tracker with a build pipeline monitor. It's designed to showcase a complete DevOps workflow from development to deployment.

### Key Features
- **Task Management** — Create, update, and track development tasks
- **Build Pipeline** — Trigger and monitor CI/CD builds in real-time
- **Real-time Updates** — WebSocket-powered live build status updates
- **REST API** — Full CRUD operations for tasks and builds
- **User Authentication** — JWT-based secure authentication

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  React/Vite  │────▶│  Express API  │────▶│  SQLite  │
│  Frontend    │     │  Backend      │     │  Database│
│  (Port 80)   │◀────│  (Port 5000)  │     └──────────┘
└─────────────┘     │  + WebSocket  │
                    └──────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, TailwindCSS |
| **Backend** | Node.js, Express |
| **Database** | SQLite (better-sqlite3) |
| **Real-time** | WebSocket (ws) |
| **Auth** | JWT (jsonwebtoken + bcryptjs) |
| **Containerization** | Docker, docker-compose |
| **CI/CD** | Jenkins Pipeline |
| **Cloud** | Microsoft Azure |

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9
- Git
- Docker Desktop (for containerization)
- Jenkins (for CI/CD pipeline)

### Local Development

```bash
# 1. Install backend dependencies
cd backend && npm install

# 2. Start the backend server
npm start

# 3. In a new terminal, install frontend dependencies
cd frontend && npm install

# 4. Start the frontend dev server
npm run dev
```

The app will be available at `http://localhost:5173` (frontend) with API at `http://localhost:5000`.

### Docker Deployment

```bash
# Build and run with docker-compose
docker-compose up --build

# Access the app
# Frontend: http://localhost
# Backend API: http://localhost:5000/api
```

## 🔄 Git Workflow

```
main ──────► Production-ready code
  │
  └── develop ──► Integration branch
        │
        ├── feature/xyz ──► Feature branches
        └── fix/xyz ──────► Bug fix branches
```

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready, deployed to Azure |
| `develop` | Integration branch for features |
| `feature/*` | Feature development branches |
| `fix/*` | Bug fix branches |

### Commands
```bash
# Create a feature branch
git checkout -b feature/new-feature

# Commit your changes
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Merge to develop
git checkout develop
git merge feature/new-feature
```

## 🤖 Jenkins Pipeline

The project includes a `Jenkinsfile` with a complete CI/CD pipeline:

| Stage | Description |
|-------|-------------|
| **Checkout** | Pull code from Git repository |
| **Install Dependencies** | Install backend & frontend packages |
| **Lint & Test** | Run linters and build checks |
| **Build Docker Images** | Build Docker images for both services |
| **Push to Registry** | Push images to Docker Hub |
| **Deploy to Azure** | Deploy containers to Azure |
| **Cleanup** | Remove old artifacts |

### Setting up Jenkins

1. **Install Jenkins** (already installed at `C:\ProgramData\Jenkins\`)
2. **Start Jenkins**:
   ```bash
   java -jar C:\ProgramData\Jenkins\jenkins.war --httpPort=8080
   ```
3. **Access Jenkins**: `http://localhost:8080`
4. **Install Plugins**:
   - Git Plugin
   - Docker Pipeline Plugin
   - NodeJS Plugin
   - Azure CLI Plugin
5. **Create Pipeline**:
   - New Item → Pipeline
   - Pipeline Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: Your GitHub repo URL
   - Script Path: `Jenkinsfile`

## 🐳 Docker Containers

### Images

| Service | Dockerfile | Base Image |
|---------|-----------|------------|
| **Backend** | `Dockerfile.backend` | `node:22-alpine` |
| **Frontend** | `Dockerfile.frontend` | `node:22-alpine` + `nginx:alpine` |

### Useful Docker Commands

```bash
# Build individual images
docker build -f Dockerfile.backend -t devflow-backend .
docker build -f Dockerfile.frontend -t devflow-frontend .

# Run containers manually
docker run -d -p 5000:5000 --name devflow-backend devflow-backend
docker run -d -p 80:80 --name devflow-frontend devflow-frontend

# Use docker-compose (recommended)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Remove all volumes (reset DB)
docker-compose down -v
```

## ☁️ Azure Deployment

### Prerequisites
1. Azure subscription (free tier works)
2. Azure CLI installed
3. Docker Hub account

### Deployment Steps

```bash
# Login to Azure
az login

# Create resource group
az group create --name devflow-rg --location eastus

# Create Azure Container Registry (ACR)
az acr create --resource-group devflow-rg --name devflowregistry --sku Basic --admin-enabled true

# Login to ACR
az acr login --name devflowregistry

# Tag and push images
docker tag devflow-backend devflowregistry.azurecr.io/devflow-backend:latest
docker push devflowregistry.azurecr.io/devflow-backend:latest

# Deploy to Azure Container Instances
az container create \
  --resource-group devflow-rg \
  --name devflow-backend \
  --image devflowregistry.azurecr.io/devflow-backend:latest \
  --ports 5000 \
  --dns-name-label devflow-backend \
  --registry-login-server devflowregistry.azurecr.io

# Get the URL
az container show --resource-group devflow-rg --name devflow-backend --query ipAddress.fqdn
```

## 📝 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| GET | `/api/health` | Health check | ❌ |
| GET | `/api/tasks` | List tasks | ✅ |
| POST | `/api/tasks` | Create task | ✅ |
| GET | `/api/tasks/:id` | Get task | ✅ |
| PUT | `/api/tasks/:id` | Update task | ✅ |
| DELETE | `/api/tasks/:id` | Delete task | ✅ |
| GET | `/api/builds` | List builds | ✅ |
| POST | `/api/builds` | Trigger build | ✅ |
| GET | `/api/builds/:id` | Get build | ✅ |
| GET | `/api/builds/stats/summary` | Get stats | ✅ |

## 📊 Marks Distribution

| Component | Marks | Implementation |
|-----------|-------|----------------|
| **Git** | 10 | Branching strategy, commits, pull requests |
| **Jenkins** | 10 | Declarative pipeline with 6 stages |
| **Docker** | 10 | Multi-container setup with docker-compose |
| **Azure** | 5 | Container deployment to Azure |
| **Demo** | 5 | Live presentation of full workflow |

## 📄 License

MIT
