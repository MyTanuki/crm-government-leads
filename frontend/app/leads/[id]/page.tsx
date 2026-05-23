'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft, Edit3, Trash2, CheckCircle, Building2,
  Phone, Mail, MapPin, Calendar, Banknote, User,
  Clock, ChevronRight,
} from 'lucide-react'
import { leads as leadsApi } from '@/lib/api'
import type { Lead, AuditEntry, CustomerControl } from '@/lib/types'
import { CUSTOMER_CONTROL_LABEL, AGENCY_TYPE_LABEL } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatThb, daysUntil, relativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const AUDIT_DOT: Record<string, string> = {
  created: 'bg-zinc-400',
  updated: 'bg-zinc-300',
  status_changed: 'bg-emerald-500',
  contact_added: 'bg-blue-400',
  contact_removed: 'bg-orange-400',
  qualified: 'bg-emerald-500',
  deleted: 'bg-red-400',
  restored: 'bg-blue-500',
}

function AuditDot({ action }: { action: string }) {
  return (
    <div className={cn(
      'relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
      'ring-2 ring-white dark:ring-zinc-900',
      AUDIT_DOT[action] ?? 'bg-zinc-300',
    )} />
  )
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [qualifying, setQualifying] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [l, a] = await Promise.all([
          leadsApi.get(id),
          leadsApi.audit(id, 1, 10),
        ])
        setLead(l)
        setAudit(a.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleQualify() {
    if (!lead) return
    setQualifying(true)
    try {
      const updated = await leadsApi.qualify(id)
      setLead(l => l ? { ...l, status: updated.status } : l)
    } finally { setQualifying(false) }
  }

  async function handleDelete() {
    if (!confirm('Soft delete this lead?')) return
    setDeleting(true)
    try {
      await leadsApi.delete(id)
      router.push('/leads')
    } finally { setDeleting(false) }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        Lead not found or not accessible.
      </div>
    )
  }

  const days = daysUntil(lead.submission_date)
  const primary = lead.contacts.find(c => c.is_primary)

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Link href="/leads">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <p className="text-xs text-zinc-400">
              <Link href="/leads" className="hover:text-zinc-600">Leads</Link>
              <span className="mx-1.5 text-zinc-300">/</span>
              <span className="font-mono">{lead.lead_code}</span>
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 max-w-md truncate">
                {lead.project_name}
              </h1>
              <StatusBadge status={lead.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lead.status === 'draft' && (
            <Button variant="primary" size="sm" onClick={handleQualify} loading={qualifying}>
              <CheckCircle className="h-3.5 w-3.5" />
              Qualify
            </Button>
          )}
          <Button variant="secondary" size="sm">
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} loading={deleting}
            className="text-red-500 hover:bg-red-50 hover:text-red-700">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-0 h-full">
        {/* Left — detail */}
        <div className="overflow-y-auto border-r border-zinc-200 p-6 dark:border-zinc-800 space-y-6">

          {/* Agency card */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Organisation</p>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <Building2 className="h-5 w-5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{lead.agency.official_name_th}</p>
                  {lead.agency.ministry_name && (
                    <p className="text-sm text-zinc-500 mt-0.5">{lead.agency.ministry_name}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {lead.agency.tax_id && (
                      <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-500 dark:bg-zinc-800">
                        {lead.agency.tax_id}
                      </span>
                    )}
                    {lead.agency.gfmis_code && (
                      <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-500 dark:bg-zinc-800">
                        GFMIS: {lead.agency.gfmis_code}
                      </span>
                    )}
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {AGENCY_TYPE_LABEL[lead.agency.agency_type]}
                    </span>
                  </div>
                  {(lead.agency.past_leads_count > 0) && (
                    <p className="mt-2 text-xs text-zinc-400">
                      {lead.agency.past_leads_count} past leads ·{' '}
                      {lead.agency.past_leads_won} converted
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-600 dark:bg-emerald-900/30">
                    auto-filled
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Project */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Project</p>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <div className="flex items-center gap-3">
                <Banknote className="h-4 w-4 flex-shrink-0 text-zinc-400" />
                <div>
                  <p className="text-xs text-zinc-400">Budget</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatThb(lead.budget_thb)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 flex-shrink-0 text-zinc-400" />
                <div>
                  <p className="text-xs text-zinc-400">Submission date</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {new Date(lead.submission_date).toLocaleDateString('th-TH', {
                      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                  <p className={cn('text-xs mt-0.5', days < 0 ? 'text-red-500' : days < 30 ? 'text-amber-500' : 'text-zinc-400')}>
                    {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `${days} days remaining`}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          {primary && (
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Primary contact</p>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{primary.name}</p>
                    {primary.role_title && <p className="text-sm text-zinc-500">{primary.role_title}</p>}
                    {primary.email && (
                      <a href={`mailto:${primary.email}`} className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400">
                        <Mail className="h-3.5 w-3.5" />{primary.email}
                      </a>
                    )}
                    {primary.mobile && (
                      <a href={`tel:${primary.mobile}`} className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                        <Phone className="h-3.5 w-3.5" />{primary.mobile}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Customer control */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Customer relationship</p>
            <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {CUSTOMER_CONTROL_LABEL[lead.customer_control as CustomerControl]}
              </span>
            </div>
          </section>
        </div>

        {/* Right — audit timeline */}
        <div className="overflow-y-auto p-5 scrollbar-thin">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Activity</p>
            <Link href={`/leads/${id}/audit`}>
              <button className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600">
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </Link>
          </div>

          {audit.length === 0 ? (
            <p className="text-xs text-zinc-400">No activity yet.</p>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-2.5 top-3 bottom-3 w-px bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-4">
                {audit.map((entry) => (
                  <div key={entry.id} className="relative flex gap-3 pl-8">
                    <div className="absolute left-0 top-0">
                      <AuditDot action={entry.action} />
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-zinc-400">{entry.actor_name}</span>
                        <span className="text-zinc-300">·</span>
                        <span className="text-[10px] text-zinc-400">
                          {relativeTime(entry.occurred_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
