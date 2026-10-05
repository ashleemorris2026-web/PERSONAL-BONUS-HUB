'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight, Check, ChevronDown, CircleHelp, ExternalLink, Gift, Menu, Search, ShieldCheck, Sparkles, X, Zap } from 'lucide-react'

const sites = [
  { domain: 'JACKPOTCITY.COM', status: 'LIVE', bonus: '$500 welcome bonus', tone: 'cyan' },
  { domain: 'OZWINNERS.COM', status: 'LIVE', bonus: '100% deposit match', tone: 'purple' },
  { domain: 'AUSSIEPLAY.COM', status: 'ACTIVE', bonus: '15 free spins', tone: 'pink' },
  { domain: 'SPINPALACE.COM', status: 'LIVE', bonus: '$250 bonus cash', tone: 'cyan' },
  { domain: 'RUBYFORTUNE.COM', status: 'ACTIVE', bonus: '10% weekly rebate', tone: 'purple' },
  { domain: 'NEONVEGAS.COM', status: 'LIVE', bonus: '100 free spins', tone: 'pink' },
  { domain: 'LUCKYLAND.COM', status: 'UNVERIFIED', bonus: 'New player offer', tone: 'cyan' },
  { domain: 'CROWNPOKIES.COM', status: 'LIVE', bonus: '$300 matched bonus', tone: 'purple' },
]

function SiteCard({ site }: { site: (typeof sites)[number] }) {
  const [visited, setVisited] = useState(false)
  return (
    <a href={`https://${site.domain.toLowerCase()}`} target="_blank" rel="noreferrer" onClick={() => setVisited(true)} className={`group flex items-center gap-3 rounded-xl border p-3 transition hover:-translate-y-0.5 ${visited ? 'opacity-60' : ''} ${site.tone === 'cyan' ? 'border-cyan-400/20 bg-cyan-400/[0.035]' : site.tone === 'purple' ? 'border-violet-400/20 bg-violet-400/[0.035]' : 'border-fuchsia-400/20 bg-fuchsia-400/[0.035]'}`}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#15151d] text-sm font-black text-cyan-300">{site.domain[0]}</div>
      <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-extrabold text-white group-hover:text-cyan-300">{site.domain}</p><span className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold ${site.status === 'LIVE' ? 'bg-emerald-400/15 text-emerald-300' : site.status === 'ACTIVE' ? 'bg-cyan-400/15 text-cyan-300' : 'bg-amber-400/15 text-amber-300'}`}>{site.status}</span></div><p className="mt-1 truncate text-[11px] text-fuchsia-200/80">{site.bonus}</p></div>
      <ExternalLink className="size-4 shrink-0 text-slate-600 transition group-hover:text-cyan-300" />
    </a>
  )
}

