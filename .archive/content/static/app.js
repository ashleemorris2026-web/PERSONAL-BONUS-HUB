/* Casino Balance Vault — Dashboard Frontend
   Auto-polls for live data, only displays verified values. */

let dashboardData = null;
let pollInterval = null;
const POLL_MS = 3000; // Poll every 3 seconds during sync

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    pollInterval = setInterval(loadDashboard, POLL_MS);
});

// ===== LOAD DASHBOARD =====
async function loadDashboard() {
    try {
        const resp = await fetch('/api/dashboard');
        if (resp.status === 401) {
            window.location.href = '/';
            return;
        }
        const data = await resp.json();
        dashboardData = data;
        renderStats(data);
        renderProgress(data);
        renderDomains(data);
    } catch (err) {
        console.error('Dashboard load error:', err);
    }
}

// ===== STATS =====
function renderStats(data) {
    document.getElementById('stat-total').textContent = data.total_domains || 0;
    document.getElementById('stat-live').textContent = data.live_count || 0;

    const balance = data.total_verified_balance;
    document.getElementById('stat-balance').textContent =
        balance !== null && balance !== undefined ? `$${balance.toFixed(2)}` : '—';

    document.getElementById('stat-bonuses').textContent = data.total_bonuses || 0;
    document.getElementById('stat-failed').textContent = data.auth_failed_count || 0;
    document.getElementById('stat-unsupported').textContent =
        (data.unsupported_count || 0) + (data.needs_profile_count || 0) + (data.error_count || 0);
}

// ===== PROGRESS BAR =====
function renderProgress(data) {
    const bar = document.getElementById('sync-progress-bar');
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    const p = data.progress || {};

    if (data.is_running || (p.total > 0 && p.completed < p.total)) {
        bar.style.display = 'block';
        const pct = p.total > 0 ? (p.completed / p.total) * 100 : 0;
        fill.style.width = `${pct}%`;
        text.textContent = `Syncing: ${p.completed || 0}/${p.total || 0} domains — ` +
            `${p.succeeded || 0} live, ${p.failed || 0} failed, ${p.unsupported || 0} unsupported`;
    } else if (p.total > 0 && p.completed >= p.total) {
        bar.style.display = 'block';
        fill.style.width = '100%';
        text.textContent = `Sync complete: ${p.succeeded || 0} live, ${p.failed || 0} auth failed, ${p.unsupported || 0} unsupported`;
        setTimeout(() => { bar.style.display = 'none'; }, 10000);
    } else {
        bar.style.display = 'none';
    }
}

// ===== DOMAIN CARDS =====
function renderDomains(data) {
    const grid = document.getElementById('domain-grid');
    const domains = data.domains || [];

    if (domains.length === 0) {
        grid.innerHTML = '<div class="loading-msg">Loading domains...</div>';
        return;
    }

    // Apply filters
    const search = (document.getElementById('domain-search')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('status-filter')?.value || 'all';

    const filtered = domains.filter(item => {
        const d = item.domain;
        const snap = item.snapshot;

        // Search filter
        if (search && !d.domain.toLowerCase().includes(search)) return false;

        // Status filter
        if (statusFilter !== 'all') {
            const currentStatus = snap ? snap.status : 'needs_profile';
            if (currentStatus !== statusFilter) return false;
        }

        return true;
    });

    // Sort: live first, then by domain name
    filtered.sort((a, b) => {
        const aStatus = a.snapshot?.status || 'needs_profile';
        const bStatus = b.snapshot?.status || 'needs_profile';
        if (aStatus === 'live' && bStatus !== 'live') return -1;
        if (bStatus === 'live' && aStatus !== 'live') return 1;
        return a.domain.domain.localeCompare(b.domain.domain);
    });

    grid.innerHTML = filtered.map(item => {
        const d = item.domain;
        const snap = item.snapshot;
        return renderDomainCard(d, snap);
    }).join('');
}

function renderDomainCard(domain, snapshot) {
    const status = snapshot ? snapshot.status : 'needs_profile';
    const statusClass = `status-${status}`;
    const statusLabel = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    let balanceHtml = '';
    let bonusHtml = '';
    let timeHtml = '';

    if (snapshot) {
        // Only show balance if it's a verified live value
        if (snapshot.balance !== null && snapshot.balance !== undefined) {
            const curr = snapshot.currency || 'AUD';
            const symbol = curr === 'AUD' ? '$' : '';
            balanceHtml = `<div class="balance-display">${symbol}${snapshot.balance.toFixed(2)} ${curr}</div>`;
        } else {
            balanceHtml = `<div class="balance-display no-balance">No balance available</div>`;
        }

        // Only show verified bonuses
        if (snapshot.bonuses && snapshot.bonuses.length > 0) {
            bonusHtml = snapshot.bonuses.map(b => {
                const amt = b.amount !== null && b.amount !== undefined ? `: $${b.amount.toFixed(2)}` : '';
                const expiry = b.expiry ? ` <span style="color:var(--muted);font-size:11px">— expires ${b.expiry}</span>` : '';
                return `<div class="bonus-item"><span class="bonus-name">${escHtml(b.name)}</span>` +
                    `<span class="bonus-amount">${amt}</span>${expiry}</div>`;
            }).join('');
        }

        // Show fetch time
        if (snapshot.fetched_at) {
            const time = new Date(snapshot.fetched_at).toLocaleTimeString();
            timeHtml = `<div class="snapshot-time">Verified: ${time}</div>`;
        }

        if (snapshot.message) {
            timeHtml += `<div class="snapshot-time" style="color:var(--muted)">${escHtml(snapshot.message)}</div>`;
        }
    } else {
        balanceHtml = '<div class="balance-display no-balance">Awaiting sync</div>';
    }

    return `
        <div class="domain-card">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                <div>
                    <div class="domain-name">${escHtml(domain.domain)}</div>
                    <div class="domain-url">${escHtml(domain.referral_url || '')}</div>
                </div>
                <span class="status-badge ${statusClass}">${statusLabel}</span>
            </div>
            ${balanceHtml}
            ${bonusHtml}
            ${timeHtml}
        </div>
    `;
}

// ===== FILTERS =====
function filterDomains() {
    if (dashboardData) renderDomains(dashboardData);
}

// ===== ACTIONS =====
async function resyncAll() {
    const btn = document.getElementById('resync-btn');
    btn.disabled = true;
    btn.textContent = 'Syncing...';
    try {
        await fetch(`${API_BASE}/api/sync-all`, { method: 'POST' });
    } catch (err) {
        console.error('Resync error:', err);
    }
    btn.disabled = false;
    btn.textContent = 'Re-Sync All';
}

async function logout() {
    await fetch(`${API_BASE}/api/logout`, { method: 'POST' });
    window.location.href = `${API_BASE}/`;
}

// ===== UTILS =====
function escHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}
