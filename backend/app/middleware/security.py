import hashlib
import secrets
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import ENVIRONMENT
import logging

logger = logging.getLogger(__name__)

CSRF_COOKIE_NAME = "qyron_csrf"
CSRF_HEADER_NAME = "x-csrf-token"
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
STATE_CHANGING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def hash_csrf_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"

        if ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data:; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )

        return response


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in SAFE_METHODS:
            response = await call_next(request)
            if not request.cookies.get(CSRF_COOKIE_NAME):
                token = generate_csrf_token()
                samesite_setting = "none" if ENVIRONMENT == "production" else "lax"
                response.set_cookie(
                    key=CSRF_COOKIE_NAME,
                    value=hash_csrf_token(token),
                    httponly=False,
                    secure=ENVIRONMENT == "production",
                    samesite=samesite_setting,
                    max_age=3600,
                    path="/",
                )
            return response

        if request.url.path.startswith("/api/") and request.method in STATE_CHANGING_METHODS:
            csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
            csrf_header = request.headers.get(CSRF_HEADER_NAME)

            if not csrf_cookie or not csrf_header:
                logger.warning(f"CSRF validation failed: missing token from {request.client.host}")
                return Response(
                    content='{"detail":"CSRF token missing."}',
                    status_code=403,
                    media_type="application/json",
                )

            if csrf_cookie != csrf_header:
                logger.warning(f"CSRF validation failed: token mismatch from {request.client.host}")
                return Response(
                    content='{"detail":"CSRF token invalid."}',
                    status_code=403,
                    media_type="application/json",
                )

        response = await call_next(request)
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self._requests: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        if client_ip not in self._requests:
            self._requests[client_ip] = []

        self._requests[client_ip] = [
            t for t in self._requests[client_ip] if now - t < 60
        ]

        if len(self._requests[client_ip]) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return Response(
                content='{"detail":"Too many requests. Please try again later."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": "60"},
            )

        self._requests[client_ip].append(now)

        if len(self._requests) > 10000:
            cutoff = now - 120
            self._requests = {
                ip: times for ip, times in self._requests.items()
                if times and times[-1] > cutoff
            }

        return await call_next(request)
