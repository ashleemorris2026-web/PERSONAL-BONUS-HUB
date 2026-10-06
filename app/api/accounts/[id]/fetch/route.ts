import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, status: 'LOGIN_REQUIRED', error: 'Authentication required' }, { status: 401 })
  const { id } = await params
  const { data: account } = await supabase.from('accounts').select('id,domain,supported').eq('id', id).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ success: false, status: 'NOT_REGISTERED', error: 'Account not found' }, { status: 404 })
  const reason = account.supported ? 'This adapter is not configured with a legitimate provider API yet.' : 'No approved live integration is configured for this site.'
  await supabase.from('accounts').update({ status: 'UNSUPPORTED', last_fetch_status: 'UNSUPPORTED', last_error: reason }).eq('id', id).eq('user_id', user.id)
  await supabase.from('fetch_history').insert({ user_id: user.id, account_id: id, success: false, status: 'UNSUPPORTED', error_category: 'UNSUPPORTED', error_message: reason })
  return NextResponse.json({ success: false, status: 'UNSUPPORTED', error: reason })
}
