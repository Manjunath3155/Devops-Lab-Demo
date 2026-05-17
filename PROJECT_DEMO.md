# DevFlow - Project Demo Guide 📋

> **Complete step-by-step guide for presenting DevFlow in your DevOps lab demo**
>
> Total Marks: 30 | Demo Time: ~15-20 minutes

---

## 📑 Demo Flow Overview

```
1. Project Introduction (2 min)
2. Code & Git Walkthrough (4 min)     → 10 marks
3. Docker Demonstration (4 min)       → 10 marks
4. Jenkins Pipeline Demo (4 min)      → 10 marks
5. Azure Deployment Overview (3 min)  → 5 marks
6. Live Q&A (3 min)                   → 5 marks (Viva)
```

---

## 🔧 Pre-Demo Setup Checklist

Run these commands **before** going into the demo room:

### 1. Start Docker Desktop
- Open Docker Desktop from Start Menu
- Wait for the Docker engine to start (whale icon stops animating)
- **If Docker is not in PATH:**
  ```powershell
  # Run this in PowerShell to add Docker to PATH for current session
  $env:Path += ";C:\Program Files\Docker\Docker\resources"
  ```
  Or find the full path:
  ```powershell
  where.exe docker
  ```

### 2. Start the Backend
```powershell
cd "C:\Users\Manjunath\OneDrive\Desktop\CODE\Devops lab demo"
cd backend
npm start
```
Keep this terminal open. Backend will run at `http://localhost:5000`

### 3. Start the Frontend (New Terminal)
```powershell
cd "C:\Users\Manjunath\OneDrive\Desktop\CODE\Devops lab demo"
cd frontend
npm run dev
```
Keep this terminal open. Frontend will run at `http://localhost:5173`

### 4. Start Jenkins (New Terminal)
```powershell
java -jar "C:\ProgramData\Jenkins\jenkins.war" --httpPort=8080
```
Jenkins will be available at `http://localhost:8080`

---

## 🎬 Part 1: Project Introduction (2 min)

### What to Say:

> "Good morning/afternoon, everyone. Today I'll be demonstrating **DevFlow**, a complete DevOps pipeline project.
>
> **DevFlow** is a real-time DevOps dashboard that integrates:
> - **Git** for version control with proper branching strategy
> - **Jenkins** for CI/CD automation
> - **Docker** for containerization
> - **Azure** for cloud deployment
>
> The application itself is a full-stack task tracker with a live build pipeline monitor. Users can create tasks, trigger builds, and see real-time status updates."

**On your laptop:** Show the project directory structure

---

## ⭐ Part 2: Git - Version Control (4 min) → 10 Marks

### What to Show:

**Step 1: Show Git Log**
```powershell
cd "C:\Users\Manjunath\OneDrive\Desktop\CODE\Devops lab demo"
git log --oneline --graph --all
```
> *Explain: "Here you can see our commit history with meaningful commit messages."*

**Step 2: Show Branching Strategy**
```powershell
git branch -a
```
> *Explain: "We follow a proper Git workflow with 'main' for production, 'develop' for integration, and feature branches. Let me create a quick feature branch to demonstrate."*

**Step 3: Create a Feature Branch**
```powershell
git checkout -b feature/demo-feature
echo "# Demo feature" >> demo.txt
git add demo.txt
git commit -m "feat: add demo feature file"
git checkout main
```
> *Explain: "This shows how developers create feature branches, make changes, and merge them back."*

**Step 4: Show .gitignore**
```powershell
cat .gitignore
```
> *Explain: "We use .gitignore to exclude node_modules, build outputs, and environment files from version control."*

**Step 5: Show Commit History Quality**
```powershell
git log --oneline -10
```
> *Explain: "All commits follow conventional commit format for better traceability."*

### ✅ Key Points to Emphasize:
- Branching strategy (main → develop → feature)
- Meaningful commit messages
- .gitignore usage
- Git is integrated with Jenkins via webhooks

---

## 🐳 Part 3: Docker - Containerization (4 min) → 10 Marks

### What to Show:

**Step 1: Show Dockerfiles**
Open `Dockerfile.backend`:
> *Explain: "This Dockerfile uses a multi-stage build. The first stage installs dependencies and copies source code. The second stage is a lightweight Alpine image that runs the app. This keeps the final image small."*

Open `Dockerfile.frontend`:
> *Explain: "For the frontend, we first build the React app with Vite, then serve it using Nginx — a production-grade web server. We also configure Nginx to proxy API requests to the backend."*

**Step 2: Show docker-compose.yml**
Open `docker-compose.yml`:
> *Explain: "Docker Compose orchestrates both services. The backend runs on port 5000 and the frontend on port 80. They communicate through a shared network. We also have a persistent volume for the SQLite database."*

