'use client'

import { useState, useEffect } from 'react'
import {
  User, MessageCircle, Laptop, Smartphone,
  Shield, LogOut, ChevronRight, Key,
} from 'lucide-react'
import { auth } from '@/lib/api'
import type { User as UserType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const ROLE_COLOR: Record<string, string> = {
  sales: 'info',
  manager: 'warning',
  admin: 'danger',
  auditor: 'default',
}

const MOCK_STATS = { leads_this_month: 7, qualified: 5, pipeline_value: 28000000, suggestions: 2 }

const MOCK_SESSIONS = [
  { id: 'a', device: 'MacBook Pro · Chrome', location: 'Bangkok, TH', last_seen: 'just now', current: true },
  { id: 'b', device: 'iPhone 15 · Safari', location: 'Bangkok, TH', last_seen: '4 hours ago', current: false },
]

function formatThbShort(n: number) {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(0)}M`
  return `฿${(n / 1000).toFixed(0)}K`
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [lineLinked] = useState(true)

  useEffect(() => {
    auth.me().then(u => { setUser(u); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    )
  }

  if (!user) {
    return <div className="flex items-center justify-center h-64 text-zinc-400">Not signed in.</div>
  }

  const initials = user.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Account</p>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">My profile</h1>
      </div>

      <div className="p-6 space-y-5 max-w-2xl">

        {/* Identity card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-lg font-bold dark:bg-blue-900/30 dark:text-blue-400">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{user.display_name}</p>
                <Badge variant={ROLE_COLOR[user.role] as 'info' | 'warning' | 'danger' | 'default'}>
                  {user.role}
                </Badge>
              </div>
              <p className="text-sm text-zinc-500 mt-0.5">{user.email}</p>
            </div>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </div>
        </div>

        {/* LINE integration */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">LINE integration</p>
          {lineLinked ? (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-zinc-900">
                <MessageCircle className="h-5 w-5 text-[#06C755]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Connected</p>
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
                  somchai_p · Linked 8 Mar 2026
                </p>
              </div>
              <Button variant="secondary" size="sm">Unlink</Button>
            </div>
          ) : (
            <Button variant="primary" size="md" className="w-full justify-center">
              <MessageCircle className="h-4 w-4" />
              Link LINE account
            </Button>
          )}
          <p className="mt-2 text-xs text-zinc-400">
            Notifications about leads, approvals, and reminders are sent to this LINE account.
          </p>
        </div>

        {/* This month stats */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">This month</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Leads', value: String(MOCK_STATS.leads_this_month) },
              { label: 'Qualified', value: String(MOCK_STATS.qualified), color: 'text-emerald-600' },
              { label: 'Pipeline', value: formatThbShort(MOCK_STATS.pipeline_value) },
              { label: 'Suggestions', value: String(MOCK_STATS.suggestions) },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-400">{label}</p>
                <p className={cn('text-xl font-semibold mt-1', color ?? 'text-zinc-900 dark:text-zinc-100')}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Active sessions</p>
          <div className="space-y-2">
            {MOCK_SESSIONS.map(s => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
                {s.device.includes('iPhone') ? (
                  <Smartphone className="h-5 w-5 flex-shrink-0 text-zinc-400" />
                ) : (
                  <Laptop className="h-5 w-5 flex-shrink-0 text-zinc-400" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{s.device}</p>
                    {s.current && (
                      <span className="rounded-full bg-emerald-50 px-2 py-px text-[10px] font-medium text-emerald-600 dark:bg-emerald-900/30">
                        This device
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{s.location} · {s.last_seen}</p>
                </div>
                {!s.current && (
                  <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
            <Key className="h-3.5 w-3.5" />
            Change password
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-700">
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>

      </div>
    </div>
  )
}
