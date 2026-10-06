'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Account = { id:string; domain:string; display_name:string; registered:boolean; supported:boolean; status:string; balance:number|null; bonus:number|null; currency:string|null; last_successful_fetch:string|null; last_fetch_status:string; last_error:string|null }

export default function Home() {
  const supabase = createClient()
  const [user, setUser] = useState<string | null>(null)
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [domain, setDomain] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user?.phone ?? user?.email ?? null)
    if (!user) return
    const response = await fetch('/api/accounts')
    if (response.ok) setAccounts((await response.json()).accounts)
  }
  useEffect(() => { load() }, [])

  async function signIn(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ phone: mobile, password })
    setBusy(false); setPassword('')
    setMessage(error ? 'Invalid mobile number or password.' : 'Signed in securely.')
    if (!error) load()
  }
  async function signInWithGoogle() {
    setBusy(true); setMessage('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setBusy(false); setMessage('Google sign-in is currently unavailable.') }
  }
  async function signOut() { await supabase.auth.signOut(); setUser(null); setAccounts([]) }
  async function addAccount(event: FormEvent) {
    event.preventDefault(); if (!domain.trim()) return
    setBusy(true); const response = await fetch('/api/accounts', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ domain }) }); const data = await response.json(); setBusy(false)
    setMessage(response.ok ? 'Account added as unsupported until an approved adapter is configured.' : data.error); setDomain(''); if (response.ok) load()
  }
  async function fetchAccount(id:string) {
    setAccounts(items => items.map(item => item.id === id ? {...item, last_fetch_status:'FETCHING'} : item))
    const response = await fetch(`/api/accounts/${id}/fetch`, { method:'POST' }); const data = await response.json(); setMessage(data.error ?? 'Live data unavailable'); await load()
  }
  const balance = accounts.reduce((sum, item) => sum + (item.last_fetch_status === 'LIVE' && item.balance ? item.balance : 0), 0)
  const bonus = accounts.reduce((sum, item) => sum + (item.last_fetch_status === 'LIVE' && item.bonus ? item.bonus : 0), 0)

  if (!user) return <main className="shell auth"><div className="brand">PERSONAL BONUS HUB</div><section className="panel"><p className="eyebrow">PRIVATE ACCOUNT ACCESS</p><h1>Secure sign in</h1><p className="muted">Use the mobile number registered with your account. Your password is sent only to Supabase Auth and is never stored by this dashboard.</p><form onSubmit={signIn}><label>Mobile number<input type="tel" inputMode="tel" autoComplete="tel" placeholder="+61 4xx xxx xxx" value={mobile} onChange={e=>setMobile(e.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></label><button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form><button className="secondary oauth" type="button" onClick={signInWithGoogle} disabled={busy}>Continue with Google</button>{message && <p className="notice">{message}</p>}</section></main>

  return <main className="shell"><header><div><div className="brand">PERSONAL BONUS HUB</div><p className="muted">Live account monitor · {user}</p></div><button className="secondary" onClick={signOut}>Sign out</button></header><section className="summary"><div><span>Total current balance</span><strong>{balance.toFixed(2)} AUD</strong><small>Only verified live values</small></div><div><span>Total available bonus</span><strong>{bonus.toFixed(2)} AUD</strong><small>Only verified live values</small></div></section><section className="panel"><div className="section-head"><div><p className="eyebrow">MASTER ACCOUNT LIST</p><h2>Accounts</h2></div><form onSubmit={addAccount} className="add"><input aria-label="Domain" placeholder="add domain" value={domain} onChange={e=>setDomain(e.target.value)} /><button disabled={busy}>Add</button></form></div><p className="muted">Credentials are never requested or stored here. Live fetch is enabled only for legitimate, supported provider APIs.</p><div className="cards">{accounts.length === 0 ? <div className="empty">No personal accounts registered yet.</div> : accounts.map(account => <article className="account" key={account.id}><div><h3>{account.display_name}</h3><p className="domain">{account.domain}</p></div><span className={`status ${account.last_fetch_status.toLowerCase()}`}>{account.last_fetch_status.replaceAll('_',' ')}</span><div className="values"><div><small>Balance</small><strong>{account.balance == null ? 'Live data unavailable' : `${account.balance.toFixed(2)} ${account.currency ?? 'AUD'}`}</strong></div><div><small>Bonus</small><strong>{account.bonus == null ? 'Live data unavailable' : `${account.bonus.toFixed(2)} ${account.currency ?? 'AUD'}`}</strong></div></div><div className="card-foot"><small>{account.last_successful_fetch ? `Last fetched ${new Date(account.last_successful_fetch).toLocaleString()}` : (account.last_error ?? 'No successful live fetch')}</small><button className="secondary" onClick={()=>fetchAccount(account.id)} disabled={account.last_fetch_status === 'FETCHING'}>{account.last_fetch_status === 'FETCHING' ? 'Fetching…' : 'Fetch now'}</button></div></article>)}</div></section>{message && <div className="notice">{message}</div>}<footer>Live data unavailable is intentional when no approved adapter exists. No fabricated balances are shown.</footer></main>
}
