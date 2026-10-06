import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, status: 'LOGIN_REQUIRED', error: 'Authentication required' }, { status: 401 })
  const { data: accounts } = await supabase.from('accounts').select('id').eq('user_id', user.id)
  return NextResponse.json({ success: true, results: (accounts ?? []).map((account) => ({ id: account.id, success: false, status: 'UNSUPPORTED', error: 'No approved live integration is configured for this site.' })) })
}
