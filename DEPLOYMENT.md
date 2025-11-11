# Civil Defense App - Deployment Guide

## Prerequisites
- GitHub account with the project repo pushed
- MongoDB Atlas account (already have one)
- Deployment platform account (choose one below)

---

## **Option 1: Render.com (Recommended - Free Tier)**

### Step 1: Prepare Your Repository
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

### Step 3: Deploy on Render
1. Click "New +" → Select "Web Service"
2. Connect your GitHub repository
3. Fill in the details:
   - **Name**: civil-defense-app
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter)

### Step 4: Add Environment Variables
In Render dashboard, add these environment variables:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://Adam:mEkfFhLqg6uAE42X@civildefense.91up5wg.mongodb.net/civildefense?appName=civildefense
JWT_SECRET=ebf9faf339870d0d6304a343b41e2983
EMAIL_USER=adamdakdouk2003@gmail.com
EMAIL_PASSWORD=dqhh qmzh pazj rhle
FRONTEND_URL=https://your-app-name.onrender.com
```

### Step 5: Deploy
Click "Deploy" and Render will automatically build and start your app!

---

## **Option 2: Heroku (Paid - $7+/month)**

### Step 1: Install Heroku CLI
```bash
npm install -g heroku
```

### Step 2: Login to Heroku
```bash
heroku login
```

### Step 3: Create Heroku App
```bash
heroku create civil-defense-app
```

### Step 4: Add Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="mongodb+srv://Adam:mEkfFhLqg6uAE42X@civildefense.91up5wg.mongodb.net/civildefense?appName=civildefense"
heroku config:set JWT_SECRET="ebf9faf339870d0d6304a343b41e2983"
heroku config:set EMAIL_USER="adamdakdouk2003@gmail.com"
heroku config:set EMAIL_PASSWORD="dqhh qmzh pazj rhle"
```

### Step 5: Deploy
```bash
git push heroku main
```

---

## **Option 3: Railway.app (Free Tier)**

### Step 1: Sign Up
Go to [railway.app](https://railway.app) and sign up with GitHub

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your repository

### Step 3: Configure Build
- Build Command: `npm run build`
- Start Command: `npm start`
- Port: 5000

### Step 4: Add Environment Variables
In Railway dashboard, add all the variables from your `.env.production`

### Step 5: Deploy
Railway auto-deploys on git push!

---

## **Post-Deployment Checklist**

After deployment, verify everything works:

✅ Frontend loads at your domain
✅ Login page appears
✅ Can login with admin credentials
✅ Email sending works (test forgot password)
✅ Database connection is working
✅ All API endpoints respond correctly

---

## **Troubleshooting**

### Build fails
- Check that all dependencies are in `package.json`
- Verify no circular dependencies
- Clear cache and rebuild

### API not responding
- Check environment variables are set
- Check MongoDB Atlas connection string is correct
- Check PORT is set to 5000
- Check logs in deployment dashboard

### Frontend not serving
- Verify frontend build was created
- Check path is correct: `../../frontend/build`
- Ensure NODE_ENV is set to production

### Email not sending
- Verify EMAIL_USER and EMAIL_PASSWORD are correct
- Check Gmail App Password is set (not regular password)
- Verify SMTP settings in emailService.ts

---

## **Custom Domain Setup**

After deployment, you can add a custom domain:

### On Render:
1. Go to Settings
2. Add Custom Domain
3. Update DNS records with provided values

### On Heroku:
```bash
heroku domains:add www.yourdomain.com
```

---

## **Monitoring & Logs**

### View Logs:
**Render**: Dashboard → Logs tab
**Heroku**: `heroku logs --tail`
**Railway**: Dashboard → Logs

### Auto-restart on Crash:
Most platforms have auto-restart enabled by default

---

## **Next Steps**

1. Choose your platform above
2. Follow the steps for that platform
3. Push code to GitHub
4. Share your live URL!

Questions? Check the deployment platform's documentation.
