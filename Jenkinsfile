pipeline {
    agent any

    tools {
        nodejs 'NodeJS-22'
    }

    environment {
        DOCKER_IMAGE_BACKEND = 'devflow-backend'
        DOCKER_IMAGE_FRONTEND = 'devflow-frontend'
        DOCKER_REGISTRY = 'your-dockerhub-username'  // Change this to your Docker Hub username
        AZURE_WEBAPP_NAME = 'devflow-app'            // Change this to your Azure app name
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/your-username/devflow.git',
                    credentialsId: 'github-credentials'
                
                echo "Checked out branch: ${env.BRANCH_NAME}"
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend Install') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Install') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        stage('Lint & Test') {
            parallel {
                stage('Backend Lint') {
                    steps {
                        dir('backend') {
                            echo 'Linting backend code...'
                            // Add linting if eslint is configured
                            // sh 'npm run lint'
                        }
                    }
                }
                stage('Frontend Build') {
                    steps {
                        dir('frontend') {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    // Build backend Docker image
                    sh "docker build -f Dockerfile.backend -t ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER} ."
                    sh "docker tag ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER} ${DOCKER_IMAGE_BACKEND}:latest"

                    // Build frontend Docker image
                    sh "docker build -f Dockerfile.frontend -t ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} ."
                    sh "docker tag ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} ${DOCKER_IMAGE_FRONTEND}:latest"
                }
            }
        }

        stage('Push to Registry') {
            steps {
                script {
                    // Push to Docker Hub (requires Docker Hub credentials)
                    // sh "docker tag ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER} ${DOCKER_REGISTRY}/${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}"
                    // sh "docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}"
                    // sh "docker tag ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} ${DOCKER_REGISTRY}/${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}"
                    // sh "docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}"
                    
                    echo "Docker images built successfully:"
                    echo "- ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}"
                    echo "- ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}"
                }
            }
        }

        stage('Deploy to Azure') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Deploy to Azure Container Instances or App Service
                    // Requires Azure CLI credentials configured in Jenkins
                    echo "Deploying to Azure..."
                    // sh """
                    //   az container create \
                    //     --resource-group devflow-rg \
                    //     --name devflow-backend \
                    //     --image ${DOCKER_REGISTRY}/${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER} \
                    //     --ports 5000 \
                    //     --dns-name-label devflow-backend-${BUILD_NUMBER}
                    // """
                }
            }
        }

        stage('Cleanup') {
            steps {
                script {
                    // Clean up old Docker images to save space
                    // sh 'docker system prune -f'
                    echo "Pipeline completed for Build #${BUILD_NUMBER}"
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            // Send notification (email, Slack, etc.)
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
        always {
            // Archive build artifacts
            archiveArtifacts artifacts: 'frontend/dist/**', fingerprint: true
            // Clean up workspace
            cleanWs()
        }
    }
}