export default function Page() {
  const [query, setQuery] = useState('')
  const [fetcherOpen, setFetcherOpen] = useState(false)
  const [fetched, setFetched] = useState(false)
  const filteredSites = useMemo(() => sites.filter((site) => site.domain.toLowerCase().includes(query.toLowerCase())), [query])

  return <main className="min-h-screen bg-black text-white selection:bg-fuchsia-500/30">
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-12 pt-5 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 py-2"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 via-violet-500 to-fuchsia-500 text-black shadow-[0_0_24px_rgba(0,229,255,.22)]"><Gift className="size-5" /></div><div><p className="text-sm font-black tracking-tight">POKIE<span className="text-cyan-300">FETCH</span></p><p className="text-[10px] uppercase tracking-[.18em] text-slate-500">Australia&apos;s site index</p></div></div><div className="flex items-center gap-2"><button onClick={() => setFetcherOpen(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 via-violet-500 to-fuchsia-500 px-4 py-2.5 text-xs font-black text-black shadow-[0_0_25px_rgba(123,92,255,.25)]"><Zap className="size-3.5" /> Bonus Fetcher</button><button className="rounded-xl border border-white/10 bg-white/[.04] p-2.5 text-slate-300 sm:hidden"><Menu className="size-4" /></button></div></header>

      <section className="py-12 sm:py-16"><div className="max-w-3xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[.06] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-cyan-300"><Sparkles className="size-3" /> Updated daily</div><h1 className="text-4xl font-black leading-[1.04] tracking-[-.04em] sm:text-6xl">THE BEST <span className="bg-gradient-to-r from-cyan-300 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">POKIE SITES</span> IN AUSTRALIA</h1><p className="mt-5 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Browse the latest Australian pokie sites, compare current offers, and use one secure fetch to check your available bonus data.</p></div></section>

      <div className="sticky top-3 z-30 mb-8 rounded-2xl border border-white/10 bg-[#09090bf2] p-2 shadow-2xl backdrop-blur-xl"><div className="flex flex-wrap items-center gap-2"><button className="flex items-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-300/10 px-3 py-2.5 text-xs font-bold text-cyan-200"><ShieldCheck className="size-3.5" /> Trusted sites <ChevronDown className="size-3" /></button><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a domain..." className="h-10 w-full rounded-xl border border-white/10 bg-white/[.035] pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50" /></div><span className="w-full border-t border-white/[.06] px-2 pt-2 text-[11px] text-slate-500 sm:w-auto sm:border-0 sm:p-0">Showing <strong className="text-white">{filteredSites.length}</strong> sites <span className="ml-3 text-emerald-300">● Live index</span></span></div></div>

      <section><div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-black">Popular pokie sites <span className="ml-1 rounded-full bg-white/[.08] px-2 py-1 text-xs text-slate-400">{filteredSites.length}</span></h2><p className="mt-1 text-xs text-slate-500">Quick links to currently indexed operators</p></div><button onClick={() => setFetcherOpen(true)} className="hidden items-center gap-1 text-xs font-bold text-cyan-300 sm:flex">Check bonuses <ArrowUpRight className="size-3.5" /></button></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredSites.map((site) => <SiteCard key={site.domain} site={site} />)}</div></section>

      <section className="mt-12 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[.12] via-[#0b0b12] to-fuchsia-500/[.06] p-5 sm:p-7"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-cyan-300">One fetch. Every supported site.</p><h2 className="text-2xl font-black tracking-tight">Your bonus data, in one place.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Check balances, commission, share, referral, rebate and available bonus data without opening every site individually.</p></div><button onClick={() => setFetcherOpen(true)} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-black text-black"><Zap className="size-4" /> Open Bonus Fetcher</button></div></section>

      <section className="mt-10 border-t border-white/10 pt-6 text-center text-xs leading-6 text-slate-500"><p><span className="mr-2 rounded-md border border-rose-400/50 bg-rose-400/10 px-2 py-1 font-black text-rose-300">18+</span> Gamble responsibly. This is an independent directory, not a gambling operator.</p><p className="mt-1">Only play with licensed operators and check the rules in your state or territory.</p></section>
    </div>

    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition ${fetcherOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setFetcherOpen(false)}><div role="dialog" aria-modal="true" aria-labelledby="fetcher-title" className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#0b0b11] shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-white/10 p-5"><div><h2 id="fetcher-title" className="flex items-center gap-2 text-lg font-black"><Zap className="size-5 text-cyan-300" /> Bonus Fetcher</h2><p className="mt-1 text-xs text-slate-500">Securely check supported site data.</p></div><button aria-label="Close bonus fetcher" onClick={() => setFetcherOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X className="size-4" /></button></div><div className="space-y-4 p-5 sm:p-7">{fetched ? <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-5"><div className="flex items-center gap-3 text-emerald-300"><Check className="size-5" /><p className="font-bold">Fetch complete</p></div><p className="mt-2 text-sm text-slate-300">We checked 8 indexed sites. Connect your account to view live balances and bonus details.</p></div> : <><label htmlFor="fetch-email" className="block text-xs font-bold text-slate-300">Account email</label><input id="fetch-email" type="email" placeholder="you@example.com" className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300/50" /><div className="flex items-start gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[.05] p-3 text-xs leading-5 text-slate-400"><CircleHelp className="mt-0.5 size-4 shrink-0 text-amber-300" />Your details stay private and are only used to match supported account records.</div><button onClick={() => setFetched(true)} className="w-full rounded-xl bg-gradient-to-r from-cyan-300 via-violet-500 to-fuchsia-500 py-3 text-sm font-black text-black">Fetch available bonuses</button></>}</div></div></div>
  </main>
}
