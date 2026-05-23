'use client'

import { useState } from 'react'
import { Building2, RefreshCw, Check, X, ExternalLink, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

// Static mock data — real data comes from /agency-suggestions endpoint (Phase 2 admin module)
const MOCK_SUGGESTIONS = [
  {
    id: '1',
    suggested_name: 'องค์การบริหารส่วนตำบลบางพลีน้อย',
    suggested_by: 'Somchai P.',
    note: 'เพิ่งได้คุยกับ อบต. นี้สำหรับงาน CCTV — อยู่ใน อ.บางพลี สมุทรปราการ ยังไม่อยู่ใน master',
    evidence_url: 'https://www.data.go.th/dataset/lao-listing',
    status: 'pending' as const,
    created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: '2',
    suggested_name: 'สำนักงานพัฒนาธุรกรรมทางอิเล็กทรอนิกส์',
    suggested_by: 'Nattaya K.',
    note: 'หรือ ETDA — เป็นองค์การมหาชนภายใต้กระทรวงดีอี งานสมาร์ทออฟฟิศ',
    evidence_url: null,
    status: 'pending' as const,
    created_at: new Date(Date.now() - 26 * 3600_000).toISOString(),
  },
  {
    id: '3',
    suggested_name: 'เทศบาลตำบลแม่ริม',
    suggested_by: 'Akarat W.',
    note: null,
    evidence_url: 'https://www.data.go.th',
    status: 'pending' as const,
    created_at: new Date(Date.now() - 3 * 86400_000).toISOString(),
  },
]

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function AgencySuggestionsPage() {
  const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS)
  const pending = suggestions.filter(s => s.status === 'pending')
  const approvedCount = 12
  const rejectedCount = 2

  function handleApprove(id: string) {
    setSuggestions(s => s.filter(x => x.id !== id))
    alert('In production this opens a review modal to complete the agency fields before creating.')
  }

  function handleReject(id: string) {
    setSuggestions(s => s.filter(x => x.id !== id))
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Settings · Agency master</p>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Suggestions review</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <RefreshCw className="h-3.5 w-3.5" />
            Sync data.go.th
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending', value: pending.length, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Approved this month', value: approvedCount, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Rejected this month', value: rejectedCount, color: 'text-zinc-500', bg: 'bg-zinc-50 dark:bg-zinc-800' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-xl p-4 ${bg}`}>
              <p className={`text-xs ${color} opacity-75`}>{label}</p>
              <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
            Pending · {pending.length}
          </button>
          <button className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            Approved · {approvedCount}
          </button>
          <button className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            Rejected · {rejectedCount}
          </button>
        </div>

        {/* List */}
        {pending.length === 0 ? (
          <EmptyState
            icon={<Check className="h-5 w-5" />}
            title="All caught up"
            description="No pending agency suggestions at the moment."
          />
        ) : (
          <div className="space-y-3">
            {pending.map(s => (
              <div key={s.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <Building2 className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{s.suggested_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-zinc-400">
                          by <span className="font-medium text-zinc-600 dark:text-zinc-300">{s.suggested_by}</span>
                        </p>
                        <span className="text-zinc-300">·</span>
                        <p className="text-xs text-zinc-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(s.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>

                {s.note && (
                  <div className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 italic dark:bg-zinc-800">
                    &ldquo;{s.note}&rdquo;
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  {s.evidence_url ? (
                    <a
                      href={s.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <ExternalLink className="h-3 w-3" />
                      data.go.th evidence
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-300">No evidence link</span>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReject(s.id)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(s.id)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Review and approve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
