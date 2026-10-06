import { createClient } from '@/lib/supabase/server'
import { getAdapter } from '@/lib/fetchers/registry'
import { AdapterError } from '@/lib/fetchers/types'
import { NextResponse } from 'next/server'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, status: 'LOGIN_REQUIRED', error: 'Authentication required' }, { status: 401 })
  const { id } = await params
  const { data: account } = await supabase.from('accounts').select('id,domain,account_identifier').eq('id', id).eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ success: false, status: 'NOT_REGISTERED', error: 'Account not found' }, { status: 404 })

  const adapter = getAdapter(account.domain)
  await supabase.from('accounts').update({ status: 'FETCHING', last_fetch_status: 'FETCHING', last_error: null }).eq('id', id).eq('user_id', user.id)

  try {
    const result = await adapter.fetchAccount({ userId: user.id, accountId: id, domain: account.domain, accountIdentifier: account.account_identifier })
    if (!Number.isFinite(result.balance) || result.balance < 0 || !/^[A-Z]{3}$/.test(result.currency)) {
      throw new AdapterError('FETCH_FAILED', 'Provider returned an invalid account response.')
    }
    const { error } = await supabase.from('accounts').update({ status: 'LIVE', last_fetch_status: 'LIVE', balance: result.balance, bonus: result.bonus, currency: result.currency, last_successful_fetch: result.fetchedAt, last_error: null }).eq('id', id).eq('user_id', user.id)
    if (error) throw new Error('Unable to save the verified fetch result.')
    await supabase.from('fetch_history').insert({ user_id: user.id, account_id: id, success: true, status: 'LIVE', balance: result.balance, bonus: result.bonus, currency: result.currency })
    return NextResponse.json({ success: true, status: 'LIVE', balance: result.balance, bonus: result.bonus, currency: result.currency, fetchedAt: result.fetchedAt })
  } catch (error) {
    const status = error instanceof AdapterError ? error.status : 'FETCH_FAILED'
    const reason = error instanceof Error ? error.message : 'Live fetch failed.'
    await supabase.from('accounts').update({ status, last_fetch_status: status, last_error: reason }).eq('id', id).eq('user_id', user.id)
    await supabase.from('fetch_history').insert({ user_id: user.id, account_id: id, success: false, status, error_category: status, error_message: reason })
    return NextResponse.json({ success: false, status, error: reason })
  }
}
