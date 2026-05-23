'use client'

import { useState } from 'react'
import { Search, Snowflake, Trash2, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatThb } from '@/lib/utils'

// Static mock — real endpoint requires admin token and cold storage query
const MOCK_ARCHIVED = [
  { id: '1', lead_code: 'LD-2024-0089', project_name: 'LED display retrofit', agency: 'การประปานครหลวง', budget_thb: 4200000, reason: 'cold', archived_at: '2024-02-14' },
  { id: '2', lead_code: 'LD-2025-0142', project_name: 'CCTV pilot', agency: 'เทศบาลเมืองภูเก็ต', budget_thb: 1800000, reason: 'deleted', archived_at: '2026-04-22' },
  { id: '3', lead_code: 'LD-2023-0317', project_name: 'PA system upgrade', agency: 'กรมสรรพากร', budget_thb: 3100000, reason: 'cold', archived_at: '2023-11-08' },
  { id: '4', lead_code: 'LD-2026-0098', project_name: 'Conference room AV', agency: 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน', budget_thb: 5500000, reason: 'deleted', archived_at: '2026-05-12' },
  { id: '5', lead_code: 'LD-2024-0203', project_name: 'Access control retrofit', agency: 'สำนักงานปลัดกระทรวงคมนาคม', budget_thb: 2400000, reason: 'cold', archived_at: '2024-09-29' },
]

export default function ArchivePage() {
  const [q, setQ] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(true)
  const [includeCold, setIncludeCold] = useState(true)

  const filtered = MOCK_ARCHIVED.filter(a => {
    if (!includeDeleted && a.reason === 'deleted') return false
    if (!includeCold && a.reason === 'cold') return false
    if (q && !a.project_name.toLowerCase().includes(q.toLowerCase()) &&
        !a.agency.includes(q) && !a.lead_code.includes(q)) return false
    return true
  })

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Data · Archive</p>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Archive search</h1>
        <p className="mt-0.5 text-xs text-zinc-400 max-w-xl">
          Search soft-deleted leads or leads older than 24 months that moved to cold storage.
          Read-only by default. Admin can restore deleted leads.
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Search bar */}
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by project name, lead code or agency…"
          prefix={<Search className="h-3.5 w-3.5" />}
          suffix={<span className="text-[11px] text-zinc-300">⌘K</span>}
        />

        {/* Checkboxes + count */}
        <div className="flex items-center gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={e => setIncludeDeleted(e.target.checked)}
              className="h-3.5 w-3.5 rounded"
            />
            Include deleted
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={includeCold}
              onChange={e => setIncludeCold(e.target.checked)}
              className="h-3.5 w-3.5 rounded"
            />
            Include cold storage
          </label>
          <span className="ml-auto text-xs text-zinc-400">{filtered.length} results</span>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-[2fr_1fr_100px_80px] border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
            {['Project · Organisation', 'Archive reason', 'Archived', ''].map(h => (
              <p key={h} className="text-xs font-medium uppercase tracking-wider text-zinc-400">{h}</p>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="h-5 w-5" />}
              title="No archived records"
              description="Try adjusting your filters"
            />
          ) : (
            filtered.map((a, i) => (
              <div
                key={a.id}
                className={`grid grid-cols-[2fr_1fr_100px_80px] items-center gap-4 px-4 py-3.5 ${
                  i > 0 ? 'border-t border-zinc-100 dark:border-zinc-800/50' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {a.project_name}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">
                    {a.agency}
                    <span className="mx-1.5 text-zinc-300">·</span>
                    <span className="font-mono">{a.lead_code}</span>
                    <span className="mx-1.5 text-zinc-300">·</span>
                    {formatThb(a.budget_thb)}
                  </p>
                </div>

                {a.reason === 'cold' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 dark:bg-zinc-800">
                    <Snowflake className="h-3 w-3" />
                    Cold storage
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    <Trash2 className="h-3 w-3" />
                    Deleted
                  </span>
                )}

                <p className="text-xs text-zinc-400">
                  {new Date(a.archived_at).toLocaleDateString('th-TH', {
                    day: 'numeric', month: 'short', year: '2-digit',
                  })}
                </p>

                <div className="flex justify-end">
                  {a.reason === 'deleted' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => alert('Restore action — admin only, Phase 2')}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm">View</Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-xs text-zinc-400 text-center">
            Showing {filtered.length} of {MOCK_ARCHIVED.length} archived records
          </p>
        )}
      </div>
    </div>
  )
}
