# Casino Balance Vault

Live casino bonus and balance fetch feature that displays all domains from the master list in sync.
Activated by a simple secure credentials login — sync starts automatically.

## How it works

1. Open the login page (single entry point)
2. Enter your dashboard password + casino credentials (username + password)
3. Login activates an automatic sync across all 679 domains
4. Dashboard displays ONLY verified live values:
   - Real wallet balances (from successful authenticated API responses)
   - Named eligible non-deposit bonuses
5. Domains without verified data show clear status: "Auth failed", "Unsupported", "Needs profile"

## Key principles

- **Only verified data is displayed.** Never shows fake, stale, or guessed values.
- **Fully automatic.** After login, sync runs across all domains — no manual entry per domain.
- **Profile-driven.** Uses known casino API profiles (from the Tampermonkey script patterns) to
  authenticate and fetch data. Domains without a matching profile are clearly labeled.
- **Live sync.** Bounded concurrency (20 domains at a time) with real-time progress updates.
- **Secure.** Dashboard password protection, session-based auth, security headers.

## Run locally

```bash
cd casino_balance_vault
pip install -r requirements.txt
cp .env.example .env
# Edit .env to set your dashboard password
uvicorn app.main:app --host 0.0.0.0 --port 8080
```

## API

- `GET /` — Login page (entry point)
- `POST /api/login` — Login with dashboard password + casino credentials (starts auto-sync)
- `GET /dashboard` — Live dashboard
- `GET /api/dashboard` — Full dashboard data (all domains + snapshots)
- `GET /api/sync-status` — Current sync progress
- `POST /api/sync-all` — Manually trigger re-sync
- `GET /api/snapshot/{site_id}` — Latest snapshot for a domain
- `GET /api/history/{site_id}` — Sync history for a domain
- `POST /api/logout` — Logout and clear session
- `GET /health` — Health check

## Status types

| Status | Meaning |
|--------|---------|
| `live` | Verified balance/bonus data from authenticated API response in current sync run |
| `last_verified` | Previous sync data (older than 5 min) — labeled with timestamp, not shown as "live" |
| `auth_failed` | Login failed — credentials not accepted by this domain |
| `unsupported` | Login succeeded but no balance/bonus data available via API |
| `needs_profile` | No API profile matched for this domain |
| `error` | Network timeout or other error |
| `queued` | Waiting to be synced |
| `syncing` | Currently being synced |

## Tampermonkey replacement

This web app replaces the Tampermonkey `casino_account_manager.js` script. Instead of a
browser extension with a floating panel, you get a full dashboard accessible via URL.
No script editing needed — just open the page, enter credentials, and sync runs automatically.
