from pydantic import BaseModel, ConfigDict
from typing import List
from app.schemas.chat import Message


class AdminSession(BaseModel):
    session_id: str
    messages: List[Message]

    model_config = ConfigDict(from_attributes=True)
