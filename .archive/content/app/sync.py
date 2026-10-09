"""Sync engine - fetches verified live data from all domains with bounded concurrency.
Only displays values from successful authenticated API responses in the current sync run.
Old snapshots are labeled with timestamp, never shown as 'live'."""
from __future__ import annotations

import asyncio
import json
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.connectors.generic import GenericCasinoConnector
from app.models import Domain, SiteSnapshot, SyncProgress

MAX_CONCURRENT = 20
SYNC_TIMEOUT = 15.0
FRESHNESS_WINDOW = 300  # 5 minutes — snapshots older than this are NOT "live"


class SyncEngine:
    """Manages live sync across all casino domains."""

    def __init__(self, data_dir: str = "./data", db_path: str = "./data/vault.sqlite3"):
        self.data_dir = data_dir
        self.db_path = db_path
        Path(data_dir).mkdir(parents=True, exist_ok=True)
        self.domains: list[Domain] = []
        self.snapshots: dict[str, SiteSnapshot] = {}
        self.progress = SyncProgress()
        self._semaphore = asyncio.Semaphore(MAX_CONCURRENT)
        self._credentials: dict = {}
        self._sync_task: Optional[asyncio.Task] = None

        self._init_db()
        self._load_domains()
        self._load_latest_snapshots()

    def _init_db(self):
        with self._db() as conn:
            conn.execute("""CREATE TABLE IF NOT EXISTS snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                site_id TEXT NOT NULL,
                domain TEXT NOT NULL,
                fetched_at TEXT NOT NULL,
                balance REAL,
                currency TEXT,
                bonuses_json TEXT,
                status TEXT NOT NULL,
                message TEXT,
                api_profile TEXT,
                response_ms INTEGER
            )""")

    def _db(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _load_domains(self):
        domains_path = Path(self.data_dir) / "domains.json"
        if domains_path.exists():
            with open(domains_path) as f:
                data = json.load(f)
            self.domains = [Domain(**d) for d in data]

    def _load_latest_snapshots(self):
        """Load previous snapshots for history — NOT displayed as 'live'."""
        with self._db() as conn:
            rows = conn.execute("""SELECT s.* FROM snapshots s
                JOIN (SELECT site_id, MAX(id) id FROM snapshots GROUP BY site_id) latest
                ON latest.id = s.id""").fetchall()
        for row in rows:
            bonuses = []
            if row["bonuses_json"]:
                try:
                    bonuses = json.loads(row["bonuses_json"])
                except Exception:
                    pass
            snap = SiteSnapshot(
                site_id=row["site_id"],
                domain=row["domain"],
                fetched_at=datetime.fromisoformat(row["fetched_at"]),
                balance=row["balance"],
                currency=row["currency"] or "AUD",
                bonuses=bonuses,
                status=row["status"],  # Will be marked as stale if old
                message=row["message"],
                api_profile_used=row["api_profile"],
                response_ms=row["response_ms"],
            )
            # Check freshness
            age = (datetime.now(timezone.utc) - snap.fetched_at).total_seconds()
            if age > FRESHNESS_WINDOW:
                snap.status = "last_verified"
                snap.message = f"Last verified: {snap.fetched_at.strftime('%H:%M:%S UTC')}"
            self.snapshots[row["site_id"]] = snap

    def get_domains(self) -> list[Domain]:
        return self.domains

    def set_credentials(self, credentials: dict):
        self._credentials = credentials

    def get_dashboard(self) -> dict:
        """Build dashboard data — only 'live' status means verified this sync run."""
        live_count = 0
        auth_failed_count = 0
        unsupported_count = 0
        error_count = 0
        needs_profile_count = 0
        last_verified_count = 0
        total_verified_balance = 0.0
        total_bonuses = 0

        for domain in self.domains:
            snap = self.snapshots.get(domain.id)
            if snap:
                if snap.status == "live":
                    live_count += 1
                    if snap.balance is not None:
                        total_verified_balance += snap.balance
                    total_bonuses += len(snap.bonuses)
                elif snap.status == "last_verified":
                    last_verified_count += 1
                elif snap.status == "auth_failed":
                    auth_failed_count += 1
                elif snap.status == "unsupported":
                    unsupported_count += 1
                elif snap.status == "error":
                    error_count += 1
                elif snap.status == "needs_profile":
                    needs_profile_count += 1
            else:
                needs_profile_count += 1

        return {
            "total_domains": len(self.domains),
            "live_count": live_count,
            "last_verified_count": last_verified_count,
            "auth_failed_count": auth_failed_count,
            "unsupported_count": unsupported_count,
            "error_count": error_count,
            "needs_profile_count": needs_profile_count,
            "total_verified_balance": round(total_verified_balance, 2) if live_count > 0 else None,
            "total_bonuses": total_bonuses,
            "is_running": self.progress.is_running,
            "progress": self.progress.model_dump(),
            "freshness_window_seconds": FRESHNESS_WINDOW,
            "domains": [
                {
                    "domain": d.model_dump(),
                    "snapshot": self.snapshots[d.id].model_dump(mode="json") if d.id in self.snapshots else None,
                }
                for d in self.domains
            ],
        }

    def _persist(self, snapshot: SiteSnapshot):
        with self._db() as conn:
            conn.execute("""INSERT INTO snapshots
                (site_id, domain, fetched_at, balance, currency, bonuses_json, status, message, api_profile, response_ms)
                VALUES (?,?,?,?,?,?,?,?,?,?)""",
                (
                    snapshot.site_id,
                    snapshot.domain,
                    snapshot.fetched_at.isoformat(),
                    snapshot.balance,
                    snapshot.currency,
                    json.dumps([b.model_dump() for b in snapshot.bonuses]),
                    snapshot.status,
                    snapshot.message,
                    snapshot.api_profile_used,
                    snapshot.response_ms,
                ))

    async def sync_domain(self, domain: Domain, credentials: dict) -> SiteSnapshot:
        """Sync a single domain — only verified API responses produce a 'live' status."""
        async with self._semaphore:
            start_time = time.time()
            domain.current_status = "syncing"
            self.progress.in_progress += 1
            self.progress.queued = max(0, self.progress.queued - 1)

            snapshot = None

            try:
                username = credentials.get("username", "")
                password = credentials.get("password", "")

                if not username or not password:
                    snapshot = SiteSnapshot(
                        site_id=domain.id,
                        domain=domain.domain,
                        status="needs_profile",
                        message="No credentials provided",
                        response_ms=int((time.time() - start_time) * 1000),
                    )
                else:
                    connector = GenericCasinoConnector(domain.domain)

                    # Attempt login
                    token = await asyncio.wait_for(
                        connector.login(username, password),
                        timeout=SYNC_TIMEOUT,
                    )

                    if not token:
                        snapshot = SiteSnapshot(
                            site_id=domain.id,
                            domain=domain.domain,
                            status="auth_failed",
                            message="Login failed — credentials not accepted by this domain",
                            api_profile_used=connector._working_profile,
                            response_ms=int((time.time() - start_time) * 1000),
                        )
                    else:
                        # Fetch balance and bonuses — only verified data
                        balance_data = await asyncio.wait_for(
                            connector.fetch_balance(token),
                            timeout=SYNC_TIMEOUT,
                        )

                        elapsed_ms = int((time.time() - start_time) * 1000)

                        # Only mark as 'live' if we actually got verified data
                        has_balance = balance_data.balance is not None
                        has_bonuses = len(balance_data.bonuses) > 0

                        if has_balance or has_bonuses:
                            snapshot = SiteSnapshot(
                                site_id=domain.id,
                                domain=domain.domain,
                                balance=balance_data.balance,
                                currency=balance_data.currency,
                                bonuses=balance_data.bonuses,
                                status="live",
                                message="Verified live data" + (
                                    "" if has_balance else " — balance not available, bonuses only"
                                ),
                                api_profile_used=connector._working_profile,
                                response_ms=elapsed_ms,
                            )
                        else:
                            snapshot = SiteSnapshot(
                                site_id=domain.id,
                                domain=domain.domain,
                                status="unsupported",
                                message="Login succeeded but no balance or bonus data available via API",
                                api_profile_used=connector._working_profile,
                                response_ms=elapsed_ms,
                            )

            except asyncio.TimeoutError:
                snapshot = SiteSnapshot(
                    site_id=domain.id,
                    domain=domain.domain,
                    status="error",
                    message="Request timed out",
                    response_ms=int((time.time() - start_time) * 1000),
                )
            except Exception as e:
                snapshot = SiteSnapshot(
                    site_id=domain.id,
                    domain=domain.domain,
                    status="error",
                    message=f"Error: {str(e)[:200]}",
                    response_ms=int((time.time() - start_time) * 1000),
                )

            self.snapshots[domain.id] = snapshot
            self._persist(snapshot)
            domain.current_status = snapshot.status

            self.progress.completed += 1
            self.progress.in_progress = max(0, self.progress.in_progress - 1)
            if snapshot.status == "live":
                self.progress.succeeded += 1
            elif snapshot.status == "auth_failed":
                self.progress.failed += 1
            elif snapshot.status == "unsupported":
                self.progress.unsupported += 1
            else:
                self.progress.failed += 1

            return snapshot

    async def sync_all(self, credentials: dict) -> dict:
        """Sync all domains automatically with bounded concurrency."""
        if self.progress.is_running:
            return {"error": "Sync already in progress"}

        self._credentials = credentials
        self.progress = SyncProgress(
            total=len(self.domains),
            queued=len(self.domains),
            is_running=True,
        )

        # Reset domain statuses
        for domain in self.domains:
            domain.current_status = "queued"

        # Create and run all sync tasks — semaphore handles concurrency
        tasks = [
            self.sync_domain(domain, credentials)
            for domain in self.domains
        ]
        await asyncio.gather(*tasks, return_exceptions=True)

        self.progress.is_running = False
        self.progress.queued = 0
        self.progress.in_progress = 0

        return {
            "total": self.progress.total,
            "succeeded": self.progress.succeeded,
            "failed": self.progress.failed,
            "unsupported": self.progress.unsupported,
        }

    def get_history(self, site_id: str, limit: int = 100) -> list[dict]:
        with self._db() as conn:
            rows = conn.execute(
                """SELECT site_id, domain, fetched_at, balance, currency, bonuses_json, status, message, api_profile, response_ms
                   FROM snapshots WHERE site_id=? ORDER BY id DESC LIMIT ?""",
                (site_id, max(1, min(limit, 500))),
            ).fetchall()
        results = []
        for row in rows:
            bonuses = []
            if row["bonuses_json"]:
                try:
                    bonuses = json.loads(row["bonuses_json"])
                except Exception:
                    pass
            results.append({
                "site_id": row["site_id"],
                "domain": row["domain"],
                "fetched_at": row["fetched_at"],
                "balance": row["balance"],
                "currency": row["currency"],
                "bonuses": bonuses,
                "status": row["status"],
                "message": row["message"],
                "api_profile": row["api_profile"],
                "response_ms": row["response_ms"],
            })
        return results
