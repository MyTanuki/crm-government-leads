// Types mirror api/openapi.yaml schemas

export type UserRole = 'sales' | 'manager' | 'admin' | 'auditor'

export type LeadStatus =
  | 'draft'
  | 'qualified'
  | 'pending_review'
  | 'blocked'
  | 'converted'
  | 'lost'

export type CustomerControl =
  | 'no_contact'
  | 'know_contact'
  | 'reach_user'
  | 'reach_decision_maker'

export type AgencyType =
  | 'ministry'
  | 'department'
  | 'state_enterprise'
  | 'local_admin'
  | 'university'
  | 'other'

export interface User {
  id: string
  email: string
  display_name: string
  role: UserRole
  line_linked: boolean
  is_active: boolean
  created_at: string
}

export interface Agency {
  id: string
  official_name_th: string
  official_name_en?: string
  short_name?: string
  tax_id?: string
  gfmis_code?: string
  agency_type: AgencyType
  parent_agency_id?: string
  ministry_name?: string
  province?: string
  default_address?: string
  status: 'active' | 'deprecated'
  past_leads_count: number
  past_leads_won: number
}

export interface AgencySearchHit {
  id: string
  official_name_th: string
  ministry_name?: string
  agency_type: AgencyType
  tax_id?: string
  past_leads_count: number
}

export interface Contact {
  id: string
  lead_id: string
  name: string
  role_title?: string
  email?: string
  mobile?: string
  is_primary: boolean
  created_at: string
}

export interface LeadSummary {
  id: string
  lead_code: string
  project_name: string
  budget_thb: number
  submission_date: string
  status: LeadStatus
  agency_id: string
  agency_name_th: string
  agency_short_name?: string
  owner_id: string
  owner_name: string
  days_until_submission: number
  created_at: string
}

export interface Lead extends LeadSummary {
  customer_control: CustomerControl
  agency: Agency
  contacts: Contact[]
  updated_at: string
  deleted_at?: string
}

export interface AuditEntry {
  id: number
  entity_type: string
  entity_id: string
  action: string
  actor_name: string
  actor_email: string
  field_name?: string
  before_value?: Record<string, unknown>
  after_value?: Record<string, unknown>
  description: string
  occurred_at: string
}

export interface PaginationMeta {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  user: User
}

// UI helpers
export const STATUS_LABEL: Record<LeadStatus, string> = {
  draft: 'Draft',
  qualified: 'Qualified',
  pending_review: 'Pending review',
  blocked: 'Blocked',
  converted: 'Converted',
  lost: 'Lost',
}

export const CUSTOMER_CONTROL_LABEL: Record<CustomerControl, string> = {
  no_contact: 'ไม่มีการติดต่อ',
  know_contact: 'รู้จักผู้ติดต่อ',
  reach_user: 'เข้าถึงผู้ใช้',
  reach_decision_maker: 'เข้าถึงผู้ตัดสินใจ',
}

export const AGENCY_TYPE_LABEL: Record<AgencyType, string> = {
  ministry: 'กระทรวง',
  department: 'กรม/สำนัก',
  state_enterprise: 'รัฐวิสาหกิจ',
  local_admin: 'อปท.',
  university: 'มหาวิทยาลัย',
  other: 'หน่วยงานอิสระ',
}
