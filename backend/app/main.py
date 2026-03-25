# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import chat, user, admin
from app import __version__, __description__


# ── App factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
       title="Live Chat Support API",
        description=__description__,
        version=__version__,
    )

    # ── CORS ──────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://127.0.0.1:5173",
            "http://localhost:5173",
        ],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────
    app.include_router(chat.router)
    app.include_router(user.router)
    app.include_router(admin.router)

    # ── Startup ───────────────────────────────────────────────────
    @app.on_event("startup")
    def on_startup() -> None:
        print(f"[startup] runtime_mode   : {settings.runtime_mode}")
        print(f"[startup] database_url   : {settings.database_url}")
        print(f"[startup] llm_provider   : {settings.llm_provider}")
        print(f"[startup] rag_enabled    : {settings.rag_enabled}")
        print(f"[startup] mcp_tools      : {settings.mcp_tools_enabled}")
        print(f"[startup] auth_provider  : {settings.auth_provider}")
        print(f"[startup] event_pipeline : {settings.event_pipeline}")
        Base.metadata.create_all(bind=engine)

    return app


app = create_app()
