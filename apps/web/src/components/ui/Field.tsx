import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const inputClass =
  'h-12 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-base text-text placeholder:text-muted/70 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'

export function Field({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      <input className={cn(inputClass, className)} {...props} />
    </label>
  )
}
