import { AdapterError, FetchAdapter } from './types'

const unsupportedAdapter: FetchAdapter = {
  id: 'unsupported',
  domains: [],
  async fetchAccount() {
    throw new AdapterError('UNSUPPORTED', 'No approved provider API is configured for this site.')
  },
}

const adapters: FetchAdapter[] = []

export function getAdapter(domain: string): FetchAdapter {
  const normalized = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  return adapters.find((adapter) => adapter.domains.includes(normalized)) ?? unsupportedAdapter
}

export function listAdapters() {
  return adapters.map(({ id, domains }) => ({ id, domains }))
}
