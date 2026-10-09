"""Main FastAPI application - Casino Balance Vault.
Single login page → auto-sync starts → dashboard shows only verified live data."""
from __future__ import annotations

import asyncio
import os
import secrets
import time
from pathlib import Path

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.sync import SyncEngine

app = FastAPI(title="Casino Balance Vault", version="2.0.0")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = os.getenv("DATA_DIR", str(BASE_DIR / "data"))
DB_PATH = os.getenv("DB_PATH", str(BASE_DIR / "data" / "vault.sqlite3"))

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Session management
SESSIONS: dict[str, dict] = {}
SESSION_TTL = 86400

# Dashboard access password
DASHBOARD_PASSWORD = os.getenv("DASHBOARD_PASSWORD", "vault2026")

# Initialize sync engine
sync_engine = SyncEngine(data_dir=DATA_DIR, db_path=DB_PATH)


def get_session(request: Request) -> dict | None:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if token and token in SESSIONS:
        session = SESSIONS[token]
        if time.time() - session["created_at"] < SESSION_TTL:
            return session
    return None


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "connect-src 'self'; "
        "frame-ancestors 'none'"
    )
    return response


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0", "domains": len(sync_engine.domains)}


# =========================================================
#              SINGLE LOGIN PAGE (entry point)
# =========================================================

@app.get("/", response_class=HTMLResponse)
async def login_page(request: Request):
    """Secure login page — the single entry point. User enters dashboard
    password + casino credentials. Sync starts automatically after login."""
    if get_session(request):
        return RedirectResponse(url="/dashboard", status_code=302)
    return templates.TemplateResponse("login.html", {"request": request})


@app.post("/api/login")
async def do_login(request: Request, body: dict):
    """Single login: validates dashboard password, stores casino credentials,
    starts auto-sync immediately, redirects to dashboard."""
    dashboard_password = body.get("dashboard_password", "")
    casino_username = body.get("casino_username", "")
    casino_password = body.get("casino_password", "")

    # Validate dashboard access
    if dashboard_password != DASHBOARD_PASSWORD:
        return JSONResponse({"error": "Invalid dashboard password"}, status_code=401)

    # Require casino credentials
    if not casino_username or not casino_password:
        return JSONResponse({"error": "Casino username and password are required to start sync"}, status_code=400)

    # Create session
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = {
        "username": "admin",
        "created_at": time.time(),
        "casino_username": casino_username,
        "casino_password": casino_password,
    }

    # Start auto-sync immediately — no manual action needed
    credentials = {"username": casino_username, "password": casino_password}
    asyncio.create_task(sync_engine.sync_all(credentials))

    response = JSONResponse({
        "token": token,
        "redirect": "/dashboard",
        "sync_started": True,
        "total_domains": len(sync_engine.domains),
    })
    response.set_cookie(
        "session_token", token,
        httponly=True, secure=False, samesite="strict", max_age=SESSION_TTL,
    )
    return response


# =========================================================
#              DASHBOARD (live results)
# =========================================================

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    if not get_session(request):
        return RedirectResponse(url="/", status_code=302)
    return templates.TemplateResponse("dashboard.html", {"request": request})


@app.get("/api/dashboard")
async def get_dashboard(request: Request):
    """Get full dashboard — only verified live data is shown."""
    session = get_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return sync_engine.get_dashboard()


@app.get("/api/sync-status")
async def sync_status(request: Request):
    """Get current sync progress for live updates."""
    if not get_session(request):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        **sync_engine.progress.model_dump(),
        "is_running": sync_engine.progress.is_running,
    }


@app.get("/api/snapshot/{site_id}")
async def get_snapshot(request: Request, site_id: str):
    if not get_session(request):
        raise HTTPException(status_code=401, detail="Not authenticated")
    snap = sync_engine.snapshots.get(site_id)
    if not snap:
        return {"site_id": site_id, "snapshot": None}
    return {"site_id": site_id, "snapshot": snap.model_dump(mode="json")}


@app.get("/api/history/{site_id}")
async def get_history(request: Request, site_id: str):
    if not get_session(request):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"site_id": site_id, "history": sync_engine.get_history(site_id)}


@app.post("/api/sync-all")
async def sync_all(request: Request):
    """Manually trigger a re-sync (uses stored credentials from session)."""
    session = get_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if sync_engine.progress.is_running:
        return {"status": "already_running"}
    credentials = {
        "username": session.get("casino_username", ""),
        "password": session.get("casino_password", ""),
    }
    asyncio.create_task(sync_engine.sync_all(credentials))
    return {"status": "started", "total_domains": len(sync_engine.domains)}


@app.post("/api/logout")
async def logout(request: Request):
    token = request.cookies.get("session_token") or ""
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if token and token in SESSIONS:
        del SESSIONS[token]
    response = JSONResponse({"status": "logged_out"})
    response.delete_cookie("session_token")
    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
