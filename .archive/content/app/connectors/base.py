"""Connector base class and API profile definitions."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

import httpx

from app.models import BalanceData, SiteSnapshot


class CasinoConnector(ABC):
    """Base connector interface for casino API integrations."""

    @abstractmethod
    async def login(self, username: str, password: str) -> Optional[str]:
        """Authenticate and return a session token, or None on failure."""
        pass

    @abstractmethod
    async def fetch_balance(self, session_token: str) -> BalanceData:
        """Fetch wallet balance and eligible bonuses."""
        pass


class APIProfile:
    """Defines a casino API profile - endpoint patterns for a platform type."""

    def __init__(
        self,
        name: str,
        login_endpoints: list[str],
        balance_endpoints: list[str],
        bonus_endpoints: list[str],
        auth_type: str = "bearer",
        login_method: str = "POST",
    ):
        self.name = name
        self.login_endpoints = login_endpoints
        self.balance_endpoints = balance_endpoints
        self.bonus_endpoints = bonus_endpoints
        self.auth_type = auth_type
        self.login_method = login_method


# Pre-configured API profiles based on the Tampermonkey script patterns
# These are the known casino platform API patterns
API_PROFILES = [
    APIProfile(
        name="spincity",
        login_endpoints=["/api/auth/login", "/api/login"],
        balance_endpoints=["/account/balance", "/api/account/balance"],
        bonus_endpoints=["/account/bonuses", "/api/account/bonuses"],
        auth_type="bearer",
    ),
    APIProfile(
        name="playersclub",
        login_endpoints=["/api/player/login", "/api/auth/player"],
        balance_endpoints=["/api/player/balance", "/api/wallet/balance"],
        bonus_endpoints=["/api/player/promotions", "/api/player/bonuses"],
        auth_type="bearer",
    ),
    APIProfile(
        name="pokerstars",
        login_endpoints=["/api/auth/session", "/api/login"],
        balance_endpoints=["/account", "/api/account"],
        bonus_endpoints=["/account/promotions", "/api/promotions"],
        auth_type="bearer",
    ),
    APIProfile(
        name="generic_v1",
        login_endpoints=["/api/login", "/api/auth/login", "/api/v1/login"],
        balance_endpoints=["/api/balance", "/api/wallet/balance", "/api/v1/balance"],
        bonus_endpoints=["/api/bonuses", "/api/v1/bonuses", "/api/promotions"],
        auth_type="bearer",
    ),
    APIProfile(
        name="generic_v2",
        login_endpoints=["/api/player/login", "/api/user/login", "/login"],
        balance_endpoints=["/api/player/balance", "/api/user/balance", "/api/me/balance"],
        bonus_endpoints=["/api/player/bonuses", "/api/user/bonuses", "/api/me/bonuses"],
        auth_type="bearer",
    ),
    APIProfile(
        name="whitelabel_v1",
        login_endpoints=["/api/auth/login", "/api/v1/auth/login", "/auth/login"],
        balance_endpoints=["/api/v1/player/balance", "/api/player/wallet", "/api/v1/wallet"],
        bonus_endpoints=["/api/v1/player/bonuses", "/api/player/promotions", "/api/v1/promotions"],
        auth_type="bearer",
    ),
]
