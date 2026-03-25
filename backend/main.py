from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from sqlalchemy.orm import Session

from database import SessionLocal, engine, Base
from models import User, ChatSession, ChatMessage, ChatEvent
from pydantic import BaseModel, ConfigDict

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- DB dependency ----------


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- Pydantic models (v2) ----------


class Message(BaseModel):
    role: str
    text: str

    model_config = ConfigDict(from_attributes=True)


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    session_id: str
    messages: List[Message]
    escalated: bool


class AdminSession(BaseModel):
    session_id: str
    messages: List[Message]

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: int
    name: str | None = None
    email: str | None = None
    external_id: str | None = None

    model_config = ConfigDict(from_attributes=True)


class EventOut(BaseModel):
    id: int
    event_type: str
    session_id: int | None = None
    user_id: int | None = None
    detail: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Helper functions ----------


def get_or_create_session(db: Session, session_token: str) -> ChatSession:
    session = (
        db.query(ChatSession).filter(ChatSession.session_token == session_token).first()
    )
    if session is None:
        session = ChatSession(session_token=session_token)
        db.add(session)
        db.commit()
        db.refresh(session)
    return session


def add_message(db: Session, session: ChatSession, role: str, text: str) -> ChatMessage:
    msg = ChatMessage(session_id=session.id, role=role, text=text)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def build_response(
    session_token: str, messages: List[ChatMessage], escalated: bool
) -> ChatResponse:
    return ChatResponse(
        session_id=session_token,
        messages=[Message.model_validate(m) for m in messages],
        escalated=escalated,
    )


def record_event(
    db: Session,
    event_type: str,
    session: ChatSession | None = None,
    user: User | None = None,
    detail: str | None = None,
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
    return event


# ---------- Endpoints ----------


@app.post("/api/user", response_model=UserOut)
def attach_demo_user(session_id: str, db: Session = Depends(get_db)):
    """
    Attach a demo user to the current chat session.
    In a real system this would come from Cognito/SSO claims.
    """
    chat_session = get_or_create_session(db, session_id)

    # For demo, always use the same "member"
    external_id = "DEMO-MEMBER-123"
    user = db.query(User).filter(User.external_id == external_id).first()
    if user is None:
        user = User(
            external_id=external_id,
            name="Demo Member",
            email="demo.member@example.com",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Link session to user if not already
    if chat_session.user_id != user.id:
        chat_session.user_id = user.id
        db.add(chat_session)
        db.commit()

    # Record login event
    record_event(
        db,
        event_type="LOGIN",
        session=chat_session,
        user=user,
        detail="Demo member login attached to session",
    )

    return UserOut.model_validate(user)


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    session = get_or_create_session(db, req.session_id)

    # Save user message and event
    add_message(db, session, role="user", text=req.message)
    record_event(
        db,
        event_type="MESSAGE_SENT",
        session=session,
        detail=req.message,
    )

    lower = req.message.lower()

    # Escalation path
    if "agent" in lower or "escalate" in lower:
        bot_msg = add_message(
            db,
            session,
            role="bot",
            text="I’m escalating you to a live agent (simulated).",
        )
        agent_msg = add_message(
            db,
            session,
            role="agent",
            text="Hi, I am the live agent (simulated). How can I help?",
        )
        record_event(
            db,
            event_type="ESCALATION",
            session=session,
            detail="User requested agent escalation",
        )
        return build_response(req.session_id, [bot_msg, agent_msg], escalated=True)

    # Simple FAQ logic
    if "claim" in lower:
        answer = "For claims, this demo bot would show claim status (mock)."
    elif "provider" in lower:
        answer = (
            "To find a provider, this demo bot would query a provider directory (mock)."
        )
    elif "benefit" in lower:
        answer = "Benefits info would come from a benefits API in a real system (mock)."
    else:
        answer = (
            "I’m a simple demo bot. Try asking about claims, providers, or benefits."
        )

    bot_msg = add_message(db, session, role="bot", text=answer)
    return build_response(req.session_id, [bot_msg], escalated=False)


@app.get("/api/admin/sessions")
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).all()
    return {
        "sessions": [
            {
                "session_id": s.session_token,
                "message_count": len(s.messages),
            }
            for s in sessions
        ]
    }


@app.get("/api/admin/sessions/{session_id}", response_model=AdminSession)
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = (
        db.query(ChatSession).filter(ChatSession.session_token == session_id).first()
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    return AdminSession(
        session_id=session.session_token,
        messages=[Message.model_validate(m) for m in session.messages],
    )


@app.get("/api/admin/events", response_model=List[EventOut])
def list_events(limit: int = 100, db: Session = Depends(get_db)):
    events = (
        db.query(ChatEvent).order_by(ChatEvent.created_at.desc()).limit(limit).all()
    )
    return [EventOut.model_validate(e) for e in events]
