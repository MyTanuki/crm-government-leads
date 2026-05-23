'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus, Search, SlidersHorizontal, FileText,
  TrendingUp, Clock, Banknote, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { leads as leadsApi } from '@/lib/api'
import type { LeadSummary, LeadStatus } from '@/lib/types'
import { STATUS_LABEL } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { formatThb, daysUntil } from '@/lib/utils'

const STATUS_TABS: { value: LeadStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'pending_review', label: 'Pending review' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'converted', label: 'Converted' },
]

export default function LeadsPage() {
  const [data, setData] = useState<LeadSummary[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<LeadStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  // Stats
  const openCount = data.filter(l => l.status === 'draft' || l.status === 'qualified').length
  const pendingCount = data.filter(l => l.status === 'pending_review').length
  const pipeline = data.reduce((s, l) => s + (l.status !== 'lost' && l.status !== 'converted' ? l.budget_thb : 0), 0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await leadsApi.list({
          status: status === 'all' ? undefined : status,
          q: q || undefined,
          page,
          page_size: 20,
          sort: '-created_at',
        })
        setData(res.data)
        setTotal(res.meta.total)
        setTotalPages(res.meta.total_pages)
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [status, q, page])

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setQ(e.target.value)
    setPage(1)
  }

  function handleTab(s: LeadStatus | 'all') {
    setStatus(s)
    setPage(1)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">System 1</p>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Government leads</h1>
        </div>
        <Link href="/leads/new">
          <Button variant="primary" size="md">
            <Plus className="h-3.5 w-3.5" />
            New lead
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-6 p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Open', value: loading ? '—' : String(openCount), icon: FileText, color: 'text-zinc-600' },
            { label: 'Pending review', value: loading ? '—' : String(pendingCount), icon: Clock, color: 'text-amber-600' },
            { label: 'Pipeline value', value: loading ? '—' : formatThb(pipeline), icon: Banknote, color: 'text-blue-600' },
            { label: 'Total leads', value: loading ? '—' : String(total), icon: TrendingUp, color: 'text-emerald-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">{label}</p>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              value={q}
              onChange={handleSearch}
              placeholder="Search project or agency…"
              prefix={<Search className="h-3.5 w-3.5" />}
            />
          </div>
          <Button variant="secondary" size="md">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </Button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleTab(value)}
              className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                status === value
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
            {['Project · Organisation', 'Budget', 'Status', 'Submission'].map(h => (
              <p key={h} className="text-xs font-medium uppercase tracking-wider text-zinc-400">{h}</p>
            ))}
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 border-b border-zinc-50 px-4 py-3.5 dark:border-zinc-800/50">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))
          ) : data.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title="No leads found"
              description={q ? `No results for "${q}"` : 'Create your first lead to get started'}
              action={
                <Link href="/leads/new">
                  <Button variant="primary" size="sm">New lead</Button>
                </Link>
              }
            />
          ) : (
            data.map((lead, i) => {
              const days = daysUntil(lead.submission_date)
              return (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                    i > 0 ? 'border-t border-zinc-100 dark:border-zinc-800/50' : ''
                  }`}
                >
                  {/* Project + Agency */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {lead.project_name}
                    </p>
                    <p className="truncate text-xs text-zinc-400 mt-0.5">
                      {lead.agency_short_name ?? lead.agency_name_th}
                      <span className="ml-2 text-zinc-300">·</span>
                      <span className="ml-2">{lead.lead_code}</span>
                    </p>
                  </div>
                  {/* Budget */}
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {formatThb(lead.budget_thb)}
                  </p>
                  {/* Status */}
                  <StatusBadge status={lead.status as LeadStatus} size="sm" />
                  {/* Submission */}
                  <div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      {new Date(lead.submission_date).toLocaleDateString('th-TH', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                    <p className={`text-xs mt-0.5 ${days < 0 ? 'text-red-500' : days < 30 ? 'text-amber-500' : 'text-zinc-400'}`}>
                      {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d left`}
                    </p>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-zinc-400">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-zinc-600 dark:text-zinc-400">
                {page} / {totalPages}
              </span>
              <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
