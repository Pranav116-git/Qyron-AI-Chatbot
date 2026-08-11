import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./qyron.db")
SESSION_SECRET = os.getenv("SESSION_SECRET", "dev-secret-change-in-production")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
CHAT_RATE_LIMIT_PER_MINUTE = int(os.getenv("CHAT_RATE_LIMIT_PER_MINUTE", "20"))
CHAT_DAILY_LIMIT = int(os.getenv("CHAT_DAILY_LIMIT", "200"))
AUTH_RATE_LIMIT = int(os.getenv("AUTH_RATE_LIMIT", "10"))
AUTH_RATE_WINDOW = int(os.getenv("AUTH_RATE_WINDOW", "300"))
GLOBAL_RATE_LIMIT_PER_MINUTE = int(os.getenv("GLOBAL_RATE_LIMIT_PER_MINUTE", "120"))
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "")
