# Deployment Guide: Backend to Render + Frontend to Vercel

This guide shows you exactly how to deploy your email agent with backend on Render and frontend on Vercel.

## Prerequisites

Before deploying, you need to:

1. ✅ Have a GitHub account (to connect repositories)
2. ✅ Have a Render account (free tier works) - https://render.com
3. ✅ Have a Vercel account (free tier works) - https://vercel.com
4. ✅ Have your code pushed to a GitHub repository

## Part 1: Get OAuth Credentials (Do This First!)

### Step 1: Authenticate Locally

If you haven't already authenticated:

```bash
# Make sure backend is running
cd backend
python -m uvicorn main:app --reload --port 8000
```

Then visit in your browser: `http://localhost:8000/api/auth/init`

This will:
- Open Google OAuth consent screen
- Ask you to authorize the app
- Create a `token.json` file in your backend folder

### Step 2: Extract Credentials from token.json

Open `backend/token.json` - it looks like this:

```json
{
  "token": "ya29.xxx...",
  "refresh_token": "1//0xxx...",
  "token_uri": "https://oauth2.googleapis.com/token",
  "client_id": "xxx.apps.googleusercontent.com",
  "client_secret": "GOCSPX-xxx",
  "scopes": ["https://www.googleapis.com/auth/gmail.send"]
}
```

**Copy these 3 values - you'll need them:**
- `refresh_token`
- `client_id`
- `client_secret`

---

## Part 2: Deploy Backend to Render

### Step 1: Push Code to GitHub

Make sure your backend code is in a GitHub repository.

### Step 2: Create New Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository

### Step 3: Configure Build Settings

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `email-agent-backend` (or your choice) |
| **Region** | Choose closest to you |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these 4 environment variables:

| Key | Value | Where to Get It |
|-----|-------|-----------------|
| `GEMINI_API_KEY` | `AIzaSyAi8UqBcc8t1nY8ibuG2Om1ztlT71msfh0` | From your `backend/.env` file |
| `GMAIL_REFRESH_TOKEN` | `1//0xxx...` | From `token.json` (Step 2 above) |
| `GMAIL_CLIENT_ID` | `xxx.apps.googleusercontent.com` | From `token.json` |
| `GMAIL_CLIENT_SECRET` | `GOCSPX-xxx` | From `token.json` |

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (takes 2-5 minutes)
3. Once deployed, copy your backend URL (e.g., `https://email-agent-backend.onrender.com`)

### Step 6: Test Backend

Visit: `https://your-backend-url.onrender.com/api/auth/status`

You should see:
```json
{
  "authenticated": true,
  "message": "Ready to send emails"
}
```

---

## Part 3: Deploy Frontend to Vercel

### Step 1: Create Environment File for Production

Create a new file: `frontend/.env.production`

```bash
VITE_API_URL=https://your-backend-url.onrender.com
```

**Replace** `your-backend-url.onrender.com` with your actual Render backend URL from Part 2, Step 5.

### Step 2: Update .gitignore (Important!)

Make sure `frontend/.gitignore` includes:

```
.env.local
.env.production
```

This prevents committing sensitive URLs.

### Step 3: Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

When prompted:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N**
- Project name? `email-agent-frontend` (or your choice)
- Directory? `./`
- Override settings? **N**

**Option B: Using Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 4: Add Environment Variable in Vercel

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Environment Variables"**
3. Add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.onrender.com`
   - **Environment:** Production

4. Click **"Save"**
5. Go to **"Deployments"** → Click **"..."** on latest → **"Redeploy"**

### Step 5: Test Frontend

1. Visit your Vercel URL (e.g., `https://email-agent-frontend.vercel.app`)
2. Open browser console (F12) and check for: `API URL: https://your-backend-url.onrender.com`
3. Try sending a test email!

---

## Part 4: Google Cloud Console Permissions

### Enable Gmail API

1. Go to https://console.cloud.google.com
2. Select your project (`agentic-ai-484812`)
3. Go to **"APIs & Services"** → **"Library"**
4. Search for **"Gmail API"**
5. Click **"Enable"** (if not already enabled)

### Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Make sure your app is configured:
   - **App name:** Your app name
   - **User support email:** Your email
   - **Scopes:** Should include Gmail send scope
   - **Test users:** Add your Gmail address

### Add Authorized Domains (Optional)

If you want to send from production:

1. Go to **"OAuth consent screen"**
2. Under **"Authorized domains"**, add:
   - `onrender.com`
   - `vercel.app`

---

## Troubleshooting

### Backend Issues

**"Authentication failed" on Render:**
- Double-check environment variables are set correctly
- Make sure you copied the full `refresh_token` (it's very long)
- Verify Gmail API is enabled in Google Cloud Console

**Backend logs show errors:**
- Go to Render dashboard → Your service → **"Logs"**
- Look for specific error messages

### Frontend Issues

**"Network Error" or CORS errors:**
- Verify `VITE_API_URL` is set correctly in Vercel
- Check that backend URL is accessible
- Redeploy frontend after adding environment variables

**Frontend not connecting to backend:**
- Open browser console (F12)
- Check what `API URL:` shows
- Should be your Render backend URL, not localhost

### Email Not Sending

**Check backend authentication:**
```bash
curl https://your-backend-url.onrender.com/api/auth/status
```

**Common issues:**
- Refresh token expired (re-authenticate locally and update Render env vars)
- Gmail API not enabled
- Test user not added in OAuth consent screen

---

## Summary Checklist

### Backend (Render)
- [ ] Code pushed to GitHub
- [ ] Web Service created on Render
- [ ] Root directory set to `backend`
- [ ] Environment variables added (4 total)
- [ ] Deployment successful
- [ ] `/api/auth/status` returns authenticated

### Frontend (Vercel)
- [ ] `.env.production` created with backend URL
- [ ] Deployed to Vercel
- [ ] `VITE_API_URL` environment variable set
- [ ] Redeployed after adding env var
- [ ] Can access frontend URL
- [ ] Console shows correct API URL

### Google Cloud
- [ ] Gmail API enabled
- [ ] OAuth consent screen configured
- [ ] Test users added

---

## Quick Reference

### Backend Environment Variables (Render)
```
GEMINI_API_KEY=<from backend/.env>
GMAIL_REFRESH_TOKEN=<from token.json>
GMAIL_CLIENT_ID=<from token.json>
GMAIL_CLIENT_SECRET=<from token.json>
```

### Frontend Environment Variable (Vercel)
```
VITE_API_URL=https://your-backend-url.onrender.com
```

### Important Files
- `backend/requirements.txt` - Python dependencies
- `backend/Procfile` - Already configured for Render
- `backend/credentials.json` - Keep this file (needed for OAuth)
- `backend/token.json` - DON'T commit this (in .gitignore)
- `frontend/.env.production` - Backend URL for production

---

## Need Help?

1. **Check logs:**
   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Project → Deployments → View Function Logs

2. **Test endpoints:**
   ```bash
   # Backend health
   curl https://your-backend.onrender.com/health
   
   # Auth status
   curl https://your-backend.onrender.com/api/auth/status
   ```

3. **Common fixes:**
   - Redeploy after changing environment variables
   - Clear browser cache if frontend shows old API URL
   - Check that all environment variables are set in production

Your email agent should now be fully deployed and working! 🚀
