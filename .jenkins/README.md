# Jenkins CI/CD Setup Guide for MPH Booking System

## Prerequisites
- Jenkins installed (version 2.400+)
- Git installed
- Node.js 18+ installed
- MongoDB accessible

## Setup Instructions

### 1. Install Jenkins Plugins
Go to `Manage Jenkins` → `Manage Plugins` → `Available plugins`:
- [x] NodeJS Plugin
- [x] Git Plugin
- [x] Pipeline Plugin
- [x] GitHub Integration Plugin
- [x] Email Extension Plugin
- [x] Blue Ocean (optional, for better UI)

### 2. Configure Global Tools
Go to `Manage Jenkins` → `Global Tool Configuration`:

**NodeJS Installation:**
- Name: `NodeJS`
- Install automatically: ✓
- Version: Latest LTS (18.x or 20.x)

**Git Installation:**
- Name: `Default`
- Path: `C:\Program Files\Git\bin\git.exe` (Windows)

### 3. Add Credentials
Go to `Manage Jenkins` → `Manage Credentials` → `(global)` → `Add Credentials`:

1. **SMTP Host**
   - Kind: Secret text
   - ID: `smtp-host`
   - Secret: Your SMTP host

2. **SMTP User**
   - Kind: Secret text
   - ID: `smtp-user`
   - Secret: Your SMTP username

3. **SMTP Password**
   - Kind: Secret text
   - ID: `smtp-pass`
   - Secret: Your SMTP password

4. **MongoDB URI**
   - Kind: Secret text
   - ID: `mongodb-uri`
   - Secret: mongodb://localhost:27017/mph-booking

5. **GitHub Credentials (if private repo)**
   - Kind: Username with password
   - ID: `github-credentials`
   - Username: haydenteh5526
   - Password: Your GitHub token

### 4. Create Pipeline Job

1. Click `New Item`
2. Name: `MPH-Booking-System`
3. Type: `Pipeline`
4. Click `OK`

**General Configuration:**
- Description: MPH Booking System CI/CD Pipeline
- GitHub project: ✓
  - Project url: https://github.com/haydenteh5526/MPH-Booking-System/

**Build Triggers:**
- [x] GitHub hook trigger for GITScm polling
- [x] Poll SCM: `H/5 * * * *` (every 5 minutes)

**Pipeline Configuration:**
- Definition: `Pipeline script from SCM`
- SCM: `Git`
- Repository URL: `https://github.com/haydenteh5526/MPH-Booking-System.git`
- Credentials: Select your GitHub credentials (if private)
- Branch Specifier: `*/booking-system`
- Script Path: `Jenkinsfile`

### 5. Configure GitHub Webhook (Optional)

In your GitHub repository:
1. Go to `Settings` → `Webhooks` → `Add webhook`
2. Payload URL: `http://your-jenkins-url:8080/github-webhook/`
3. Content type: `application/json`
4. Events: Select `Just the push event`
5. Active: ✓

### 6. Environment Variables

Create a `.env.jenkins` file (not committed to Git) with:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mph-booking
SESSION_SECRET=your-session-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=noreply@mph-booking.com
ALLOWED_EMAIL_DOMAIN=student.tus.ie
```

### 7. Test the Pipeline

1. Click `Build Now` in your Jenkins job
2. Monitor the build progress in `Console Output`
3. Check each stage completes successfully

### 8. Common Issues & Solutions

**Issue: Node/npm not found**
- Solution: Configure NodeJS in Global Tool Configuration

**Issue: MongoDB connection failed**
- Solution: Ensure MongoDB is running and URI is correct

**Issue: Git authentication failed**
- Solution: Add GitHub credentials in Jenkins

**Issue: Permission denied on Windows**
- Solution: Run Jenkins as Administrator

## Pipeline Stages

The Jenkinsfile includes these stages:

1. **Checkout** - Pull latest code from Git
2. **Install Dependencies** - Run `npm ci`
3. **Lint & Code Quality** - Run linting
4. **Security Audit** - Run `npm audit`
5. **Unit Tests** - Run test suite
6. **Build** - Build the application
7. **Deploy to Staging** - Auto-deploy on `booking-system` branch
8. **Deploy to Production** - Manual approval for `main` branch

## Monitoring

- View build history in Jenkins dashboard
- Check console output for detailed logs
- Set up email notifications for build status
- Use Blue Ocean for visual pipeline view

## Next Steps

1. Add actual test suite (replace placeholder)
2. Configure ESLint for code quality
3. Set up proper staging/production servers
4. Configure email notifications
5. Add SonarQube for code analysis (optional)
6. Set up artifact archiving
