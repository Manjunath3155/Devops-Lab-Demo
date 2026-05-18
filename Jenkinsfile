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
        STAGING_DIR = 'C:/devflow-build'
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

        stage('Build Docker Images') {
            steps {
                script {
                    // Copy workspace to a path without spaces (Docker Desktop on Windows
                    // fails when the project path contains spaces)
                    echo 'Copying workspace to staging directory...'
                    bat """
                        if exist "${STAGING_DIR}" rmdir /s /q "${STAGING_DIR}"
                        mkdir "${STAGING_DIR}"
                        xcopy /e /i /h /q "${WORKSPACE}\\*" "${STAGING_DIR}"
                    """

                    bat "if exist \"${STAGING_DIR}\\backend\\node_modules\" rmdir /s /q \"${STAGING_DIR}\\backend\\node_modules\""
                    bat "if exist \"${STAGING_DIR}\\frontend\\node_modules\" rmdir /s /q \"${STAGING_DIR}\\frontend\\node_modules\""
                    bat "if exist \"${STAGING_DIR}\\.git\" rmdir /s /q \"${STAGING_DIR}\\.git\""

                    dir(env.STAGING_DIR) {
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
                    dir(env.STAGING_DIR) {
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
            echo 'Cleaning up staging directory...'
            bat "if exist \"${STAGING_DIR}\" rmdir /s /q \"${STAGING_DIR}\""
        }
        success {
            echo 'Pipeline completed successfully! DevFlow is live!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}
