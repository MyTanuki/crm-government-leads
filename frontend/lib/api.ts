/**
 * Typed API client for the CRM backend.
 * All requests attach the JWT from localStorage.
 * Token refresh is handled transparently on 401.
 */
import type {
  Agency,
  AgencySearchHit,
  AuthTokens,
  AuditEntry,
  Contact,
  Lead,
  LeadSummary,
  PaginatedResponse,
  User,
} from './types'

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001/api/v1'

// ---------------------------------------------------------------------------
// Token storage (client-side only)
// ---------------------------------------------------------------------------
export const tokenStore = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('crm_access_token')
  },
  set: (token: string) => localStorage.setItem('crm_access_token', token),
  setRefresh: (token: string) => localStorage.setItem('crm_refresh_token', token),
  getRefresh: (): string | null => localStorage.getItem('crm_refresh_token'),
  clear: () => {
    localStorage.removeItem('crm_access_token')
    localStorage.removeItem('crm_refresh_token')
  },
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------
class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = tokenStore.get()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh()
    if (refreshed) return apiFetch<T>(path, options, false)
    tokenStore.clear()
    window.location.href = '/login'
    throw new ApiError(401, 'UNAUTHORIZED', 'Session expired')
  }

  if (res.status === 204) return undefined as T

  const body = await res.json()
  if (!res.ok) {
    throw new ApiError(res.status, body.code ?? 'ERROR', body.message ?? 'Request failed', body.details)
  }
  return body as T
}

async function tryRefresh(): Promise<boolean> {
  const token = tokenStore.getRefresh()
  if (!token) return false
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: token }),
    })
    if (!res.ok) return false
    const data = await res.json()
    tokenStore.set(data.access_token)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const auth = {
  login: (email: string, password: string) =>
    apiFetch<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => apiFetch<User>('/me'),
}

// ---------------------------------------------------------------------------
// Agencies
// ---------------------------------------------------------------------------
export const agencies = {
  search: (q: string, limit = 8) =>
    apiFetch<{ results: AgencySearchHit[]; took_ms: number }>(
      `/agencies/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),
  get: (id: string) => apiFetch<Agency>(`/agencies/${id}`),
  suggest: (body: { suggested_name: string; note?: string; evidence_url?: string }) =>
    apiFetch('/agencies/suggest', { method: 'POST', body: JSON.stringify(body) }),
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
export interface LeadsQuery {
  status?: string
  q?: string
  agency_id?: string
  page?: number
  page_size?: number
  sort?: string
}

export const leads = {
  list: (query: LeadsQuery = {}) => {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([k, v]) => v !== undefined && params.set(k, String(v)))
    return apiFetch<PaginatedResponse<LeadSummary>>(`/leads?${params}`)
  },
  get: (id: string) => apiFetch<Lead>(`/leads/${id}`),
  create: (body: {
    agency_id: string
    project_name: string
    budget_thb: number
    submission_date: string
    customer_control: string
    primary_contact: {
      name: string
      role_title?: string
      email?: string
      mobile?: string
    }
  }) => apiFetch<Lead>('/leads', { method: 'POST', body: JSON.stringify(body) }),
  update: (
    id: string,
    body: Partial<{
      project_name: string
      budget_thb: number
      submission_date: string
      customer_control: string
    }>,
  ) => apiFetch<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch<void>(`/leads/${id}`, { method: 'DELETE' }),
  qualify: (id: string) => apiFetch<Lead>(`/leads/${id}/qualify`, { method: 'POST' }),
  audit: (id: string, page = 1, pageSize = 50) =>
    apiFetch<PaginatedResponse<AuditEntry>>(
      `/leads/${id}/audit?page=${page}&page_size=${pageSize}`,
    ),
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------
export const contacts = {
  add: (
    leadId: string,
    body: { name: string; role_title?: string; email?: string; mobile?: string; is_primary?: boolean },
  ) =>
    apiFetch<Contact>(`/leads/${leadId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (leadId: string, contactId: string, body: Partial<Contact>) =>
    apiFetch<Contact>(`/leads/${leadId}/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: (leadId: string, contactId: string) =>
    apiFetch<void>(`/leads/${leadId}/contacts/${contactId}`, { method: 'DELETE' }),
}

export { ApiError }
