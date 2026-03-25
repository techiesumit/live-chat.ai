# app/services/event_service.py

from sqlalchemy.orm import Session
from typing import Optional

from app.models.event import ChatEvent
from app.models.session import ChatSession
from app.models.user import User
from app.core.config import settings


def record_event(
    db: Session,
    event_type: str,
    session: Optional[ChatSession] = None,
    user: Optional[User] = None,
    detail: Optional[str] = None,
) -> ChatEvent:
    event = ChatEvent(
        session_id=session.id if session else None,
        user_id=user.id if user else None,
        event_type=event_type,
        detail=detail,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # ── Future AWS event pipeline hook ────────────────────────────
    if settings.event_pipeline == "eventbridge":
        # TODO: publish to AWS EventBridge
        pass
    elif settings.event_pipeline == "kinesis":
        # TODO: publish to AWS Kinesis stream
        pass

    return event
