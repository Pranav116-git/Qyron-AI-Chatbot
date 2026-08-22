# Deployment Guide

This guide walks you through deploying Qyron to production using Netlify (frontend) and Render (backend).

---

## Prerequisites

- GitHub account
- Netlify account (free tier works)
- Render account (free tier works)
- OpenRouter API key
- PostgreSQL database (Render provides a free tier)

---

## 1. GitHub Setup

1. Push your code to a GitHub repository
2. Make sure `.env` files are NOT committed (check `.gitignore`)
3. The repo should contain:
   - `frontend/` - React app
   - `backend/` - FastAPI app
   - `render.yaml` - Render deployment config
   - `README.md`

---

## 2. Database Setup (Render PostgreSQL)

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Configure:
   - **Name**: `qyron-db`
   - **Database**: `qyron`
   - **User**: `qyron`
   - **Plan**: Free
4. Click **Create Database**
5. Once created, copy the **Internal Database URL** (looks like `postgresql://user:pass@host:port/dbname`)
6. You'll need this for the backend environment variable `DATABASE_URL`

---

## 3. Backend Deployment (Render)

1. In Render Dashboard, click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `qyron-api`
   - **Region**: Oregon (or closest to you)
   - **Runtime**: Python
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
4. Add Environment Variables:

| Key | Value |
|---|---|
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `OPENROUTER_MODEL` | `google/gemini-2.0-flash-001` |
| `FRONTEND_URL` | `https://qyronai.netlify.app` |
| `DATABASE_URL` | PostgreSQL URL from Step 2 |
| `JWT_SECRET` | Generate a strong random string (use a password generator) |
| `ENVIRONMENT` | `production` |
| `GLOBAL_RATE_LIMIT_PER_MINUTE` | `120` |
| `CHAT_RATE_LIMIT_PER_MINUTE` | `20` |
| `JWT_EXPIRY_MINUTES` | `10080` |

5. Click **Create Web Service**
6. Wait for deployment to complete
7. Note your backend URL (e.g., `https://qyron-api.onrender.com`)
8. Test: Visit `https://qyron-api.onrender.com/health` - should return `{"status": "ok"}`

---

## 4. Frontend Deployment (Netlify)

1. Log in to [Netlify](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect your GitHub repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add Environment Variable in Netlify dashboard:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://qyron-api.onrender.com` (your backend URL) |

6. Click **Deploy site**
7. Wait for deployment to complete
8. Netlify will provide a URL like `https://random-name.netlify.app`
9. You can change this to `qyronai.netlify.app` in Site settings → Change site name

---

## 5. Post-Deployment Verification

### Test the full flow:
1. Visit `https://qyronai.netlify.app/`
2. Click **Sign up**
3. Create an account
4. Verify you're logged in and see the chat interface
5. Send a message - should get an AI response
6. Create another conversation
7. Verify conversations persist on page refresh
8. Click **Sign out**
9. Sign back in with the same credentials
10. Verify your conversations are still there

### Test security:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Verify API requests include `Authorization: Bearer <token>` header
4. Try accessing the backend directly without a token - should get 403

### Test user isolation:
1. Register two different accounts
2. Create conversations with each
3. Verify each user only sees their own conversations

---

## 6. Troubleshooting

### Frontend shows "Failed to fetch" or CORS errors
- Check that `VITE_API_URL` is set correctly in Netlify
- Check that `FRONTEND_URL` is set correctly in Render (must include `https://`)
- Redeploy both services after changing environment variables

### Backend won't start
- Check Render logs for errors
- Verify all required environment variables are set
- Make sure `DATABASE_URL` points to a valid PostgreSQL database

### Authentication not working
- Verify `JWT_SECRET` is set in Render
- Check that the frontend is sending the `Authorization` header
- Clear browser localStorage and try logging in again

### Database errors
- Make sure PostgreSQL is running on Render
- Verify the `DATABASE_URL` format is correct
- The app auto-creates tables on startup - no migration needed for initial setup

---

## 7. Redeployment

### Automatic deploys
Both Netlify and Render auto-deploy when you push to the main branch.

### Manual deploys
- **Netlify**: Go to Deploys → Trigger deploy → Deploy site
- **Render**: Go to Service → Manual deploy → Deploy latest commit

---

## 8. Cost

Both services have free tiers that are sufficient for a portfolio project:

- **Netlify Free**: 100GB bandwidth/month, 300 build minutes/month
- **Render Free**: 750 hours/month, spins down after inactivity (cold starts ~30s)
- **Render PostgreSQL Free**: 90 days, 1GB storage

**Note**: Render free tier services spin down after 15 minutes of inactivity. The first request after idle takes ~30 seconds. This is normal for free tier.