**Step 3: Build and Run with Docker (LIVE DEMO)**
```powershell
cd "C:\Users\Manjunath\OneDrive\Desktop\CODE\Devops lab demo"
docker-compose up --build -d
```
> *Wait for both containers to start...*

**Step 4: Show Running Containers**
```powershell
docker ps
docker-compose ps
```
> *Explain: "Both containers are running. Let's verify the app is accessible."*

**Step 5: Test the Application**
Open browser → `http://localhost` (frontend through Nginx)
Open browser → `http://localhost:5000/api/health` (backend API)

**Step 6: Show Container Logs**
```powershell
docker-compose logs --tail=20
```
> *Explain: "We can see real-time logs from both containers."*

**Step 7: Cleanup**
```powershell
docker-compose down
```
> *Explain: "One command stops and removes all containers."*

### ✅ Key Points to Emphasize:
- Multi-stage Docker builds for smaller images
- Docker Compose for multi-container orchestration
- Volume mounting for persistent data
- Network configuration for inter-service communication
- Health checks for container monitoring

---

## 🤖 Part 4: Jenkins - CI/CD Pipeline (4 min) → 10 Marks

### Assumption: Jenkins is already started

**Step 1: Open Jenkins Dashboard**
Open browser → `http://localhost:8080`

> *Explain: "This is the Jenkins dashboard. Jenkins is our automation server that runs the CI/CD pipeline."*

**Step 2: Show the Jenkinsfile**
Open `Jenkinsfile` from the project:

> *Explain: "Our Jenkinsfile defines a declarative pipeline with 6 stages:*
> 1. *Checkout - Pulls code from Git*
> 2. *Install Dependencies - npm ci for both frontend and backend*
> 3. *Lint & Test - Builds frontend and runs linters*
> 4. *Build Docker Images - Creates Docker images*
> 5. *Push to Registry - Pushes to Docker Hub*
> 6. *Deploy to Azure - Deploys containers to Azure*
>
> *The pipeline is declarative, meaning it's easy to read and maintain."*

**Step 3: Create a New Pipeline in Jenkins (or show existing)**

> *If no pipeline exists:*
> - Click "New Item"
> - Enter name: "DevFlow Pipeline"
> - Select "Pipeline"
> - Under "Pipeline Definition", select "Pipeline script from SCM"
> - SCM: Git
> - Repository URL: (your GitHub URL)
> - Script Path: Jenkinsfile
> - Save

**Step 4: Trigger a Build**
Click "Build Now" on the pipeline

> *Explain: "This triggers the pipeline. You can see each stage executing..."*

**Step 5: Show Build Progress**
Click on the running build → "Console Output"

> *Explain: "The console output shows real-time logs of each stage. If any stage fails, Jenkins stops and shows the error."*

**Step 6: Show Build History**
Go back to pipeline → "Build History"

> *Explain: "Jenkins tracks all builds, their status, duration, and trends. Green is success, red is failure."*

### ✅ Key Points to Emphasize:
- Declarative pipeline syntax
- Parallel stages (frontend + backend installs)
- Integration with Git
- Integration with Docker
- Integration with Azure
- Build history and trends
- Console output for debugging

---

## ☁️ Part 5: Azure - Cloud Deployment (3 min) → 5 Marks

### What to Show:

**Step 1: Azure Portal Overview**
Open browser → `https://portal.azure.com`

> *Explain: "Azure is Microsoft's cloud platform. We use it to deploy our Docker containers."*

**Step 2: Show Azure Resource Group**
Navigate to "Resource Groups" → Show `devflow-rg` (if created)

> *Explain: "A resource group is a container that holds all Azure resources for our project."*

**Step 3: Show Azure Container Registry (Optional)**
Navigate to "Container registries"

> *Explain: "Azure Container Registry stores our Docker images. It's like Docker Hub but hosted on Azure."*

**Step 4: Deployment Architecture (Diagram/Slides)**
Show/draw this architecture:

```
[Git Push] → [Jenkins] → [Docker Build] → [ACR] → [Azure Container Instances]
                                                         │
                                                    ┌────┴────┐
                                                    │ Backend │
                                                    │ Frontend│
                                                    └─────────┘
```

> *Explain: "When code is pushed to Git, Jenkins triggers the pipeline which builds Docker images, pushes them to Azure Container Registry, and deploys to Azure Container Instances — making the app accessible via a public URL."*

**Step 5: Show Deployment Commands (from README)**
```powershell
# Login to Azure
az login

# Create Container Registry
az acr create --resource-group devflow-rg --name devflowregistry --sku Basic

# Deploy containers
az container create --resource-group devflow-rg --name devflow-backend --image devflowregistry.azurecr.io/devflow-backend:latest --ports 5000
```

> *Explain: "With just a few Azure CLI commands, we can deploy our containers to the cloud."*

### ✅ Key Points to Emphasize:
- Azure free tier usage
- Integration with Jenkins pipeline
- Container deployment vs VM deployment
- Scalability benefits
- Cost-effective (pay only for what you use)

