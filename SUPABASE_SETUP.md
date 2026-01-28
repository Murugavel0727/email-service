# Supabase Setup Guide for Email Agent

## Overview
Your Email Agent now supports cloud-based conversation storage using Supabase! This provides:
- ☁️ Cloud persistence across devices
- 🔄 Real-time sync
- 📊 Powerful database queries
- 🔒 Optional user authentication

## Quick Setup (5 minutes)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create a free account
3. Click **"New Project"**
4. Fill in:
   - **Name**: Email Agent (or any name)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to you
5. Click **"Create new project"** and wait ~2 minutes

### Step 2: Get Your Credentials

1. In your Supabase project, click **Settings** (gear icon) in sidebar
2. Click **API** in the settings menu
3. Copy these two values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (under "Project API keys")

### Step 3: Configure Your App

1. Open the file: `frontend/.env.local`
2. Replace the placeholder values:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Save the file

### Step 4: Create Database Tables

1. In Supabase dashboard, click **SQL Editor** in sidebar
2. Click **"New query"**
3. Open the file `frontend/supabase-setup.sql`
4. Copy ALL the SQL code
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

### Step 5: Restart Your Frontend

```bash
# Stop the current frontend (Ctrl+C in the terminal)
# Then restart it:
npm run dev
```

## ✅ Verification

Your app now uses Supabase! To verify:

1. Open http://localhost:5173
2. Send a message to create a conversation
3. Refresh the page - your conversation should still be there
4. Open the app in a different browser - you should see the same conversations
5. Check Supabase dashboard > **Table Editor** > `conversations` to see your data

## Features Now Available

### Working Features ✅
- **Settings Modal** - Click Settings button in sidebar
  - Account tab: Change display name
  - API tab: Configure backend URL
  - Appearance tab: Font size options
  - Data tab: Clear all conversations, export/import (coming soon)

- **Conversation History** - Sidebar shows all your conversations
  - Click to switch between conversations
  - Hover to see delete button
  - Timestamps show how long ago

- **Auto-save** - Every message is automatically saved

- **Real-time Sync** - Changes reflected across devices

### Fallback Mode
If Supabase is not configured, the app automatically falls back to **localStorage** (browser-only storage). Your conversations will still be saved, just not in the cloud.

## Troubleshooting

### Problem: Conversations not saving
- Check that `.env.local` has correct credentials
- Verify tables were created in Supabase (SQL Editor > Table Editor)
- Check browser console for errors (F12)

### Problem: "Failed to fetch" errors
- Make sure backend is running on port 8000
- Check Settings > API tab for backend URL

### Problem: Can't see Settings modal
- Click the Settings button in sidebar (bottom)
- On mobile, open sidebar first with hamburger menu

## Future Enhancements

Want to add authentication? The database is ready! Just:
1. Enable Supabase Auth in your project
2. Update RLS policies to filter by `auth.uid()`
3. Each user will have their own private conversations

## Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Check browser console** for error messages (F12 > Console tab)
- **Verify backend is running** on http://localhost:8000
