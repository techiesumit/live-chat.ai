# app/services/chat_service.py

from sqlalchemy.orm import Session
from typing import List

from app.models.session import ChatSession
from app.models.message import ChatMessage
from app.schemas.chat import ChatResponse, Message
from app.services.event_service import record_event


# ── Session helpers ───────────────────────────────────────────────────────────

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


# ── Message helpers ───────────────────────────────────────────────────────────

def add_message(
    db: Session,
    session: ChatSession,
    role: str,
    text: str,
) -> ChatMessage:
    msg = ChatMessage(
        session_id=session.id,
        role=role,
        text=text,
    )
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


# ── FAQ logic ─────────────────────────────────────────────────────────────────

def resolve_faq(text: str) -> str:
    lower = text.lower()

    if "claim" in lower:
        return (
            "Your latest claim (#CLM-20240312) is currently in 'Processed' status. "
            "The approved amount is $123.45. "
            "In a real system this would call the Claims API."
        )
    if "provider" in lower:
        return (
            "Top in-network providers near Omaha, NE: "
            "Dr. Smith (Primary Care), Dr. Lee (Cardiology), Dr. Patel (Orthopedics). "
            "In a real system this would query the Provider Directory API."
        )
    if "benefit" in lower:
        return (
            "Your plan covers: Primary Care ($20 copay), Specialist ($50 copay), "
            "Emergency Room ($250 copay), Preventive Care (100% covered). "
            "In a real system this would pull from the Benefits API."
        )
    if "deductible" in lower:
        return (
            "Your annual deductible is $1,500 individual / $3,000 family. "
            "You have met $450 so far this year."
        )
    if "copay" in lower or "cost" in lower:
        return (
            "Your copay schedule: PCP $20, Specialist $50, Urgent Care $40, ER $250. "
            "Out-of-pocket max: $5,000 individual / $10,000 family."
        )
    if "network" in lower:
        return (
            "You are enrolled in the Blue Cross PPO network. "
            "You can see any in-network provider without a referral."
        )
    if "prior auth" in lower or "authorization" in lower:
        return (
            "Prior authorization is required for: MRI/CT scans, specialty drugs, "
            "elective surgery, and mental health inpatient stays. "
            "Submit requests via the member portal or call the number on your card."
        )

    return (
        "I can help with claims, providers, benefits, deductibles, copays, "
        "network coverage, and prior authorizations. "
        "What would you like to know?"
    )


# ── Core chat handler ─────────────────────────────────────────────────────────

def handle_chat(
    db: Session,
    session_id: str,
    message: str,
) -> ChatResponse:
    session = get_or_create_session(db, session_id)

    # Persist user message
    add_message(db, session, role="user", text=message)
    record_event(
        db,
        event_type="MESSAGE_SENT",
        session=session,
        detail=message,
    )

    lower = message.lower()

    # ── Escalation path ───────────────────────────────────────────
    if "agent" in lower or "escalate" in lower:
        bot_msg = add_message(
            db,
            session,
            role="bot",
            text="I'm escalating you to a live agent (simulated).",
        )
        agent_msg = add_message(
            db,
            session,
            role="agent",
            text=(
                "Hi, I'm your live support agent (simulated). "
                "I can see your session history. How can I help you today?"
            ),
        )
        record_event(
            db,
            event_type="ESCALATION",
            session=session,
            detail="User requested agent escalation",
        )
        return build_response(
            session_id,
            [bot_msg, agent_msg],
            escalated=True,
        )

    # ── FAQ / keyword path ────────────────────────────────────────
    answer = resolve_faq(message)
    bot_msg = add_message(db, session, role="bot", text=answer)
    record_event(
        db,
        event_type="BOT_RESPONSE",
        session=session,
        detail=answer,
    )

    return build_response(
        session_id,
        [bot_msg],
        escalated=False,
    )