---

## 🗣️ Part 6: Live Demo - Running the Application

### Show the Full Application Working:

**1. Open DevFlow** → `http://localhost:5173`

**2. Register a new account**
- Username: `demouser`
- Email: `demo@example.com`
- Password: `demo123`

> *Show the beautiful login/register UI*

**3. Dashboard**
> *Show the stats cards, recent builds, and recent tasks*

**4. Create Tasks**
- Create a task: "Fix login page bug" - Priority: High
- Create a task: "Add user profile page" - Priority: Medium
- Create a task: "Update dependencies" - Priority: Low

> *Show filtering by status, changing status, and deleting tasks*

**5. Trigger a Build**
- Go to Builds page
- Select branch: `main`
- Click "Trigger Build"
- Watch the build status change in real-time

> *Highlight the WebSocket real-time updates*

**6. Show Build Logs**
> *Click on a completed build to show the logs*

---

## ❓ Part 7: Viva Questions & Answers (Azure + DevOps)

### Common Questions Your Teacher Might Ask:

**Q1: What is DevOps?**
> "DevOps is a set of practices that combines software development (Dev) and IT operations (Ops). It aims to shorten the development lifecycle while delivering features, fixes, and updates frequently in alignment with business objectives."

**Q2: What is Docker?**
> "Docker is a containerization platform that packages applications and their dependencies into lightweight, portable containers. Unlike VMs, containers share the host OS kernel, making them faster and more efficient."

**Q3: Difference between Docker and VM?**
> "Docker containers share the host OS kernel and are lightweight (MBs), starting in seconds. VMs include a full guest OS and are heavier (GBs), taking minutes to start."

**Q4: What is Jenkins?**
> "Jenkins is an open-source automation server used for CI/CD. It automates building, testing, and deploying code. We use a declarative pipeline defined in a Jenkinsfile."

**Q5: What is CI/CD?**
> "CI (Continuous Integration) automatically builds and tests code changes. CD (Continuous Delivery/Deployment) automatically deploys the tested code to production."

**Q6: What is Azure used for?**
> "Azure is a cloud computing platform. We use Azure Container Instances to deploy our Docker containers without managing servers. Azure Container Registry stores our Docker images."

**Q7: How did you integrate Git with Jenkins?**
> "Jenkins polls the Git repository for changes (or uses webhooks). When changes are detected, it automatically triggers the pipeline defined in the Jenkinsfile."

**Q8: Explain your Docker architecture?**
> "We have two containers — backend and frontend — connected via a Docker network. The frontend uses Nginx to serve static files and proxy API requests to the backend. Data persists using Docker volumes."

**Q9: What are the benefits of containerization?**
> "Consistency across environments, faster deployment, scalability, resource efficiency, and isolation."

**Q10: How would you scale this application?**
> "I would use Docker Swarm or Kubernetes for orchestration, allowing multiple container instances across multiple hosts with load balancing."

---

## 📦 Project File Structure Reference

```
Devops lab demo/
├── backend/
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js            # Login/register routes
│   │   ├── tasks.js           # Task CRUD routes
│   │   └── builds.js          # Build pipeline routes
│   ├── database.js            # SQLite database setup
│   ├── package.json           # Backend dependencies
│   └── server.js              # Express server with WebSocket
├── frontend/
│   ├── src/
│   │   ├── utils/
│   │   │   └── api.js         # API client helper
│   │   ├── App.jsx            # Main React app with all pages
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # TailwindCSS import
│   ├── index.html             # HTML entry
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite config with API proxy
├── Dockerfile.backend         # Backend Docker image
├── Dockerfile.frontend        # Frontend Docker image
├── docker-compose.yml         # Multi-container orchestration
├── Jenkinsfile                # CI/CD pipeline definition
├── README.md                  # Project documentation
├── PROJECT_DEMO.md            # This demo guide
└── .gitignore                 # Git ignore rules
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Docker not found | Run `$env:Path += ";C:\Program Files\Docker\Docker\resources"` |
| Port already in use | Change port in `server.js` or `vite.config.js` |
| Jenkins won't start | Check Java: `java -version` (needs Java 11+) |
| SQLite errors | Delete `backend/devflow.db` and restart backend |
| Frontend can't reach API | Ensure backend is running on port 5000 |
| Docker build fails | Make sure Docker Desktop is running |

---

### 🎯 Demo Checklist

Before the demo, verify:
- [ ] Backend running (`http://localhost:5000/api/health`)
- [ ] Frontend running (`http://localhost:5173`)
- [ ] Docker Desktop running
- [ ] Jenkins running (`http://localhost:8080`)
- [ ] Git repository initialized
- [ ] Sample data (1-2 users, 3-4 tasks, 2-3 builds)
- [ ] Presentation slides ready (optional)
- [ ] This demo guide accessible

---

**Good luck with your demo! 🚀**
