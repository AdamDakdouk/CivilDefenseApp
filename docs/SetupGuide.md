# Setup Guide - Civil Defense Management System

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Backend Installation](#backend-installation)
5. [Frontend Installation](#frontend-installation)
6. [Email Configuration](#email-configuration)
7. [Deployment](#deployment)
8. [Initial Setup](#initial-setup)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Download Link |
|----------|----------------|-------------|---------------|
| Node.js | 18.0.0 | 18.17.0 or higher | [nodejs.org](https://nodejs.org/) |
| npm | 9.0.0 | Latest | Included with Node.js |
| Git | 2.30.0 | Latest | [git-scm.com](https://git-scm.com/) |
| MongoDB | 6.0 | Atlas (Cloud) | [mongodb.com/atlas](https://www.mongodb.com/atlas) |

### Optional Software

| Software | Purpose | Download Link |
|----------|---------|---------------|
| VS Code | Code editor | [code.visualstudio.com](https://code.visualstudio.com/) |
| Postman | API testing | [postman.com](https://www.postman.com/) |
| MongoDB Compass | Database GUI | [mongodb.com/compass](https://www.mongodb.com/products/compass) |

### System Requirements

**Minimum**:
- OS: Windows 10, macOS 10.15, or Linux
- RAM: 4 GB
- Storage: 1 GB free space

**Recommended**:
- OS: Latest stable OS version
- RAM: 8 GB or more
- Storage: 5 GB free space
- Internet: Stable connection for cloud services

---

## Environment Setup

### 1. Verify Node.js Installation

```bash
# Check Node.js version
node --version
# Expected output: v18.x.x or higher

# Check npm version
npm --version
# Expected output: 9.x.x or higher
```

If Node.js is not installed:
1. Download installer from [nodejs.org](https://nodejs.org/)
2. Run installer and follow instructions
3. Restart terminal
4. Verify installation with commands above

### 2. Verify Git Installation

```bash
# Check Git version
git --version
# Expected output: git version 2.x.x or higher
```

If Git is not installed:
1. Download from [git-scm.com](https://git-scm.com/)
2. Run installer with default settings
3. Restart terminal
4. Verify installation

### 3. Clone Repository

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd civil-defense-management-system

# Verify structure
ls
# Expected: backend/ frontend/ README.md
```

---

## Database Configuration

### Option 1: MongoDB Atlas (Recommended)

#### Step 1: Create Atlas Account

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Click "Start Free"
3. Sign up with email or Google account
4. Verify email address

#### Step 2: Create a Cluster

1. Click "Build a Cluster"
2. Choose "Shared" (Free tier)
3. Select cloud provider:
   - **Recommended**: AWS or Google Cloud
   - **Region**: Europe (Frankfurt) - closest to Lebanon
4. Cluster name: `civil-defense-cluster`
5. Click "Create Cluster"
6. Wait 3-5 minutes for cluster creation

#### Step 3: Create Database User

1. Go to "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Authentication Method: Password
4. Username: `civildefense-admin`
5. Password: Generate strong password or create custom
   - **Important**: Save this password securely!
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

#### Step 4: Configure Network Access

1. Go to "Network Access" (left sidebar)
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere"
   - Adds `0.0.0.0/0` to whitelist
   - **Note**: For production, use specific IP addresses
4. Click "Confirm"

#### Step 5: Get Connection String

1. Go to "Databases" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: Node.js
5. Version: 4.1 or later
6. Copy the connection string:
```
mongodb+srv://civildefense-admin:<password>@civil-defense-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
7. Replace `<password>` with your actual password
8. Add database name after `.net/`:
```
mongodb+srv://civildefense-admin:yourpassword@civil-defense-cluster.xxxxx.mongodb.net/civil-defense?retryWrites=true&w=majority
```

### Option 2: Local MongoDB

If you prefer local development:

```bash
# Install MongoDB Community Edition
# For macOS:
brew tap mongodb/brew
brew install mongodb-community

# For Ubuntu:
sudo apt-get install mongodb

# For Windows:
# Download installer from mongodb.com

# Start MongoDB service
# macOS:
brew services start mongodb-community

# Ubuntu:
sudo systemctl start mongodb

# Connection string for local:
mongodb://localhost:27017/civil-defense
```

---

## Backend Installation

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- express (web framework)
- mongoose (MongoDB ODM)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- cors (cross-origin support)
- dotenv (environment variables)
- mailgun.js (email service)
- And other dependencies...

### Step 3: Create Environment File

```bash
# Create .env file
touch .env

# Or on Windows:
type nul > .env
```

### Step 4: Configure Environment Variables

Open `.env` in your text editor and add:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://civildefense-admin:yourpassword@civil-defense-cluster.xxxxx.mongodb.net/civil-defense?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (generate a random 32+ character string)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Mailgun Configuration (optional for development)
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-domain.com

# CORS (optional, defaults to allow all)
CORS_ORIGIN=http://localhost:3000
```

**Generate JWT Secret**:
```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Or use any random string generator online
```

### Step 5: Create Admin Account

```bash
# Run the admin creation script
npm run create-admin
```

Follow the prompts:
```
Enter admin email: admin@civildefense.online
Enter admin password: [your secure password]
Enter admin name: Station Administrator
```

**Output**:
```
✅ Admin created successfully!
Email: admin@civildefense.online
You can now login with these credentials.
```

### Step 6: Start Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# Or production mode
npm start
```

**Expected output**:
```
🚀 Server running on port 5000
📊 MongoDB connected: civil-defense-cluster-shard-00-00.xxxxx.mongodb.net
```

### Step 7: Verify Backend is Running

Open a new terminal and test:

```bash
# Test health check
curl http://localhost:5000/

# Expected response:
{"message":"Civil Defense API is running"}

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@civildefense.online","password":"your-password"}'

# Expected: JWT token in response
```

---

## Frontend Installation

### Step 1: Navigate to Frontend Directory

```bash
# From project root
cd frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- react (UI framework)
- react-router-dom (routing)
- axios (HTTP client)
- And other dependencies...

### Step 3: Create Environment File

```bash
# Create .env file
touch .env

# Or on Windows:
type nul > .env
```

### Step 4: Configure Environment Variables

Open `.env` and add:

```env
# API Base URL
REACT_APP_API_URL=http://localhost:5000/api

# Environment
REACT_APP_ENV=development
```

### Step 5: Start Frontend Server

```bash
# Development mode
npm start
```

**Expected output**:
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000
```

### Step 6: Access Application

1. Open browser
2. Navigate to `http://localhost:3000`
3. You should see the login page
4. Login with admin credentials created earlier

---

## Email Configuration

### Setting up Mailgun (for Password Reset)

#### Step 1: Create Mailgun Account

1. Go to [mailgun.com](https://www.mailgun.com/)
2. Sign up for free account
3. Verify email address

#### Step 2: Add Your Domain

1. Go to "Sending" → "Domains"
2. Click "Add New Domain"
3. Enter your domain (e.g., `civildefense.online`)
4. Click "Add Domain"

#### Step 3: Configure DNS Records

Mailgun will provide DNS records to add to your domain:

```
Type    Host                    Value                           Priority
MX      @                       mxa.mailgun.org                 10
MX      @                       mxb.mailgun.org                 10
TXT     @                       v=spf1 include:mailgun.org ~all
TXT     mail._domainkey         [DKIM key provided by Mailgun]
CNAME   email.yourdomain.com    mailgun.org
```

**To add DNS records**:
1. Login to your domain registrar (Namecheap, GoDaddy, etc.)
2. Go to DNS management
3. Add each record as shown above
4. Wait 24-48 hours for DNS propagation
5. Return to Mailgun and click "Verify DNS Settings"

#### Step 4: Get API Key

1. Go to "Settings" → "API Keys"
2. Copy your "Private API key"
3. Update backend `.env` file:
```env
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=civildefense.online
```

#### Step 5: Test Email

```bash
# Restart backend server
# Try password reset flow
# Check email delivery
```

### Email Not Working?

For development, you can skip email configuration. Password reset codes will be logged to console:

```javascript
// In backend logs:
Reset code for admin@civildefense.online: 123456
```

---

## Deployment

### Backend Deployment (Render.com)

#### Step 1: Create Render Account

1. Go to [render.com](https://render.com/)
2. Sign up with GitHub account

#### Step 2: Create New Web Service

1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Configure service:
   - **Name**: `civil-defense-backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

#### Step 3: Add Environment Variables

In Render dashboard, add all environment variables from backend `.env`:

```
MONGODB_URI = mongodb+srv://...
JWT_SECRET = your-jwt-secret
MAILGUN_API_KEY = your-mailgun-key
MAILGUN_DOMAIN = your-domain.com
NODE_ENV = production
```

#### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for build and deployment (5-10 minutes)
3. Note your backend URL: `https://civil-defense-backend.onrender.com`

### Frontend Deployment (Netlify)

#### Step 1: Create Netlify Account

1. Go to [netlify.com](https://www.netlify.com/)
2. Sign up with GitHub account

#### Step 2: Deploy from GitHub

1. Click "New site from Git"
2. Choose GitHub
3. Select repository
4. Configure build:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`

#### Step 3: Add Environment Variables

In Netlify dashboard → Site settings → Build & deploy → Environment:

```
REACT_APP_API_URL = https://civil-defense-backend.onrender.com/api
REACT_APP_ENV = production
```

#### Step 4: Deploy

1. Click "Deploy site"
2. Wait for build (3-5 minutes)
3. Access your site: `https://your-site-name.netlify.app`

#### Step 5: Custom Domain (Optional)

1. Go to "Domain settings"
2. Click "Add custom domain"
3. Enter your domain
4. Follow DNS configuration instructions

---

## Initial Setup

### Step 1: Login as Admin

1. Access application
2. Login with admin credentials
3. Verify dashboard loads

### Step 2: Create Initial Users

1. Navigate to "Users" page
2. Click "Add New User"
3. Create test users for each role:
   - 1 volunteer (Team 1)
   - 1 employee (Team 2)
   - 1 head staff (Team 3)
   - 1 admin staff (Team 1)

### Step 3: Create Sample Shift

1. Navigate to "Shifts" page
2. Click "Add New Shift"
3. Select today's date
4. Choose Team 1
5. Add participants
6. Save shift

### Step 4: Create Sample Mission

1. Navigate to "Missions" page
2. Click "Add New Mission"
3. Fill in mission details:
   - Vehicle: 101
   - Type: Fire
   - Location: Test location
   - Start/End times
4. Add participants
5. Save mission

### Step 5: Verify Dashboard

1. Navigate to "Dashboard"
2. Verify statistics display correctly
3. Check charts and graphs render
4. Confirm data matches your entries

### Step 6: Test Month Selector

1. In navbar, click month dropdown
2. Should show current month
3. Create archived data by:
   - Manually inserting MonthlyReport in database, OR
   - Waiting until end of month and running rollover

---

## Troubleshooting

### Issue: Cannot Connect to MongoDB

**Symptoms**:
```
MongooseError: connect ECONNREFUSED
```

**Solutions**:
1. Verify `MONGODB_URI` in `.env` is correct
2. Check MongoDB Atlas IP whitelist includes your IP
3. Verify username/password in connection string
4. Test connection with MongoDB Compass

**Test Connection**:
```bash
# Install MongoDB Compass
# Enter connection string
# Click "Connect"
```

### Issue: Backend Port Already in Use

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions**:

**Option 1**: Kill process on port 5000
```bash
# On macOS/Linux:
lsof -ti:5000 | xargs kill -9

# On Windows:
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F
```

**Option 2**: Use different port
```env
# In backend/.env
PORT=5001
```

### Issue: CORS Error in Frontend

**Symptoms**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions**:
1. Verify backend is running
2. Check `REACT_APP_API_URL` in frontend `.env`
3. Verify backend CORS configuration:
```javascript
// In backend/src/server.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
```

### Issue: JWT Token Invalid

**Symptoms**:
```
401 Unauthorized: Invalid token
```

**Solutions**:
1. Logout and login again
2. Check `JWT_SECRET` matches in backend `.env`
3. Verify token expiration (default 7 days)
4. Clear browser localStorage:
```javascript
// In browser console:
localStorage.clear();
```

### Issue: Mailgun Email Not Sending

**Symptoms**:
```
Email sending failed
```

**Solutions**:
1. Verify `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` in `.env`
2. Check Mailgun dashboard for failed sends
3. Verify DNS records configured correctly
4. Check spam folder
5. For development, check backend console logs for reset code

### Issue: Frontend Build Fails

**Symptoms**:
```
npm run build failed
```

**Solutions**:
1. Delete `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

2. Clear npm cache:
```bash
npm cache clean --force
```

3. Check for TypeScript errors:
```bash
npm run build
# Fix any errors shown
```

### Issue: Dashboard Not Loading

**Symptoms**:
- Blank dashboard
- Console errors

**Solutions**:
1. Check browser console for errors
2. Verify backend is running and accessible
3. Check network tab for failed API calls
4. Verify user has data (shifts/missions)
5. Check MongoDB for Settings document:
```javascript
// In MongoDB Compass or shell:
db.settings.findOne()
// Should return: { activeMonth: X, activeYear: YYYY }
```

### Issue: Month Rollover Fails

**Symptoms**:
```
Month rollover failed: transaction aborted
```

**Solutions**:
1. Check all users have valid data
2. Verify MongoDB supports transactions (requires replica set)
3. Check backend logs for specific error
4. For MongoDB Atlas, ensure cluster tier supports transactions
5. Manual rollover if needed:
```javascript
// Contact developer for manual rollover script
```

---

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- **Backend**: Uses `nodemon` - auto-restarts on file changes
- **Frontend**: Uses React's built-in hot reload

### Debugging

**Backend**:
```javascript
// Add console.logs
console.log('Debug info:', variable);

// Or use VS Code debugger
// Create .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "program": "${workspaceFolder}/backend/src/server.ts",
  "preLaunchTask": "npm: dev"
}
```

**Frontend**:
```javascript
// Use React DevTools browser extension
// Add console.logs
console.log('Component state:', state);

// Use debugger statement
debugger; // Pauses execution in DevTools
```

### Database GUI

Use MongoDB Compass for visual database management:
1. Install Compass
2. Connect with MongoDB URI
3. Browse collections
4. Run queries
5. Update documents manually

---

## Next Steps

After successful setup:

1. **Customize Application**
   - Update branding/logo
   - Modify color scheme
   - Add organization-specific features

2. **Configure Backup Strategy**
   - Set up MongoDB Atlas automated backups
   - Create manual backup scripts
   - Test restore procedures

3. **Set Up Monitoring**
   - Configure error tracking (Sentry)
   - Set up uptime monitoring
   - Enable performance monitoring

4. **Security Hardening**
   - Enable HTTPS
   - Configure IP whitelisting
   - Set up rate limiting
   - Regular security audits

5. **User Training**
   - Create user documentation
   - Conduct training sessions
   - Establish support channels

---

## Support

For help with setup:

- **Developer**: Adam Dakdouk
- **Email**: adamdakdouk2003@gmail.com
- **LinkedIn**: [linkedin.com/in/adamdakdouk](https://www.linkedin.com/in/adamdakdouk/)

---

## Appendix: Useful Commands

```bash
# Backend Commands
npm install              # Install dependencies
npm run dev             # Start development server
npm start               # Start production server
npm run build           # Build TypeScript
npm run create-admin    # Create admin user

# Frontend Commands
npm install              # Install dependencies
npm start               # Start development server
npm run build           # Build for production
npm test                # Run tests

# Git Commands
git status              # Check status
git add .               # Stage changes
git commit -m "message" # Commit changes
git push origin main    # Push to remote
git pull origin main    # Pull from remote

# MongoDB Commands (if local)
mongod                  # Start MongoDB server
mongo                   # Open MongoDB shell
mongodump               # Backup database
mongorestore            # Restore database
```

---

**Document Version**: 1.0.0  
**Last Updated**: November 2025