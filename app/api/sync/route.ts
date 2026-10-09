import { NextResponse } from 'next/server'
import domains from '../../../data/domains.json'

export const dynamic = 'force-dynamic'

type Domain = (typeof domains)[number]

async function checkDomain(domain: Domain) {
  const started = Date.now()
  try {
    const response = await fetch(domain.referral_url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(6000), cache: 'no-store' })
    return { ...domain, status: response.ok ? 'live' : 'error', statusCode: response.status, checkedAt: new Date().toISOString(), responseMs: Date.now() - started, message: response.ok ? 'Reachable' : `Returned ${response.status}` }
  } catch {
    return { ...domain, status: 'error', statusCode: null, checkedAt: new Date().toISOString(), responseMs: Date.now() - started, message: 'Unavailable from sync runner' }
  }
}

export async function GET() {
  const results = await Promise.all(domains.map(checkDomain))
  const live = results.filter((item) => item.status === 'live').length
  return NextResponse.json({ results, syncedAt: new Date().toISOString(), summary: { total: results.length, live, issues: results.length - live } })
}
