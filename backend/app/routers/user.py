# app/routers/user.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.user import UserOut
from app.services.user_service import attach_demo_user

router = APIRouter(prefix="/api", tags=["User"])


@router.post("/user", response_model=UserOut)
def attach_user(
    session_id: str,
    db: Session = Depends(get_db),
) -> UserOut:
    return attach_demo_user(db, session_id)
