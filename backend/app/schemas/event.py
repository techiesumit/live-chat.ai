from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class EventOut(BaseModel):
    id: int
    event_type: str
    session_id: Optional[int] = None
    user_id: Optional[int] = None
    detail: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
