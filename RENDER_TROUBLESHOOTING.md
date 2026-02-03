# Render Deployment Troubleshooting

## Issue: {"detail":"Not Found"} on /api/auth/status

This means Render deployed but can't find your routes. Here are the fixes:

---

## ✅ **Solution: Check These Settings in Render**

### 1. Root Directory
**CRITICAL:** Make sure this is set correctly in Render:

- Go to your service in Render Dashboard
- Settings → Build & Deploy
- **Root Directory:** `backend`

If this is blank or set to `.` it won't work!

### 2. Start Command
Use this exact command:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Note:** Use `$PORT` (not `10000`) - Render automatically sets this variable.

### 3. Build Command
```bash
pip install -r requirements.txt
```

---

## 🔍 **Check Render Logs**

1. Go to Render Dashboard → Your Service
2. Click **"Logs"** tab
3. Look for errors like:
   - `ModuleNotFoundError: No module named 'main'` → Root directory issue
   - `ImportError` → Missing dependencies
   - `Application startup complete` → Good! App is running

---

## 🧪 **Test Your Endpoints**

After fixing, test these URLs:

### 1. Health Check (Simple)
```
https://email-service-o2xb.onrender.com/health
```
Should return: `{"status":"ok"}`

### 2. Root Endpoint
```
https://email-service-o2xb.onrender.com/
```
Should return: `{"message":"Agentic Email Backend is running"}`

### 3. Auth Status
```
https://email-service-o2xb.onrender.com/api/auth/status
```
Should return: `{"authenticated":true,...}`

---

## 🔧 **Common Fixes**

### Fix 1: Wrong Root Directory
**Problem:** Render is looking in wrong folder
**Solution:** 
1. Render Dashboard → Your Service → Settings
2. Build & Deploy → Root Directory
3. Set to: `backend`
4. Save and redeploy

### Fix 2: Missing Dependencies
**Problem:** Some packages not installed
**Solution:**
1. Check `backend/requirements.txt` exists
2. Make sure it includes all packages:
```
fastapi
uvicorn
python-dotenv
google-api-python-client
google-auth-httplib2
google-auth-oauthlib
pydantic
google-generativeai
```

### Fix 3: Environment Variables Not Set
**Problem:** Missing credentials
**Solution:**
1. Render Dashboard → Your Service → Environment
2. Make sure all 4 variables are set:
   - `GEMINI_API_KEY`
   - `GMAIL_REFRESH_TOKEN`
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`

---

## 📋 **Complete Render Configuration Checklist**

Copy these exact settings:  

| Setting | Value |
|---------|-------|
| **Name** | `email-agent-backend` |
| **Region** | Any |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ CRITICAL |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

**Environment Variables (4 total):**
- `GEMINI_API_KEY` = (from DEPLOYMENT_CREDENTIALS.md)
- `GMAIL_REFRESH_TOKEN` = (from DEPLOYMENT_CREDENTIALS.md)
- `GMAIL_CLIENT_ID` = (from DEPLOYMENT_CREDENTIALS.md)
- `GMAIL_CLIENT_SECRET` = (from DEPLOYMENT_CREDENTIALS.md)

---

## 🚀 **Step-by-Step Fix**

1. **Go to Render Dashboard**
   - https://dashboard.render.com
   - Click on your service

2. **Check Root Directory**
   - Settings → Build & Deploy
   - Root Directory: `backend`
   - Click "Save Changes"

3. **Verify Start Command**
   - Should be: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - If different, update and save

4. **Check Environment Variables**
   - Environment tab
   - Should have 4 variables
   - Add any missing ones

5. **Manual Redeploy**
   - Go to "Manual Deploy" tab
   - Click "Deploy latest commit"
   - Wait for deployment (2-3 minutes)

6. **Check Logs**
   - Logs tab
   - Look for: `Application startup complete`
   - Should NOT see: `ModuleNotFoundError`

7. **Test Endpoint**
   - Visit: `https://your-url.onrender.com/health`
   - Should see: `{"status":"ok"}`

---

## 💡 **If Still Not Working**

### Check the Logs for These Messages:

**Good Signs:**
```
INFO:     Started server process
INFO:     Application startup complete
EmailService: Initializing credentials...
EmailService: Successfully loaded credentials from environment
```

**Bad Signs:**
```
ModuleNotFoundError: No module named 'main'
→ Fix: Set Root Directory to "backend"

ImportError: No module named 'fastapi'
→ Fix: Check requirements.txt exists in backend folder

FileNotFoundError: credentials.json not found
→ This is OK! We use environment variables instead
```

---

## 📞 **Still Getting "Not Found"?**

The issue is almost certainly the **Root Directory**. Render needs to know your code is in the `backend` folder.

**Quick Fix:**
1. Render Dashboard
2. Your Service → Settings
3. Build & Deploy section
4. Root Directory: **Type exactly:** `backend`
5. Save Changes
6. Manual Deploy → Deploy latest commit

This should fix it! ✅
