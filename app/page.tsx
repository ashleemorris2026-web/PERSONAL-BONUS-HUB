'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import catalog from '../data/domains.json'
import './styles.css'

type Item = (typeof catalog)[number] & { status?: string; statusCode?: number | null; checkedAt?: string; responseMs?: number; message?: string }
type SyncResponse = { results: Item[]; syncedAt: string; summary: { total: number; live: number; issues: number } }

const initialItems: Item[] = catalog.map((item) => ({ ...item, status: item.http_status === '200' ? 'live' : 'pending', message: item.http_status_label }))

export default function Home() {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [autoSync, setAutoSync] = useState(true)
  const [selected, setSelected] = useState<Item | null>(null)

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/sync', { cache: 'no-store' })
      const data = (await response.json()) as SyncResponse
      setItems(data.results)
      setSyncedAt(data.syncedAt)
    } finally { setSyncing(false) }
  }, [])

  useEffect(() => { sync() }, [sync])
  useEffect(() => { if (!autoSync) return; const timer = window.setInterval(sync, 60000); return () => window.clearInterval(timer) }, [autoSync, sync])

  const visible = useMemo(() => items.filter((item) => item.domain.includes(query.toLowerCase()) && (filter === 'all' || item.status === filter)), [items, query, filter])
  const live = items.filter((item) => item.status === 'live').length
  const issues = items.filter((item) => item.status === 'error').length
  const lastSync = syncedAt ? new Date(syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Waiting'

  return <main className="shell">
    <header className="topbar"><div className="brand"><div className="brand-mark">PB</div><div><p className="eyebrow">PERSONAL BONUS HUB</p><h1>Live sync control room</h1></div></div><div className="top-actions"><span className={`connection ${syncing ? 'is-syncing' : ''}`}><i />{syncing ? 'Syncing now' : 'Connected'}</span><button className="ghost-btn" onClick={() => setAutoSync(!autoSync)}>{autoSync ? 'Auto-sync on' : 'Auto-sync off'}</button><button className="primary-btn" onClick={sync} disabled={syncing}>{syncing ? 'Fetching…' : 'Sync all'}</button></div></header>
    <section className="intro"><div><p className="kicker">VERIFIED NETWORK MONITOR</p><h2>Know what&apos;s live,<br /><em>at a glance.</em></h2><p className="lede">A real-time view of every connected bonus destination. We only surface what the sync runner can verify right now.</p></div><div className="sync-note"><span className="pulse" /><div><strong>Live fetch active</strong><p>Last checked {lastSync} · refreshes every 60s</p></div></div></section>
    <section className="stats"><Stat label="Destinations" value={items.length} detail="in master catalog"/><Stat label="Reachable now" value={live} detail={`${items.length ? Math.round(live / items.length * 100) : 0}% of network`} accent="green"/><Stat label="Needs attention" value={issues} detail="unavailable or timed out" accent="amber"/><Stat label="Sync latency" value={items.length ? `${Math.round(items.reduce((sum, item) => sum + (item.responseMs || 0), 0) / items.length)}ms` : '—'} detail="average response"/></section>
    <section className="workspace"><div className="section-heading"><div><p className="kicker">NETWORK INVENTORY</p><h3>All destinations <span>{visible.length}</span></h3></div><div className="controls"><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search domains" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All statuses</option><option value="live">Reachable</option><option value="error">Needs attention</option><option value="pending">Pending</option></select></div></div><div className="table-wrap"><div className="table-head"><span>Destination</span><span>Status</span><span>HTTP</span><span>Response</span><span>Last checked</span><span /></div>{visible.slice(0, 80).map((item) => <button className="row" key={item.id} onClick={() => setSelected(item)}><span className="destination"><span className="site-icon">{item.name.slice(0, 1)}</span><span><strong>{item.name}</strong><small>{item.domain}</small></span></span><span><Status status={item.status || 'pending'} /></span><span className="muted">{item.statusCode || '—'}</span><span className="muted">{item.responseMs ? `${item.responseMs}ms` : '—'}</span><span className="muted">{item.checkedAt ? new Date(item.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not checked'}</span><span className="arrow">→</span></button>)}</div></section>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><aside className="drawer" onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setSelected(null)}>×</button><p className="kicker">DESTINATION DETAIL</p><div className="drawer-title"><span className="site-icon large">{selected.name.slice(0, 1)}</span><div><h3>{selected.name}</h3><p>{selected.domain}</p></div></div><Status status={selected.status || 'pending'} /><dl><div><dt>Referral URL</dt><dd>{selected.referral_url}</dd></div><div><dt>HTTP status</dt><dd>{selected.statusCode || 'Not available'}</dd></div><div><dt>Response time</dt><dd>{selected.responseMs ? `${selected.responseMs}ms` : 'Not available'}</dd></div><div><dt>Sync message</dt><dd>{selected.message || 'Queued for live fetch'}</dd></div></dl><a className="visit" href={selected.referral_url} target="_blank" rel="noreferrer">Open destination <span>↗</span></a></aside></div>}
  </main>
}
function Stat({ label, value, detail, accent = '' }: { label: string; value: string | number; detail: string; accent?: string }) { return <div className={`stat ${accent}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div> }
function Status({ status }: { status: string }) { const label = status === 'live' ? 'Reachable' : status === 'error' ? 'Needs attention' : 'Pending'; return <span className={`status ${status}`}><i />{label}</span> }
