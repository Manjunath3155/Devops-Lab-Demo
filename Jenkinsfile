// DevFlow CI/CD — https://github.com/Manjunath3155/Devops-Lab-Demo
//
// Jenkins job setup (Multibranch Pipeline recommended for PR + push):
//   New Item → Multibranch Pipeline → Branch Sources → GitHub
//   Repository: Manjunath3155/Devops-Lab-Demo
//   Behaviours: Discover branches, Discover pull requests from origin
//   Build Configuration: by Jenkinsfile
//
// Or Pipeline job: Pipeline script from SCM → Git → URL below → Jenkinsfile
//   Enable "GitHub hook trigger for GITScm polling" under Build Triggers

pipeline {
    agent any

    environment {
        GITHUB_REPO = 'https://github.com/Manjunath3155/Devops-Lab-Demo.git'
        DOCKER_CMD = '"C:/Program Files/Docker/Docker/resources/bin/docker"'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    triggers {
        // Poll GitHub every ~2 min (fallback if webhook is not configured)
        pollSCM('H/2 * * * *')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    echo "Repository: ${env.GITHUB_REPO}"
                    echo "Branch: ${env.BRANCH_NAME ?: env.GIT_BRANCH}"
                    echo "Commit: ${env.GIT_COMMIT?.take(7)}"
                    if (env.CHANGE_ID) {
                        echo "Pull Request #${env.CHANGE_ID}: ${env.CHANGE_BRANCH} → ${env.CHANGE_TARGET}"
                    }
                }
            }
        }

        stage('Info') {
            steps {
                echo 'DevFlow Pipeline Started!'
                echo "Build #${env.BUILD_NUMBER} triggered successfully"
            }
        }

        stage('OWASP Dependency-Check') {
            steps {
                // Update the installation name if it differs in Jenkins → Manage Jenkins → Tools
                dependencyCheck additionalArguments: '--scan backend --scan frontend --format HTML --format XML --out dependency-check-report --failOnCVSS 7',
                                odcInstallation: 'dependency-check'
                dependencyCheckPublisher pattern: 'dependency-check-report/dependency-check-report.xml'
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    // Jenkins workspace has no spaces — build directly (no C:/devflow-build copy)
                    dir(env.WORKSPACE) {
                        echo 'Building backend Docker image...'
                        bat "${DOCKER_CMD} build -f Dockerfile.backend -t devflow-backend:latest ."
                        echo 'Building frontend Docker image...'
                        bat "${DOCKER_CMD} build -f Dockerfile.frontend -t devflow-frontend:latest ."
                        echo 'Docker images built successfully!'
                    }
                }
            }
        }

        stage('Start Application') {
            steps {
                script {
                    dir(env.WORKSPACE) {
                        echo 'Starting Docker containers...'
                        bat "${DOCKER_CMD} compose up -d --force-recreate"
                        echo 'DevFlow is running at http://localhost'
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
        }
        success {
            echo 'Pipeline completed successfully! DevFlow is live!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}
