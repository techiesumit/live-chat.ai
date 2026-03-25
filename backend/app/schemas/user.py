from pydantic import BaseModel, ConfigDict
from typing import Optional


class UserOut(BaseModel):
    id: int
    name: Optional[str] = None
    email: Optional[str] = None
    external_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
