'use client'

import { useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Gift,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  WalletCards,
  Zap,
} from 'lucide-react'

const programs = [
  { name: 'Chase Sapphire', type: 'Credit card', points: '84,260', value: '$842.60', color: 'bg-blue-500', icon: 'C' },
  { name: 'Amex Membership Rewards', type: 'Credit card', points: '61,480', value: '$614.80', color: 'bg-sky-400', icon: 'A' },
  { name: 'Delta SkyMiles', type: 'Airline', points: '32,850', value: '$328.50', color: 'bg-indigo-500', icon: 'D' },
  { name: 'Marriott Bonvoy', type: 'Hotel', points: '18,420', value: '$147.36', color: 'bg-rose-500', icon: 'M' },
]

const activity = [
  { name: 'Chase Sapphire', detail: 'Balance synced', time: 'Today, 9:42 AM', amount: '+2,450 pts', color: 'bg-blue-500' },
  { name: 'Delta SkyMiles', detail: 'Balance synced', time: 'Yesterday, 6:18 PM', amount: '+1,200 pts', color: 'bg-indigo-500' },
  { name: 'Marriott Bonvoy', detail: 'Redemption', time: 'Jun 18, 2024', amount: '-15,000 pts', color: 'bg-rose-500' },
]

export default function Page() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [synced, setSynced] = useState(false)

  return (
    <main className="min-h-screen bg-[#0b0f14] text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-[232px] border-r border-white/[0.07] bg-[#0d1218] px-4 py-5 lg:block">
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-400 text-black"><Gift className="size-[18px]" strokeWidth={2.5} /></div>
          <span className="text-[15px] font-semibold tracking-tight">Bonus<span className="text-emerald-400">Hub</span></span>
        </div>
        <div className="mt-9 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
          {[
            { label: 'Overview', icon: LayoutDashboard },
            { label: 'My programs', icon: WalletCards },
            { label: 'Opportunities', icon: Sparkles },
          ].map(({ label, icon: Icon }) => <button key={label} onClick={() => setActiveTab(label)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${activeTab === label ? 'bg-emerald-400/10 font-medium text-emerald-300' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'}`}><Icon className="size-[17px]" />{label}{label === 'Opportunities' && <span className="ml-auto rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[10px] text-emerald-300">3</span>}</button>)}
        </div>
        <div className="mt-8 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Manage</p>
          {[{ label: 'Sync adapters', icon: RefreshCw }, { label: 'Settings', icon: Settings2 }].map(({ label, icon: Icon }) => <button key={label} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"><Icon className="size-[17px]" />{label}</button>)}
        </div>
        <div className="absolute bottom-5 left-4 right-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><div className="flex items-center gap-2"><div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-[11px] font-bold text-orange-950">AM</div><div className="min-w-0"><p className="truncate text-xs font-medium text-slate-200">Alex Morgan</p><p className="truncate text-[10px] text-slate-500">Personal account</p></div><MoreHorizontal className="ml-auto size-4 text-slate-500" /></div></div>
      </aside>

      <section className="lg:pl-[232px]">
        <header className="flex h-[68px] items-center justify-between border-b border-white/[0.07] px-5 sm:px-8"><div className="flex items-center gap-3 lg:hidden"><div className="flex size-8 items-center justify-center rounded-lg bg-emerald-400 text-black"><Gift className="size-[18px]" /></div></div><div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex"><span>Workspace</span><span className="text-slate-600">/</span><span className="text-slate-200">Overview</span></div><div className="ml-auto flex items-center gap-2"><button className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"><Search className="size-[18px]" /></button><button className="relative rounded-lg p-2 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"><Bell className="size-[18px]" /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-emerald-400" /></button><div className="ml-2 hidden h-5 w-px bg-white/10 sm:block" /><button className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-white/[0.05]"><span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-[9px] font-bold text-orange-950">AM</span><ChevronDown className="size-3.5 text-slate-500" /></button></div></header>

        <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 sm:py-10">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-medium text-emerald-400">Tuesday, June 25, 2024</p><h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">Good morning, Alex</h1><p className="mt-1.5 text-sm text-slate-400">Here&apos;s how your rewards are looking today.</p></div><button onClick={() => { setSynced(true); setTimeout(() => setSynced(false), 1800) }} className="flex w-fit items-center gap-2 rounded-lg bg-emerald-400 px-3.5 py-2.5 text-xs font-semibold text-black shadow-[0_0_24px_rgba(52,211,153,0.12)] transition hover:bg-emerald-300"><RefreshCw className={`size-3.5 ${synced ? 'animate-spin' : ''}`} />{synced ? 'Syncing programs...' : 'Sync all programs'}</button></div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.11] to-transparent p-5"><div className="mb-6 flex items-center justify-between"><span className="text-xs font-medium text-emerald-200/75">Total rewards value</span><div className="rounded-md bg-emerald-400/15 p-1.5 text-emerald-300"><WalletCards className="size-4" /></div></div><p className="text-2xl font-semibold tracking-tight text-white">$1,933.26</p><p className="mt-1.5 text-xs text-emerald-300"><span className="font-medium">+8.4%</span> <span className="text-emerald-200/50">from last month</span></p></div><div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5"><div className="mb-6 flex items-center justify-between"><span className="text-xs font-medium text-slate-400">Total points</span><div className="rounded-md bg-white/[0.06] p-1.5 text-slate-400"><Zap className="size-4" /></div></div><p className="text-2xl font-semibold tracking-tight text-white">197,010</p><p className="mt-1.5 text-xs text-slate-500">Across 4 programs</p></div><div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5"><div className="mb-6 flex items-center justify-between"><span className="text-xs font-medium text-slate-400">Active programs</span><div className="rounded-md bg-white/[0.06] p-1.5 text-slate-400"><CreditCard className="size-4" /></div></div><p className="text-2xl font-semibold tracking-tight text-white">4</p><p className="mt-1.5 text-xs text-slate-500">All synced recently</p></div><div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5"><div className="mb-6 flex items-center justify-between"><span className="text-xs font-medium text-slate-400">Best opportunity</span><div className="rounded-md bg-amber-400/10 p-1.5 text-amber-300"><Sparkles className="size-4" /></div></div><p className="text-2xl font-semibold tracking-tight text-white">$120</p><p className="mt-1.5 text-xs text-slate-500">Amex welcome offer</p></div></div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_1fr]"><section className="rounded-xl border border-white/[0.08] bg-white/[0.02]"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><h2 className="text-sm font-semibold text-white">Your programs</h2><p className="mt-1 text-xs text-slate-500">Balances and estimated values</p></div><button className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.05]"><Plus className="size-3.5" />Add program</button></div><div className="divide-y divide-white/[0.06]">{programs.map((program) => <div key={program.name} className="flex items-center gap-3 px-5 py-4"><div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${program.color} text-xs font-bold text-white`}>{program.icon}</div><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium text-slate-200">{program.name}</p><p className="mt-0.5 text-[11px] text-slate-500">{program.type}</p></div><div className="text-right"><p className="text-[13px] font-medium text-slate-200">{program.points}</p><p className="mt-0.5 text-[11px] text-slate-500">{program.value} est.</p></div><button className="ml-2 rounded p-1 text-slate-600 hover:text-slate-300"><MoreHorizontal className="size-4" /></button></div>)}</div><button className="flex w-full items-center justify-center gap-1 border-t border-white/[0.07] py-3 text-xs font-medium text-emerald-400 hover:bg-emerald-400/[0.04]">View all programs <ArrowUpRight className="size-3.5" /></button></section>

          <section className="rounded-xl border border-white/[0.08] bg-white/[0.02]"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><h2 className="text-sm font-semibold text-white">Recent activity</h2><p className="mt-1 text-xs text-slate-500">Your latest reward movements</p></div><button className="text-xs font-medium text-slate-400 hover:text-slate-200">See all</button></div><div className="divide-y divide-white/[0.06]">{activity.map((item) => <div key={item.name + item.time} className="flex items-center gap-3 px-5 py-4"><div className={`size-2 rounded-full ${item.color}`} /><div className="min-w-0 flex-1"><p className="truncate text-[13px] text-slate-300">{item.name}</p><p className="mt-0.5 text-[11px] text-slate-500">{item.detail} · {item.time}</p></div><span className={`text-xs font-medium ${item.amount.startsWith('-') ? 'text-slate-400' : 'text-emerald-400'}`}>{item.amount}</span></div>)}</div><div className="m-4 flex gap-3 rounded-lg border border-amber-300/10 bg-amber-300/[0.04] p-3"><CircleHelp className="mt-0.5 size-4 shrink-0 text-amber-300" /><div><p className="text-xs font-medium text-amber-100">Keep your balances fresh</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">Automatic sync is enabled for all connected programs.</p></div></div></section></div>
        </div>
      </section>
    </main>
  )
}
