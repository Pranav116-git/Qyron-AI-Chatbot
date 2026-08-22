from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.config import FRONTEND_URL, GLOBAL_RATE_LIMIT_PER_MINUTE, CHAT_RATE_LIMIT_PER_MINUTE
from app.routes.chat import router as chat_router
from app.routes.conversations import router as conversations_router
from app.routes.auth import router as auth_router
from app.database import init_db
from app.middleware.security import SecurityHeadersMiddleware, RateLimitMiddleware, ChatRateLimitMiddleware
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Qyron API", docs_url=None, redoc_url=None)

app.add_middleware(ChatRateLimitMiddleware, requests_per_minute=CHAT_RATE_LIMIT_PER_MINUTE)
app.add_middleware(RateLimitMiddleware, requests_per_minute=GLOBAL_RATE_LIMIT_PER_MINUTE)
app.add_middleware(SecurityHeadersMiddleware)

from fastapi.middleware.cors import CORSMiddleware

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong. Please try again."},
    )


@app.on_event("startup")
async def startup():
    logger.info("Starting Qyron API...")
    await init_db()
    logger.info("Database initialized.")


app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(conversations_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
