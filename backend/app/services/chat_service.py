from sqlalchemy.orm import Session
from app.models.session import ChatSession
from app.models.message import ChatMessage
from app.schemas.chat import ChatResponse, Message
from app.services.event_service import record_event
from typing import List


def get_or_create_session(db: Session, session_token: str) -> ChatSession:
    session = (
        db.query(ChatSession)
        .filter(ChatSession.session_token == session_token)
        .first()
    )
    if session is None:
        session = ChatSession(session_token=session_token)
        db.add(session)
        db.commit()
        db.refresh(session)
    return session


def add_message(
    db: Session,
    session: ChatSession,
    role: str,
    text: str,
) -> ChatMessage:
    msg = ChatMessage(session_id=session.id, role=role, text=text)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def build_response(
    session_token: str,
    messages: List[ChatMessage],
    escalated: bool,
) -> ChatResponse:
    return ChatResponse(
        session_id=session_token,
        messages=[Message.model_validate(m) for m in messages],
        escalated=escalated,
    )


def resolve_faq(text: str) -> str:
    lower = text.lower()
    if "claim" in lower:
        return "For claims, this demo bot would show claim status (mock)."
    if "provider" in lower:
        return "To find a provider, this demo bot would query a provider directory (mock)."
    if "benefit" in lower:
        return "Benefits info would come from a benefits API in a real system (mock)."
    return "I'm a simple demo bot. Try asking about claims, providers, or benefits."


def handle_chat(db: Session, session_id: str, message: str) -> ChatResponse:
    session = get_or_create_session(db, session_id)

    # Persist user message
    add_message(db, session, role="user", text=message)
    record_event(db, event_type="MESSAGE_SENT", session=session, detail=message)

    lower = message.lower()

    # Escalation
    if "agent" in lower or "escalate" in lower:
        bot_msg = add_message(
            db, session,
            role="bot",
            text="I'm escalating you to a live agent (simulated).",
        )
        agent_msg = add_message(
            db, session,
            role="
