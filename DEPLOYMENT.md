# Deployment Guide

This guide explains how to run the email service locally and deploy to Vercel.

## Local Development

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

The `.env` file should contain:
```
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Authenticate Gmail (First Time Only)

Start the backend:
```bash
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/api/auth/init` in your browser. This will:
- Open a Google OAuth consent screen
- Ask you to authorize the app to send emails
- Create a `token.json` file with your credentials

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will automatically connect to `http://localhost:8000`.

## Vercel Deployment

### Backend Deployment

#### Step 1: Get OAuth Credentials

After authenticating locally (see above), open `backend/token.json`. You'll see something like:

```json
{
  "refresh_token": "1//0xxx...",
  "client_id": "xxx.apps.googleusercontent.com",
  "client_secret": "GOCSPX-xxx"
}
```

#### Step 2: Set Vercel Environment Variables

In your Vercel project settings, add these environment variables:

```
GEMINI_API_KEY=your_gemini_api_key
GMAIL_REFRESH_TOKEN=<refresh_token from token.json>
GMAIL_CLIENT_ID=<client_id from token.json>
GMAIL_CLIENT_SECRET=<client_secret from token.json>
```

#### Step 3: Deploy Backend

```bash
cd backend
vercel --prod
```

Note your backend URL (e.g., `https://your-backend.vercel.app`)

### Frontend Deployment

#### Step 1: Update Frontend Environment

Create `frontend/.env.production`:

```
VITE_API_URL=https://your-backend.vercel.app
```

#### Step 2: Deploy Frontend

```bash
cd frontend
vercel --prod
```

## Troubleshooting

### "No credentials found" Error

**Local Development:**
- Make sure `credentials.json` exists in the `backend` folder
- Visit `http://localhost:8000/api/auth/init` to authenticate

**Vercel Deployment:**
- Verify all environment variables are set in Vercel dashboard
- Check that `GMAIL_REFRESH_TOKEN`, `GMAIL_CLIENT_ID`, and `GMAIL_CLIENT_SECRET` match values from `token.json`

### "Credentials expired" Error

**Local Development:**
- Delete `token.json` and re-authenticate via `/api/auth/init`

**Vercel Deployment:**
- Refresh tokens can expire after 6 months of inactivity
- Re-authenticate locally and update `GMAIL_REFRESH_TOKEN` in Vercel

### Emails Not Sending

1. Check authentication status: `GET /api/auth/status`
2. Check backend logs in Vercel dashboard
3. Verify Gmail API is enabled in Google Cloud Console
4. Check that the authenticated Google account has permission to send emails

### CORS Errors

- Ensure backend is running on the correct port (8000 for local)
- Verify `VITE_API_URL` in frontend matches your backend URL
- Check Vercel deployment logs for errors

## Testing Email Functionality

### Check Authentication Status

```bash
curl http://localhost:8000/api/auth/status
```

Should return:
```json
{
  "authenticated": true,
  "message": "Ready to send emails"
}
```

### Send Test Email via API

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Send an email to test@example.com with subject Test and body Hello World",
    "history": []
  }'
```

## Security Notes

- **Never commit `token.json`** - It's already in `.gitignore`
- **Never commit `.env`** with real credentials
- Store production credentials only in Vercel environment variables
- Refresh tokens should be treated as sensitive as passwords
