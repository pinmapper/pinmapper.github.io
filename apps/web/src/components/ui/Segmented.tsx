import { cn } from '@/lib/cn'

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T
  options: { value: T; label: React.ReactNode; className?: string }[]
  onChange: (v: T) => void
  label: string
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('flex rounded-xl border border-border bg-bg p-1', className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-muted transition',
            value === o.value && 'bg-surface-2 text-text shadow-sm ring-1 ring-border',
            value === o.value && o.className,
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
