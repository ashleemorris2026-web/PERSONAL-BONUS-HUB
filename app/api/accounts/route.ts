import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const { data, error } = await supabase.from('accounts').select('id,domain,display_name,registered,supported,adapter,account_identifier,login_method,status,balance,bonus,currency,last_successful_fetch,last_fetch_status,last_error').order('display_name')
  if (error) return NextResponse.json({ error: 'Unable to load accounts' }, { status: 500 })
  return NextResponse.json({ accounts: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const domain = typeof body.domain === 'string' ? body.domain.trim().toLowerCase() : ''
  if (!domain || domain.length > 253) return NextResponse.json({ error: 'Valid domain required' }, { status: 400 })
  const { data, error } = await supabase.from('accounts').upsert({ user_id: user.id, domain, display_name: domain, registered: true, supported: false, status: 'UNSUPPORTED', last_fetch_status: 'UNSUPPORTED' }, { onConflict: 'user_id,domain' }).select('id,domain,display_name,registered,supported,adapter,account_identifier,login_method,status,balance,bonus,currency,last_successful_fetch,last_fetch_status,last_error').single()
  if (error) return NextResponse.json({ error: 'Unable to register account' }, { status: 500 })
  return NextResponse.json({ account: data }, { status: 201 })
}
