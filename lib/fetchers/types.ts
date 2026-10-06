export type FetchStatus =
  | 'LIVE'
  | 'LOGIN_REQUIRED'
  | 'MFA_REQUIRED'
  | 'FETCHING'
  | 'FETCH_FAILED'
  | 'UNSUPPORTED'
  | 'NOT_REGISTERED'
  | 'NO_BONUS_AVAILABLE'

export type LiveAccountData = {
  balance: number
  bonus: number | null
  currency: string
  fetchedAt: string
}

export type FetchContext = {
  userId: string
  accountId: string
  domain: string
  accountIdentifier: string | null
}

export type FetchAdapter = {
  id: string
  domains: string[]
  fetchAccount: (context: FetchContext) => Promise<LiveAccountData>
}

export class AdapterError extends Error {
  constructor(public status: Exclude<FetchStatus, 'LIVE' | 'FETCHING'>, message: string) {
    super(message)
    this.name = 'AdapterError'
  }
}
