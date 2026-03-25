# app/services/__init__.py

from app.services.event_service import record_event
from app.services.chat_service import (
    get_or_create_session,
    add_message,
    build_response,
    resolve_faq,
    handle_chat,
)
from app.services.user_service import (
    get_or_create_demo_user,
    link_user_to_session,
    attach_demo_user,
)

__all__ = [
    # event
    "record_event",
    # chat
    "get_or_create_session",
    "add_message",
    "build_response",
    "resolve_faq",
    "handle_chat",
    # user
    "get_or_create_demo_user",
    "link_user_to_session",
    "attach_demo_user",
]
