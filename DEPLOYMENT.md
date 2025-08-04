# Grade Book Application - Render.com Deployment Guide

This guide will help you deploy the Grade Book application to Render.com.

## Prerequisites

1. A GitHub account
2. A Render.com account (free tier available)
3. Your code pushed to a GitHub repository

## Deployment Steps

### 1. Push Your Code to GitHub

First, make sure your code is in a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit - Grade Book App ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2. Deploy to Render.com

#### Option A: Using render.yaml (Recommended)

1. Go to [Render.com](https://render.com) and sign in
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file and create both services:
   - Backend API (Node.js web service)
   - Frontend (Static site)

#### Option B: Manual Setup

If the blueprint doesn't work, create services manually:

**Backend Service:**
1. Click "New" → "Web Service"
2. Connect your GitHub repo
3. Configure:
   - Name: `grade-book-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Plan: Free
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (click "Generate" for a secure random value)

**Frontend Service:**
1. Click "New" → "Static Site"
2. Connect your GitHub repo
3. Configure:
   - Name: `grade-book-frontend`
   - Build Command: `cd frontend && npm install -g http-server`
   - Publish Directory: `frontend`
   - Plan: Free

### 3. Update Frontend API URL

After deployment, you'll get URLs like:
- Backend: `https://grade-book-backend.onrender.com`
- Frontend: `https://grade-book-frontend.onrender.com`

The frontend is already configured to automatically detect production environment and use the correct API URL.

### 4. Update CORS Settings

If you get CORS errors, update the CORS configuration in `backend/app.js` with your actual frontend URL.

## Important Notes

### Database
- The SQLite database will be ephemeral on Render's free tier
- Data will be reset when the service restarts
- For production, consider upgrading to a paid plan or using an external database

### Free Tier Limitations
- Services sleep after 15 minutes of inactivity
- First request after sleeping may take 30+ seconds
- 750 hours per month limit across all services

### Environment Variables
- `JWT_SECRET`: Automatically generated secure token
- `NODE_ENV`: Set to `production`

## Troubleshooting

### Service Won't Start
- Check the logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify start commands are correct

### CORS Errors
- Make sure frontend URL is added to CORS whitelist in backend
- Check that API calls use HTTPS in production

### Database Issues
- Run the migration script if needed: `npm run migrate`
- Remember that data resets on service restart (free tier)

## Local Development

To run locally:

```bash
# Backend
cd backend
npm install
npm start

# Frontend (new terminal)
cd frontend
npm install
npm start
```

## Features

✅ Course-based grading system
✅ Role-based authentication (Admin/Teacher/Student)
✅ PDF and CSV export functionality
✅ Responsive design
✅ Real-time grade calculations
✅ User management
✅ Course enrollment system

## Support

If you encounter issues during deployment, check:
1. Render service logs
2. Browser console for frontend errors
3. Network tab for API call failures

For questions about the application itself, refer to the main README.md file.
