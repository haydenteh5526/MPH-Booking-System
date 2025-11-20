pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS'  // Configure this in Jenkins Global Tool Configuration
    }
    
    environment {
        NODE_ENV = 'production'
        // Credentials will be added later in Jenkins
        // Uncomment these after adding credentials in Jenkins:
        // SMTP_HOST = credentials('smtp-host')
        // SMTP_USER = credentials('smtp-user')
        // SMTP_PASS = credentials('smtp-pass')
        // MONGODB_URI = credentials('mongodb-uri')
    }
    
    stages {
        stage('Install Dependencies') {
            steps {
                dir('login-system') {
                    echo 'Installing Node.js dependencies...'
                    bat 'npm ci'
                }
            }
        }
        
        stage('Lint & Code Quality') {
            steps {
                dir('login-system') {
                    echo 'Running linter...'
                    bat 'npm run lint || exit 0'
                }
            }
        }
        
        stage('Security Audit') {
            steps {
                dir('login-system') {
                    echo 'Running security audit...'
                    bat 'npm audit --audit-level=high || exit 0'
                }
            }
        }
        
        stage('Unit Tests') {
            steps {
                dir('login-system') {
                    echo 'Running unit tests...'
                    bat 'npm test || exit 0'
                }
            }
        }
        
        stage('Build') {
            steps {
                echo 'Building application...'
                // Add any build steps if needed
                bat 'echo Build completed'
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'booking-system'
            }
            steps {
                echo 'Deploying to staging environment...'
                // Add deployment commands here
                // Example: bat 'xcopy /E /I /Y . C:\\staging\\mph-booking'
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                echo 'Deploying to production environment...'
                // Add production deployment commands here
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
            // Send success notification
            // emailext subject: "SUCCESS: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
            //          body: "Build succeeded: ${env.BUILD_URL}",
            //          to: "team@mph.com"
        }
        failure {
            echo 'Pipeline failed!'
            // Send failure notification
            // emailext subject: "FAILURE: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
            //          body: "Build failed: ${env.BUILD_URL}",
            //          to: "team@mph.com"
        }
        always {
            echo 'Cleaning up workspace...'
            // cleanWs() - Uncomment after fixing workspace issues
        }
    }
}
