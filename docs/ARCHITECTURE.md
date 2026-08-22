# Architecture

This document explains how Qyron works at a technical level.

---

## System Overview

```
                         ┌──────────────────────┐
                         │       USER           │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      NETLIFY         │
                         │   React + Vite SPA   │
                         └──────────┬───────────┘
                                    │
                              HTTPS API
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       RENDER         │
                         │   FastAPI Backend    │
                         └───────┬───────┬──────┘
                                 │       │
                       Auth/Data │       │ AI Request
                                 │       │
                                 ▼       ▼
                         ┌──────────┐  ┌──────────────┐
                         │PostgreSQL│  │  OpenRouter   │
                         └──────────┘  └───────┬──────┘
                                               │
                                               ▼
                                            Gemini
```

---

## Frontend

### Stack
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Material Symbols** - Icon library

### Key Files
```
frontend/src/
├── main.jsx              # Entry point
├── App.jsx               # Root component with auth flow
├── index.css             # Global styles, CSS variables, animations
├── context/
│   └── AuthContext.jsx   # Authentication state management
├── components/
│   ├── LoginPage.jsx     # Sign in form
│   ├── RegisterPage.jsx  # Sign up form
│   ├── Sidebar.jsx       # Conversation list + user info
│   ├── ChatWindow.jsx    # Message list container
│   ├── MessageBubble.jsx # Individual message with markdown
│   ├── MessageInput.jsx  # Text input with send/stop
│   ├── EmptyState.jsx    # Welcome screen with Qyron core animation
│   └── LoadingIndicator.jsx  # Thinking animation
├── hooks/
│   └── useChat.js        # Core chat state management
├── services/
│   └── api.js            # HTTP API layer with JWT handling
└── utils/
    ├── chatUtils.js      # ID generation, message creation
    └── storage.js        # localStorage for theme persistence
```

### Authentication Flow
1. User enters credentials on LoginPage/RegisterPage
2. Frontend sends POST to `/api/auth/login` or `/api/auth/register`
3. Backend returns JWT token + user info
4. Token stored in `localStorage` as `qyron-token`
5. All API requests include `Authorization: Bearer <token>` header
6. On 401 response, token is cleared and user is redirected to login

### API Communication
- All API calls go through `services/api.js`
- `apiCall()` handles JWT token injection and 401 responses
- `sendMessage()` has special error handling for chat-specific errors
- Vite dev server proxies `/api` and `/health` to `localhost:8000`

---

## Backend

### Stack
- **FastAPI** - Async web framework
- **SQLAlchemy** - ORM with async support
- **Pydantic** - Data validation
- **python-jose** - JWT token handling
- **passlib + bcrypt** - Password hashing
- **httpx** - Async HTTP client for OpenRouter

### Key Files
```
backend/app/
├── main.py               # FastAPI app, middleware, routes
├── config.py             # Environment variable loading
├── database.py           # SQLAlchemy engine + session
├── models.py             # ORM models (User, Conversation, Message)
├── schemas.py            # Pydantic request/response models
├── routes/
│   ├── auth.py           # Register, login, get me
│   ├── chat.py           # POST /api/chat
│   └── conversations.py  # Full CRUD for conversations
├── services/
│   ├── auth.py           # JWT creation, password hashing, get_current_user
│   └── openrouter.py     # OpenRouter API integration
└── middleware/
    └── security.py       # Security headers, rate limiting
```

### Request Flow
```
Request → CORS Middleware → Security Headers → Rate Limit → Route Handler
```

### Authentication
1. Client sends `Authorization: Bearer <token>` header
2. `get_current_user()` dependency extracts and validates JWT
3. JWT contains `sub` (user ID) and `exp` (expiry)
4. User is looked up in database
5. If valid, user object is injected into route handler

### Database Models
```
User (id, email, username, hashed_password, is_active, created_at)
  └── Conversation (id, user_id, title, created_at, updated_at, archived_at)
        └── Message (id, conversation_id, role, content, created_at)
```

### Rate Limiting
- **Global**: 120 requests/minute per IP (configurable)
- **Chat**: 20 requests/minute per IP (configurable)
- In-memory sliding window (resets on server restart)

---

## Database

### Production (PostgreSQL)
- Managed PostgreSQL on Render
- Connection via `DATABASE_URL` environment variable
- SQLAlchemy handles async connections via `asyncpg`

### Development (SQLite)
- File-based SQLite (`qyron.db`)
- Zero configuration needed
- Same ORM models work with both databases

### Tables
| Table | Purpose |
|---|---|
| `users` | User accounts |
| `conversations` | Chat threads (scoped to users) |
| `messages` | Individual messages in conversations |

---

## AI Integration

### OpenRouter
- Backend proxies all AI requests through OpenRouter
- API key stored server-side only (never exposed to frontend)
- System prompt defines Qyron's personality and behavior
- Context window limited to 40 messages / 120K characters

### Error Handling
- 429 (rate limit) → User-friendly retry message
- 503 (unavailable) → Temporary unavailability message
- Timeout → Retry suggestion
- All errors logged server-side, generic messages sent to client

---

## Security Boundaries

```
┌─────────────────────────────────────────────┐
│ FRONTEND (Netlify)                          │
│ - Publicly accessible                       │
│ - No secrets in code                        │
│ - JWT token in localStorage                 │
│ - HTTPS only                                │
└──────────────────┬──────────────────────────┘
                   │ HTTPS API calls
                   │ Authorization: Bearer <token>
┌──────────────────▼──────────────────────────┐
│ BACKEND (Render)                            │
│ - CORS: only frontend origin                │
│ - Rate limiting per IP                      │
│ - JWT validation on protected routes        │
│ - User ownership on all data                │
│ - Input validation via Pydantic             │
│ - Security headers (CSP, HSTS, etc.)        │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼────┐        ┌────▼────┐
    │PostgreSQL│        │OpenRouter│
    │(auth,   │        │(API key │
    │ data)   │        │ server- │
    └─────────┘        │ side)   │
                       └─────────┘
```

### What's Protected
- API key: Server-side only, never in frontend code
- Passwords: Hashed with bcrypt, never stored in plaintext
- User data: Scoped by user_id, isolated between accounts
- Endpoints: Protected routes require valid JWT
- Headers: CSP, HSTS, X-Frame-Options prevent common attacks

---

## Deployment

### Netlify (Frontend)
- Static site hosting
- Automatic deploys on git push
- SPA catch-all redirect for client-side routing
- Custom headers for security

### Render (Backend)
- Python web service
- Auto-deploy on git push
- Health check at `/health`
- Environment variables for configuration
- Free tier with cold start (~30s idle)
