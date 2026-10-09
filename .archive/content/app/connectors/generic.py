"""Generic casino connector - profile-driven, not blind guessing.
Only returns balance/bonus data from verified authenticated API responses."""
from __future__ import annotations

import time
from typing import Optional

import httpx

from app.connectors.base import API_PROFILES
from app.models import BalanceData, Bonus


class GenericCasinoConnector:
    """
    Connector that tries each known API profile to find the one that works
    for a given casino domain. Only returns data from verified authenticated
    responses — never manufactures or guesses values.
    """

    def __init__(self, domain: str):
        self.domain = domain
        # Always use the domain origin, never referral URLs with paths like /RF...
        self.base_url = f"https://{domain}"
        self.timeout = 12.0
        self._working_profile: Optional[str] = None

    def _full_url(self, endpoint: str) -> str:
        if endpoint.startswith("http"):
            return endpoint
        return f"{self.base_url.rstrip('/')}{endpoint}"

    async def login(self, username: str, password: str) -> Optional[str]:
        """Try each API profile's login endpoints. Returns session token or None."""
        async with httpx.AsyncClient(
            timeout=self.timeout,
            verify=False,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        ) as client:
            # If we already know the working profile, try it first
            profiles = API_PROFILES
            if self._working_profile:
                profiles = [p for p in API_PROFILES if p.name == self._working_profile] + API_PROFILES

            for profile in profiles:
                for login_ep in profile.login_endpoints:
                    try:
                        url = self._full_url(login_ep)
                        payload = {
                            "username": username,
                            "email": username,
                            "password": password,
                        }
                        resp = await client.post(url, json=payload)

                        if resp.status_code in (200, 201):
                            data = resp.json()
                            token = self._extract_token(data)
                            if token:
                                self._working_profile = profile.name
                                return token
                        elif resp.status_code == 401:
                            # Right endpoint, wrong credentials — don't try more endpoints
                            return None
                        # 404/405/etc = wrong endpoint, try next
                    except (httpx.TimeoutException, httpx.ConnectError, httpx.HTTPError, Exception):
                        continue

        return None

    def _extract_token(self, data) -> Optional[str]:
        """Extract session token from various response formats."""
        if not isinstance(data, dict):
            return None
        for key in ("token", "access_token", "session_token", "auth_token", "accessToken", "sessionId", "session_id"):
            if data.get(key):
                return str(data[key])
        if "data" in data and isinstance(data["data"], dict):
            for key in ("token", "access_token", "session_token", "auth_token"):
                if data["data"].get(key):
                    return str(data["data"][key])
        return None

    async def fetch_balance(self, session_token: str) -> BalanceData:
        """Fetch balance and bonuses using the working profile.
        Returns empty BalanceData if nothing verified was found."""
        if not self._working_profile:
            return BalanceData()

        profile = next((p for p in API_PROFILES if p.name == self._working_profile), None)
        if not profile:
            return BalanceData()

        headers = {
            "Authorization": f"Bearer {session_token}",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }

        result = BalanceData()
        balance_verified = False

        async with httpx.AsyncClient(
            timeout=self.timeout,
            verify=False,
            follow_redirects=True,
            headers=headers,
        ) as client:
            # Try balance endpoints — only set balance if we get a verified response
            for bal_ep in profile.balance_endpoints:
                try:
                    url = self._full_url(bal_ep)
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        balance, currency = self._extract_balance(data)
                        if balance is not None:
                            result.balance = balance
                            result.currency = currency or "AUD"
                            balance_verified = True
                            break
                except (httpx.TimeoutException, httpx.ConnectError, httpx.HTTPError, Exception):
                    continue

            # Try bonus endpoints — only set bonuses if we get a verified response
            for bonus_ep in profile.bonus_endpoints:
                try:
                    url = self._full_url(bonus_ep)
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        bonuses = self._extract_bonuses(data)
                        if bonuses:
                            result.bonuses = bonuses
                            break
                except (httpx.TimeoutException, httpx.ConnectError, httpx.HTTPError, Exception):
                    continue

        # If nothing was verified, return empty — never guess
        if not balance_verified:
            result.balance = None
        return result

    def _extract_balance(self, data) -> tuple[Optional[float], Optional[str]]:
        """Extract balance and currency from verified API response."""
        if not isinstance(data, dict):
            return None, None

        # Direct fields
        for key in ("balance", "amount", "total_balance", "wallet_balance", "real_balance", "real_balance_amount"):
            if data.get(key) is not None:
                try:
                    bal = float(data[key])
                    currency = data.get("currency", data.get("curr", "AUD"))
                    return bal, currency
                except (ValueError, TypeError):
                    continue

        # Nested in data
        if "data" in data and isinstance(data["data"], dict):
            for key in ("balance", "amount", "total_balance", "wallet_balance", "real_balance"):
                if data["data"].get(key) is not None:
                    try:
                        bal = float(data["data"][key])
                        currency = data["data"].get("currency", "AUD")
                        return bal, currency
                    except (ValueError, TypeError):
                        continue

        # Nested in player/user/account/wallet
        for wrapper in ("player", "user", "account", "wallet", "playerInfo"):
            if wrapper in data and isinstance(data[wrapper], dict):
                for key in ("balance", "amount", "total_balance", "real_balance", "wallet_balance"):
                    if data[wrapper].get(key) is not None:
                        try:
                            bal = float(data[wrapper][key])
                            currency = data[wrapper].get("currency", "AUD")
                            return bal, currency
                        except (ValueError, TypeError):
                            continue

        return None, None

    def _extract_bonuses(self, data) -> list[Bonus]:
        """Extract non-deposit bonuses from verified API response."""
        bonuses = []

        if not isinstance(data, dict):
            return bonuses

        # Find the bonus list
        bonus_list = None
        for key in ("bonuses", "promotions", "offers", "rewards", "active_bonuses"):
            if key in data and isinstance(data[key], list):
                bonus_list = data[key]
                break
            if "data" in data and isinstance(data["data"], dict):
                if key in data["data"] and isinstance(data["data"][key], list):
                    bonus_list = data["data"][key]
                    break

        if not bonus_list:
            return bonuses

        for item in bonus_list:
            if not isinstance(item, dict):
                continue

            name = item.get("name", item.get("title", item.get("bonus_name", "Bonus")))
            amount = None
            for amt_key in ("amount", "value", "bonus_amount", "reward", "bonus_value"):
                if item.get(amt_key) is not None:
                    try:
                        amount = float(item[amt_key])
                    except (ValueError, TypeError):
                        pass
                    break

            currency = item.get("currency", "AUD")
            bonus_type = str(item.get("type", item.get("bonus_type", "non_deposit")))
            eligible = item.get("eligible", item.get("is_eligible", True))
            expiry = item.get("expires_at", item.get("expiry", item.get("valid_until", item.get("end_date", None))))

            # Only include non-deposit bonuses
            if "deposit" in bonus_type.lower():
                continue

            bonuses.append(Bonus(
                name=str(name),
                amount=amount,
                currency=currency,
                bonus_type=bonus_type,
                eligible=bool(eligible),
                expiry=str(expiry) if expiry else None,
            ))

        return bonuses
