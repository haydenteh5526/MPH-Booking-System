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
- Version: Latest LTS

**Git Installation:**
- Name: `Default`
- Path: `C:\Program Files\Git\bin\git.exe` (Windows)

### 3. Add Credentials
Go to `Manage Jenkins` → `Manage Credentials` → `(global)` → `Add Credentials`:

1. **SMTP Host**
   - Kind: Secret text
   - ID: `smtp-host`
   - Secret: `smtp.sendgrid.net`

2. **SMTP User**
   - Kind: Secret text
   - ID: `smtp-user`
   - Secret: `apikey` (SendGrid uses "apikey" as literal username)

3. **SMTP Password**
   - Kind: Secret text
   - ID: `smtp-pass`
   - Secret: Your SendGrid API key (starts with SG.)

4. **MongoDB URI**
   - Kind: Secret text
   - ID: `mongodb-uri`
   - Secret: Your MongoDB Atlas connection string

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
- Branch Specifier: `*/main`
- Script Path: `Jenkinsfile`

### 5. Test the Pipeline

1. Click `Build Now` in your Jenkins job
2. Monitor the build progress in `Console Output`
3. Check each stage completes successfully

### 6. Common Issues & Solutions

**Issue: Node/npm not found**
- Solution: Configure NodeJS in Global Tool Configuration

**Issue: MongoDB connection failed**
- Solution: Verify MongoDB Atlas URI and network access settings

**Issue: Git authentication failed (port 443 blocked)**
- Solution: Add Windows Firewall rule for Jenkins Java process (see Windows Firewall Configuration section)

**Issue: Jest cannot find supertest**
- Solution: Ensure devDependencies are installed with `npm ci` (not `npm install`)

**Issue: Permission denied on Windows**
- Solution: Run Jenkins as Administrator

## Pipeline Stages

The Jenkinsfile includes these stages:

1. **Install Dependencies** - Run `npm ci`
2. **Lint & Code Quality** - Run linting (placeholder for ESLint)

3. **Security Updates**
   - Nodemailer updated to 7.0.10 (fixed vulnerability)
   - No security issues in dependencies

4. **Build** - Build the application
5. **Deploy to Staging** - Auto-deploy on development branches
6. **Deploy to Production** - Manual approval for `main` branch

## Windows Firewall Configuration

If Jenkins cannot connect to GitHub, add a firewall rule:

**Run as Administrator:**
```cmd
netsh advfirewall firewall add rule name="Jenkins HTTPS Outbound" dir=out action=allow protocol=TCP remoteport=443 program="C:\Program Files\Java\jdk-21\bin\java.exe"
```

Replace the Java path with your Jenkins Java installation:
- Find in Jenkins: `Manage Jenkins` → `System Information` → `java.home`
- The program path: `[java.home]\bin\java.exe`

## Monitoring

- View build history in Jenkins dashboard
- Check console output for detailed logs
- Set up email notifications for build status
- Use Blue Ocean for visual pipeline view

## Next Steps

1. Write real integration tests (replace placeholder tests in `tests/api.test.js`)
2. Configure ESLint for code quality enforcement
3. Set up proper staging/production deployment servers
4. Configure email notifications for build failures
5. Add SonarQube for advanced code analysis (optional)
6. Consider GitHub webhooks for instant builds instead of SCM polling

## Project Features Included

- **Authentication System**
  - Email verification with SendGrid
  - Email-based 2FA (6-digit codes, 10-minute expiry)
  - Remember Me functionality
  - Password visibility toggle
  - Account lockout after failed attempts

- **Security Features**
  - Helmet.js for security headers
  - Session management with MongoDB
  - HTTPS-ready configuration
  - Updated dependencies (no vulnerabilities)

- **CI/CD Pipeline**
  - Automated builds on push to main
  - Security auditing
  - Test coverage reporting
  - Environment variable management via Jenkins credentials
