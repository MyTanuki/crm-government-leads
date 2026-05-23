'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Building2, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { agencies } from '@/lib/api'
import type { AgencySearchHit, AgencyType } from '@/lib/types'
import { AGENCY_TYPE_LABEL } from '@/lib/types'

interface SmartSearchProps {
  value?: AgencySearchHit | null
  onChange: (agency: AgencySearchHit | null) => void
  onSuggestNew?: (name: string) => void
  error?: string
  disabled?: boolean
}

const TYPE_COLOR: Record<AgencyType, string> = {
  ministry: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  department: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  state_enterprise: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  local_admin: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  university: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  other: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

export function SmartSearch({ value, onChange, onSuggestNew, error, disabled }: SmartSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AgencySearchHit[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [tookMs, setTookMs] = useState<number | null>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Highlight matching substring
  function highlight(text: string, q: string) {
    if (!q || q.length < 2) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx < 0) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-amber-100 text-amber-900 dark:bg-amber-800/50 dark:text-amber-200 rounded-[2px] px-0.5">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    )
  }

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await agencies.search(q, 8)
      setResults(res.results)
      setTookMs(res.took_ms)
      setOpen(true)
      setActiveIdx(0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (value) return // Already selected, don't search
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, search, value])

  function select(agency: AgencySearchHit) {
    onChange(agency)
    setQuery('')
    setOpen(false)
    setResults([])
  }

  function clear() {
    onChange(null)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    const total = results.length + (onSuggestNew ? 1 : 0)
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, total - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx < results.length) select(results[activeIdx])
      else if (onSuggestNew) { onSuggestNew(query); setOpen(false) }
    }
    if (e.key === 'Escape') setOpen(false)
  }

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (listRef.current && !listRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // --- Selected state ---
  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Organisation <span className="text-red-500">*</span>
        </label>
        <div className={cn(
          'flex items-center gap-3 rounded-lg border px-3 py-2.5',
          'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-900/10',
        )}>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Building2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {value.official_name_th}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {value.ministry_name && (
                <p className="text-xs text-zinc-500 truncate">{value.ministry_name}</p>
              )}
              <span className={cn(
                'flex-shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium',
                TYPE_COLOR[value.agency_type],
              )}>
                {AGENCY_TYPE_LABEL[value.agency_type]}
              </span>
              {value.past_leads_count > 0 && (
                <span className="text-[10px] text-zinc-400">
                  {value.past_leads_count} past lead{value.past_leads_count > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={clear}
              className="flex-shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {/* Auto-filled meta */}
        {(value.tax_id) && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="rounded bg-zinc-100 px-1.5 py-px font-mono dark:bg-zinc-800">
              {value.tax_id}
            </span>
            <span className="text-zinc-300">·</span>
            <span className="text-zinc-400">auto-filled from agency master</span>
          </div>
        )}
      </div>
    )
  }

  // --- Search state ---
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Organisation <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <div className="relative flex items-center">
          <Search className={cn(
            'pointer-events-none absolute left-3 h-4 w-4 transition-colors',
            loading ? 'text-amber-500' : 'text-zinc-400',
          )} />
          {loading && (
            <svg className="absolute left-3 h-4 w-4 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="พิมพ์ชื่อหน่วยงาน เช่น กรมสรรพากร, มหาวิทยาลัยเชียงใหม่…"
            disabled={disabled}
            className={cn(
              'h-10 w-full rounded-lg border bg-white pl-10 pr-4 text-sm placeholder:text-zinc-400',
              'focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200',
              'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100',
              'dark:focus:border-zinc-500 dark:focus:ring-zinc-700',
              error ? 'border-red-400 focus:ring-red-100' : 'border-zinc-200',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          />
          {query.length >= 2 && (
            <span className="absolute right-3 text-[10px] text-zinc-300">↑↓ Enter</span>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div
            ref={listRef}
            className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >
            {results.length === 0 && !loading && (
              <div className="px-4 py-3 text-sm text-zinc-400">ไม่พบหน่วยงานที่ตรงกัน</div>
            )}

            {results.map((hit, idx) => (
              <button
                key={hit.id}
                type="button"
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => select(hit)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                  idx === activeIdx
                    ? 'bg-zinc-50 dark:bg-zinc-800'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                  idx > 0 && 'border-t border-zinc-100 dark:border-zinc-800',
                )}
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                    {highlight(hit.official_name_th, query)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {hit.ministry_name && (
                      <p className="truncate text-xs text-zinc-400">{hit.ministry_name}</p>
                    )}
                    <span className={cn(
                      'flex-shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium',
                      TYPE_COLOR[hit.agency_type],
                    )}>
                      {AGENCY_TYPE_LABEL[hit.agency_type]}
                    </span>
                    {hit.past_leads_count > 0 && (
                      <span className="flex-shrink-0 rounded-full bg-zinc-100 px-1.5 py-px text-[10px] text-zinc-500 dark:bg-zinc-800">
                        {hit.past_leads_count} leads
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-zinc-300" />
              </button>
            ))}

            {/* Suggest new */}
            {onSuggestNew && query.length >= 2 && (
              <button
                type="button"
                onMouseEnter={() => setActiveIdx(results.length)}
                onClick={() => { onSuggestNew(query); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2.5 text-left text-xs text-zinc-500 transition-colors dark:border-zinc-800',
                  activeIdx === results.length
                    ? 'bg-zinc-50 dark:bg-zinc-800'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                Suggest &quot;{query}&quot; as new agency
              </button>
            )}

            {tookMs !== null && results.length > 0 && (
              <div className="border-t border-zinc-100 px-3 py-1.5 text-[10px] text-zinc-300 dark:border-zinc-800">
                {results.length} results · {tookMs}ms
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-zinc-400">ค้นหาด้วยชื่อภาษาไทย, ชื่อย่อ หรือ คำที่ใกล้เคียง</p>
    </div>
  )
}
