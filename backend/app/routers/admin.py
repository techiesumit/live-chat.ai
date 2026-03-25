# app/routers/admin.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db
from app.models.session import ChatSession
from app.models.event import ChatEvent
from app.schemas.chat import Message
from app.schemas.admin import AdminSession
from app.schemas.event import EventOut

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).all()
    return {
        "sessions": [
            {
                "session_id": s.session_token,
                "message_count": len(s.messages),
                "user_id": s.user_id,
                "created_at": s.created_at,
            }
            for s in sessions
        ]
    }


@router.get("/sessions/{session_id}", response_model=AdminSession)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
) -> AdminSession:
    session = (
        db.query(ChatSession)
        .filter(ChatSession.session_token == session_id)
        .first()
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    return AdminSession(
        session_id=session.session_token,
        messages=[Message.model_validate(m) for m in session.messages],
    )


@router.get("/events", response_model=List[EventOut])
def list_events(
    limit: int = 100,
    db: Session = Depends(get_db),
) -> List[EventOut]:
    events = (
        db.query(ChatEvent)
        .order_by(ChatEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    return [EventOut.model_validate(e) for e in events]
