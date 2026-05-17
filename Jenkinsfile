pipeline {
    agent any

    stages {
        stage('Info') {
            steps {
                echo 'DevFlow Pipeline Started!'
                echo "Build #${env.BUILD_NUMBER} triggered successfully"
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    dir('C:/Users/Manjunath/OneDrive/Desktop/CODE/Devops lab demo') {
                        echo 'Building backend Docker image...'
                        bat '"C:/Program Files/Docker/Docker/resources/bin/docker" build -f Dockerfile.backend -t devflow-backend:latest .'
                        echo 'Building frontend Docker image...'
                        bat '"C:/Program Files/Docker/Docker/resources/bin/docker" build -f Dockerfile.frontend -t devflow-frontend:latest .'
                        echo 'Docker images built successfully!'
                    }
                }
            }
        }

        stage('Start Application') {
            steps {
                script {
                    dir('C:/Users/Manjunath/OneDrive/Desktop/CODE/Devops lab demo') {
                        echo 'Starting Docker containers...'
                        bat '"C:/Program Files/Docker/Docker/resources/bin/docker" compose up -d --force-recreate'
                        echo 'DevFlow is running at http://localhost'
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully! DevFlow is live!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}
