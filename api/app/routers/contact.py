import logging
import re
from datetime import date
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/contact", tags=["contact"])

ContactTopic = Literal[
    "technical_issue",
    "account_sign_in",
    "privacy_data",
    "subscriptions",
    "general_question",
    "partnership",
    "other",
]

_EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]")


class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(max_length=120)
    email: str = Field(max_length=254)
    topic: ContactTopic
    message: str = Field(max_length=5000)

    @field_validator("name", "email", "message")
    @classmethod
    def trim_and_require_text(cls, value: str) -> str:
        cleaned = _CONTROL_CHARS.sub(" ", value).strip()
        if not cleaned:
            raise ValueError("This field is required")
        return cleaned

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return " ".join(value.split())

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not _EMAIL_PATTERN.fullmatch(value):
            raise ValueError("Enter a valid email address")
        return value

    @field_validator("message")
    @classmethod
    def normalize_message_line_endings(cls, value: str) -> str:
        return value.replace("\r\n", "\n").replace("\r", "\n")


@router.post("", status_code=201)
async def create_contact_message(request: Request, body: ContactMessage):
    # ADR 0015 keeps support available after Beta expiry. Authentication still
    # attaches the message to the requesting user.
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    sb = getattr(request.app.state, "supabase", None)
    if sb is None:
        raise HTTPException(status_code=503, detail="Contact messaging is unavailable right now")

    if not request.app.state.contact_limiter.check_and_increment(user_id, date.today()):
        raise HTTPException(
            status_code=429,
            detail="You have sent several messages today. Please try again tomorrow.",
        )

    row = {"user_id": user_id, **body.model_dump()}
    try:
        result = sb.table("contact_messages").insert(row).execute()
    except Exception:
        # Database errors may include submitted text; avoid logging the exception.
        logger.error("Contact message insert failed for user %s", user_id)
        raise HTTPException(status_code=503, detail="Could not save your message") from None

    if not result.data:
        logger.error("Contact message insert returned no row for user %s", user_id)
        raise HTTPException(status_code=503, detail="Could not save your message")

    return {"id": result.data[0].get("id")}

