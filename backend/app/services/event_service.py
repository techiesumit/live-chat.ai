from sqlalchemy.orm import Session
from app.models.event import ChatEvent
from app.models.session import ChatSession
from app.models.user import User
from app.core.config import settings
from typing import Optional


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

    # Hook for future AWS event pipeline
    if settings.event_pipeline in ("eventbridge", "kinesis"):
        # TODO: publish to EventBridge / Kinesis in AWS mode
        pass

    return event
