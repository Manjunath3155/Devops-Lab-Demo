// DevFlow CI/CD Pipeline
// GitHub: https://github.com/Manjunath3155/Devops-Lab-Demo
// Docker Hub: manjunathpatil3155
//
// Pipeline job setup:
//   New Item → Pipeline → Pipeline script from SCM → Git
//   Repository URL: https://github.com/Manjunath3155/Devops-Lab-Demo.git
//   Script Path: Jenkinsfile
//   Build Triggers: Poll SCM → H/2 * * * *

pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = 'manjunathpatil3155'
        DOCKER_HUB_REPO_BACKEND  = 'manjunathpatil3155/devflow-backend'
        DOCKER_HUB_REPO_FRONTEND = 'manjunathpatil3155/devflow-frontend'
        // Full path to docker.exe on this Windows machine
        DOCKER_CMD = '"C:/Program Files/Docker/Docker/resources/bin/docker"'
        IMAGE_TAG  = "latest"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    triggers {
        pollSCM('H/2 * * * *')
    }

    stages {

        // ── Stage 1: Checkout ──────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    echo "Branch : ${env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'main'}"
                    echo "Commit : ${env.GIT_COMMIT?.take(7) ?: 'unknown'}"
                    echo "Workspace: ${env.WORKSPACE}"
                }
            }
        }

        // ── Stage 2: Git Version Info ──────────────────────────────
        stage('Git Version') {
            steps {
                bat 'git --version'
                bat 'git log --oneline -5'
                bat 'git branch -a'
            }
        }

        // ── Stage 3: OWASP Dependency-Check ───────────────────────
        stage('OWASP Dependency-Check') {
            steps {
                // Create output directory
                bat 'if not exist dependency-check-report mkdir dependency-check-report'
                // Run scan — catchError so OWASP never blocks the build
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    dependencyCheck(
                        additionalArguments: '--scan backend --scan frontend --format HTML --format XML --out dependency-check-report',
                        odcInstallation: 'dependency-check'
                    )
                }
            }
            post {
                always {
                    // Publish the report so it appears in Jenkins UI
                    catchError(buildResult: 'SUCCESS', stageResult: 'SUCCESS') {
                        dependencyCheckPublisher pattern: 'dependency-check-report/dependency-check-report.xml'
                    }
                }
            }
        }

        // ── Stage 4: Code Quality — SonarQube ─────────────────────
        stage('Code Quality (SonarQube)') {
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    withSonarQubeEnv('SonarQube') {
                        bat '''
                            sonar-scanner ^
                            -Dsonar.projectKey=devflow ^
                            -Dsonar.projectName="DevFlow" ^
                            -Dsonar.sources=backend,frontend/src ^
                            -Dsonar.host.url=http://localhost:9000 ^
                            -Dsonar.login=admin
                        '''
                    }
                }
            }
        }

        // ── Stage 5: Build Docker Images ──────────────────────────
        stage('Build Docker Images') {
            steps {
                script {
                    echo 'Building backend Docker image...'
                    bat "${DOCKER_CMD} build -f Dockerfile.backend -t ${DOCKER_HUB_REPO_BACKEND}:${IMAGE_TAG} ."
                    echo 'Building frontend Docker image...'
                    bat "${DOCKER_CMD} build -f Dockerfile.frontend -t ${DOCKER_HUB_REPO_FRONTEND}:${IMAGE_TAG} ."
                    echo 'Docker images built successfully!'
                }
            }
        }

        // ── Stage 6: Push to Docker Hub ───────────────────────────
        stage('Push to Docker Hub') {
            steps {
                script {
                    // Uses Jenkins credential 'dockerhub-credentials'
                    withCredentials([usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        bat "${DOCKER_CMD} login -u %DOCKER_USER% -p %DOCKER_PASS%"
                        bat "${DOCKER_CMD} push ${DOCKER_HUB_REPO_BACKEND}:${IMAGE_TAG}"
                        bat "${DOCKER_CMD} push ${DOCKER_HUB_REPO_FRONTEND}:${IMAGE_TAG}"
                        bat "${DOCKER_CMD} logout"
                    }
                    echo "Images pushed to Docker Hub: https://hub.docker.com/u/${DOCKER_HUB_USER}"
                }
            }
        }

        // ── Stage 7: Deploy (docker compose) ──────────────────────
        stage('Deploy') {
            steps {
                script {
                    echo 'Starting DevFlow containers...'
                    bat "${DOCKER_CMD} compose up -d --force-recreate"
                    echo 'DevFlow is running at http://localhost'
                }
            }
        }

    }

    post {
        always {
            echo 'Pipeline finished.'
        }
        success {
            echo 'SUCCESS — DevFlow pipeline completed! Images on Docker Hub. App live at http://localhost'
        }
        failure {
            echo 'FAILURE — Check the stage that turned red and fix it.'
        }
        unstable {
            echo 'UNSTABLE — Build passed but OWASP or SonarQube found issues. Check reports.'
        }
    }
}
