'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, User, Building2, Calendar, Banknote } from 'lucide-react'
import { SmartSearch } from '@/components/agencies/smart-search'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { leads as leadsApi } from '@/lib/api'
import type { AgencySearchHit, CustomerControl } from '@/lib/types'
import { CUSTOMER_CONTROL_LABEL } from '@/lib/types'
import { cn } from '@/lib/utils'

const CONTROL_OPTIONS: { value: CustomerControl; desc: string }[] = [
  { value: 'no_contact', desc: 'ยังไม่มีการติดต่อใดๆ กับหน่วยงาน' },
  { value: 'know_contact', desc: 'รู้จักผู้ติดต่อแต่ยังไม่ได้พูดคุย' },
  { value: 'reach_user', desc: 'เข้าถึงและพูดคุยกับผู้ใช้งานได้แล้ว' },
  { value: 'reach_decision_maker', desc: 'เข้าถึงผู้มีอำนาจตัดสินใจได้โดยตรง' },
]

interface FormState {
  project_name: string
  budget_thb: string
  submission_date: string
  customer_control: CustomerControl | ''
  contact_name: string
  contact_role: string
  contact_email: string
  contact_mobile: string
}

interface Errors {
  [key: string]: string
}

const EMPTY: FormState = {
  project_name: '',
  budget_thb: '',
  submission_date: '',
  customer_control: '',
  contact_name: '',
  contact_role: '',
  contact_email: '',
  contact_mobile: '',
}

export default function NewLeadPage() {
  const router = useRouter()
  const [agency, setAgency] = useState<AgencySearchHit | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [saveDraft, setSaveDraft] = useState(false)

  function set(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => { const n = { ...e }; delete n[field]; return n })
  }

  // Count filled required fields (6 total)
  const filledCount = [
    !!agency,
    form.project_name.length >= 10,
    Number(form.budget_thb) > 0,
    !!form.submission_date,
    !!form.customer_control,
    !!(form.contact_name && (form.contact_email || form.contact_mobile)),
  ].filter(Boolean).length

  function validate(): boolean {
    const e: Errors = {}
    if (!agency) e.agency = 'Select an agency'
    if (form.project_name.length < 10) e.project_name = 'Minimum 10 characters'
    if (!form.project_name) e.project_name = 'Required'
    if (!form.budget_thb || Number(form.budget_thb) <= 0) e.budget_thb = 'Enter a budget > 0'
    if (!form.submission_date) e.submission_date = 'Required'
    if (!form.customer_control) e.customer_control = 'Select a relationship level'
    if (!form.contact_name) e.contact_name = 'Required'
    if (!form.contact_email && !form.contact_mobile) e.contact_mobile = 'Email or mobile required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const lead = await leadsApi.create({
        agency_id: agency!.id,
        project_name: form.project_name,
        budget_thb: Number(form.budget_thb),
        submission_date: form.submission_date,
        customer_control: form.customer_control as CustomerControl,
        primary_contact: {
          name: form.contact_name,
          role_title: form.contact_role || undefined,
          email: form.contact_email || undefined,
          mobile: form.contact_mobile || undefined,
        },
      })
      router.push(`/leads/${lead.id}`)
    } catch (err: unknown) {
      setSaving(false)
    }
  }

  async function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault()
    if (!agency || !form.project_name || !form.budget_thb || !form.submission_date ||
        !form.customer_control || !form.contact_name || (!form.contact_email && !form.contact_mobile)) {
      setSaveDraft(true)
      return
    }
    setSaving(true)
    try {
      const lead = await leadsApi.create({
        agency_id: agency!.id,
        project_name: form.project_name,
        budget_thb: Number(form.budget_thb),
        submission_date: form.submission_date,
        customer_control: form.customer_control as CustomerControl,
        primary_contact: {
          name: form.contact_name,
          role_title: form.contact_role || undefined,
          email: form.contact_email || undefined,
          mobile: form.contact_mobile || undefined,
        },
      })
      router.push('/leads')
    } catch { setSaving(false) }
  }

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
              <span className="mx-1.5 text-zinc-300">/</span>New
            </p>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Create lead</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Required fields counter */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 w-5 rounded-full transition-colors',
                    i < filledCount ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700',
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-zinc-400">{filledCount}/6 required</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Organisation */}
          <section>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Building2 className="h-3.5 w-3.5" />
              Organisation
            </div>
            <SmartSearch
              value={agency}
              onChange={setAgency}
              onSuggestNew={name => alert(`Suggest "${name}" — modal coming in Phase 2`)}
              error={errors.agency}
            />
          </section>

          {/* Project */}
          <section>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Banknote className="h-3.5 w-3.5" />
              Project details
            </div>
            <div className="space-y-4">
              <Input
                label="Project name"
                required
                value={form.project_name}
                onChange={e => set('project_name', e.target.value)}
                placeholder="ชื่อโครงการหรืองานที่ต้องการ เช่น ติดตั้งระบบ LED ห้องประชุม"
                error={errors.project_name}
                hint="Minimum 10 characters"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Budget (THB)"
                  required
                  type="number"
                  min="1"
                  value={form.budget_thb}
                  onChange={e => set('budget_thb', e.target.value)}
                  placeholder="1500000"
                  error={errors.budget_thb}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Submission date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.submission_date}
                    onChange={e => set('submission_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={cn(
                      'h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900',
                      'focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200',
                      'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100',
                      errors.submission_date && 'border-red-400',
                    )}
                  />
                  {errors.submission_date && (
                    <p className="text-xs text-red-500">{errors.submission_date}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <User className="h-3.5 w-3.5" />
              Contact point
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Name"
                  required
                  value={form.contact_name}
                  onChange={e => set('contact_name', e.target.value)}
                  placeholder="คุณวีระ จันทร์ทอง"
                  error={errors.contact_name}
                />
                <Input
                  label="Role / Title"
                  value={form.contact_role}
                  onChange={e => set('contact_role', e.target.value)}
                  placeholder="หัวหน้าฝ่ายไอที"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={form.contact_email}
                  onChange={e => set('contact_email', e.target.value)}
                  placeholder="name@agency.go.th"
                  error={errors.contact_email}
                />
                <Input
                  label="Mobile"
                  value={form.contact_mobile}
                  onChange={e => set('contact_mobile', e.target.value)}
                  placeholder="081 234 5678"
                  error={errors.contact_mobile}
                />
              </div>
            </div>
          </section>

          {/* Customer control */}
          <section>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Calendar className="h-3.5 w-3.5" />
              Customer relationship
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CONTROL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('customer_control', opt.value)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all',
                    form.customer_control === opt.value
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                      : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-500',
                  )}
                >
                  <p className="text-sm font-medium">{CUSTOMER_CONTROL_LABEL[opt.value]}</p>
                  <p className={cn(
                    'mt-1 text-xs',
                    form.customer_control === opt.value ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400',
                  )}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
            {errors.customer_control && (
              <p className="mt-1.5 text-xs text-red-500">{errors.customer_control}</p>
            )}
          </section>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <Link href="/leads">
              <Button variant="ghost" type="button">Cancel</Button>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="secondary" type="button" onClick={handleSaveDraft} loading={saveDraft}>
                Save draft
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={filledCount < 6}
                loading={saving}
              >
                Save and continue
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
