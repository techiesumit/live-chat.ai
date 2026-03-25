from pydantic import BaseModel, ConfigDict
from typing import List


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
