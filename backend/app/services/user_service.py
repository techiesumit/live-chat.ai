# app/services/user_service.py

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.session import ChatSession
from app.schemas.user import UserOut
from app.services.chat_service import get_or_create_session
from app.services.event_service import record_event


DEMO_EXTERNAL_ID = "DEMO-MEMBER-123"
DEMO_NAME = "Demo Member"
DEMO_EMAIL = "demo.member@example.com"


def get_or_create_demo_user(db: Session) -> User:
    user = (
        db.query(User)
        .filter(User.external_id == DEMO_EXTERNAL_ID)
        .first()
    )
    if user is None:
        user = User(
            external_id=DEMO_EXTERNAL_ID,
            name=DEMO_NAME,
            email=DEMO_EMAIL,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def link_user_to_session(
    db: Session,
    session: ChatSession,
    user: User,
) -> None:
    if session.user_id != user.id:
        session.user_id = user.id
        db.add(session)
        db.commit()


def attach_demo_user(db: Session, session_id: str) -> UserOut:
    chat_session = get_or_create_session(db, session_id)
    user = get_or_create_demo_user(db)
    link_user_to_session(db, chat_session, user)
    record_event(
        db,
        event_type="LOGIN",
        session=chat_session,
        user=user,
        detail="Demo member login attached to session",
    )
    return UserOut.model_validate(user)
