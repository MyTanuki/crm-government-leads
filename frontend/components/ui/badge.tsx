import { cn } from '@/lib/utils'
import type { LeadStatus } from '@/lib/types'

const STATUS_STYLES: Record<LeadStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  qualified: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending_review: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  blocked: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  converted: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  lost: 'bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500 line-through',
}

const STATUS_DOT: Record<LeadStatus, string> = {
  draft: 'bg-zinc-400',
  qualified: 'bg-emerald-500',
  pending_review: 'bg-amber-500',
  blocked: 'bg-red-500',
  converted: 'bg-blue-500',
  lost: 'bg-zinc-400',
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  draft: 'Draft',
  qualified: 'Qualified',
  pending_review: 'Pending review',
  blocked: 'Blocked',
  converted: 'Converted',
  lost: 'Lost',
}

interface StatusBadgeProps {
  status: LeadStatus
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        STATUS_STYLES[status],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const BADGE_STYLES: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  outline: 'border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        BADGE_STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
