"""Pydantic models for the Casino Balance Vault."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field

SyncStatus = Literal[
    "queued",
    "syncing",
    "live",
    "auth_failed",
    "unsupported",
    "error",
    "no_account",
]


class Domain(BaseModel):
    id: str
    domain: str
    name: str
    referral_url: Optional[str] = None
    http_status: str = ""
    http_status_label: str = "unknown"
    api_profile: str = "auto"
    last_sync: Optional[datetime] = None
    current_status: SyncStatus = "queued"


class Bonus(BaseModel):
    name: str = "Unknown Bonus"
    amount: Optional[float] = None
    currency: Optional[str] = None
    bonus_type: str = "non_deposit"
    eligible: bool = True
    expiry: Optional[str] = None
    raw: Optional[dict] = None


class BalanceData(BaseModel):
    balance: Optional[float] = None
    currency: str = "AUD"
    bonuses: list[Bonus] = Field(default_factory=list)


class SiteSnapshot(BaseModel):
    site_id: str
    domain: str
    fetched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    balance: Optional[float] = None
    currency: str = "AUD"
    bonuses: list[Bonus] = Field(default_factory=list)
    status: SyncStatus = "queued"
    message: Optional[str] = None
    api_profile_used: Optional[str] = None
    response_ms: Optional[int] = None


class LoginCredentials(BaseModel):
    username: str
    password: str
    vault_passphrase: Optional[str] = None


class SyncProgress(BaseModel):
    total: int = 0
    completed: int = 0
    succeeded: int = 0
    failed: int = 0
    unsupported: int = 0
    in_progress: int = 0
    queued: int = 0
    is_running: bool = False
