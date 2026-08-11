# Qyron

An AI-powered chat application with persistent conversations, user authentication, and a glassmorphism Material Design 3 interface.

## Stack

**Frontend:** React 19 + Vite + Tailwind CSS (Material Design 3)  
**Backend:** Python 3.11+ + FastAPI + SQLAlchemy (async)  
**Database:** PostgreSQL (production) / SQLite (development)  
**AI:** OpenRouter / Gemini (server-side only)  
**Deployment:** Netlify (frontend) + Render (backend)

## Features

- AI chat powered by OpenRouter/Gemini with server-side key management
- Cookie-based session authentication (HttpOnly, Secure, SameSite)
- CSRF protection (double-submit cookie pattern)
- Rate limiting (per-minute, per-day, global, auth)
- Persistent conversations and saved prompts
- User settings with theme toggle (light/dark)
- Account management (profile, password, delete)
- Usage tracking dashboard
- Responsive glassmorphism UI

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (production) or SQLite (development, no install needed)

### Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

cp .env.example .env
# Edit .env with your values:
#   OPENROUTER_API_KEY=your_key_here
#   DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/qyron
#   SESSION_SECRET=generate_a_random_secret

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api` requests to the backend.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | Yes | - | OpenRouter API key |
| `OPENROUTER_MODEL` | No | `google/gemini-2.0-flash-001` | AI model to use |
| `DATABASE_URL` | Yes | `sqlite+aiosqlite:///./qyron.db` | Database connection string |
| `SESSION_SECRET` | Yes | - | Secret for session tokens (64+ char random string) |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Frontend URL for CORS |
| `ENVIRONMENT` | No | `development` | `development` or `production` |
| `CHAT_RATE_LIMIT_PER_MINUTE` | No | `20` | Max AI messages per minute per user |
| `CHAT_DAILY_LIMIT` | No | `200` | Max AI messages per day per user |
| `AUTH_RATE_LIMIT` | No | `10` | Max auth attempts per window |
| `AUTH_RATE_WINDOW` | No | `300` | Auth rate window in seconds |
| `GLOBAL_RATE_LIMIT_PER_MINUTE` | No | `120` | Max requests per minute per IP |
| `SMTP_HOST` | No | - | SMTP server for password reset emails |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USERNAME` | No | - | SMTP username |
| `SMTP_PASSWORD` | No | - | SMTP password |
| `EMAIL_FROM` | No | - | From address for emails |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL (defaults to `http://localhost:8000`) |

## Database

The app uses async SQLAlchemy with the following models:

- **User** - User accounts with email/password auth
- **UserSession** - Active sessions (auto-cleaned on expiry)
- **Conversation** - Chat conversations (archivable)
- **Message** - Messages within conversations
- **SavedPrompt** - User-saved prompt templates
- **UserSettings** - Per-user preferences (theme)
- **PasswordReset** - Password reset tokens (15min expiry)
- **EmailVerification** - Email verification tokens
- **UsageLog** - AI usage tracking per user

Tables are created automatically on first startup.

## API Endpoints

### Auth (`/api/auth`)
- `POST /register` - Create account
- `POST /login` - Sign in
- `POST /logout` - Sign out
- `POST /logout-all` - Sign out all sessions
- `GET /me` - Get current user
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `POST /change-password` - Change password (requires current password)
- `PUT /profile` - Update name
- `DELETE /account` - Delete account

### Chat (`/api/chat`)
- `POST /chat` - Send messages, get AI response

### Conversations (`/api/conversations`)
- `GET /conversations` - List conversations
- `GET /conversations/archived` - List archived
- `GET /conversations/{id}` - Get with messages
- `POST /conversations` - Create
- `PUT /conversations/{id}` - Rename
- `POST /conversations/{id}/archive` - Archive
- `POST /conversations/{id}/unarchive` - Unarchive
- `DELETE /conversations/{id}` - Delete
- `GET /conversations/search?q=` - Search

### Saved Prompts (`/api/saved-prompts`)
- CRUD operations

### Settings (`/api/settings`)
- `GET /settings` - Get theme
- `PUT /settings` - Update theme

### Usage (`/api/usage`)
- `GET /usage/stats` - Get usage stats (today/week/month/all-time)

### Health
- `GET /health` - Health check

## Security

- Passwords hashed with Argon2id
- Sessions stored server-side, cookie contains only a session token
- HttpOnly + Secure + SameSite=Lax cookies (production)
- CSRF protection via double-submit cookie pattern
- Rate limiting on all endpoints
- CSP and security headers in production
- Input validation on all endpoints (max_length enforced)
- No AI API keys exposed to the browser

## Deployment

### Frontend (Netlify)

1. Push to GitHub
2. Connect repo in Netlify dashboard
3. Set build directory to `frontend`
4. Set `VITE_API_URL` to your Render backend URL

### Backend (Render)

1. Push to GitHub
2. Create a new Web Service on Render
3. Set root directory to `backend`
4. Add all environment variables from `.env.example`
5. Render will auto-deploy on push

### Database

Use any PostgreSQL provider (Neon, Supabase, Render Postgres, etc.). Set `DATABASE_URL` in your Render environment variables.

## License

MIT
