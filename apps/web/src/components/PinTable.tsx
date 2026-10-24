import type { ConnectorTemplate, PinAnnotation } from '@pinmapper/shared'
import { wireLabel } from '@pinmapper/shared'
import { AlertTriangle, Check, ChevronRight } from 'lucide-react'
import { WireSwatch } from '@/components/WireSwatch'
import { cn } from '@/lib/cn'

/** Every pin at a glance. Tapping a row opens it in the pin editor. */
export function PinTable({
  template,
  pins,
  selectedId,
  onSelect,
}: {
  template: ConnectorTemplate
  pins: Record<string, PinAnnotation>
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <ul className="divide-y divide-border overflow-y-auto">
      {template.pins.map((p) => {
        const a = pins[p.id]
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p.id)}
              className={cn(
                'flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left active:bg-surface-2',
                selectedId === p.id && 'bg-accent-soft',
                a?.status === 'nc' && 'opacity-55',
              )}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-bold tabular-nums">
                {p.label}
              </span>
              <WireSwatch wire={a?.wire} />
              <span className="min-w-0 flex-1">
                <span className={cn('block truncate font-semibold', !a?.signal && 'font-normal text-muted')}>
                  {a?.signal || 'Unlabelled'}
                </span>
                {(a?.wire || a?.notes) && (
                  <span className="block truncate text-xs text-muted">
                    {[a.wire && wireLabel(a.wire.base, a.wire.stripe), a.notes].filter(Boolean).join(' · ')}
                  </span>
                )}
              </span>
              {a?.status === 'verified' && <Check className="size-5 text-success" aria-label="Verified" />}
              {a?.status === 'fault' && <AlertTriangle className="size-5 text-danger" aria-label="Fault" />}
              {a?.status === 'nc' && <span className="text-xs font-bold text-muted">NC</span>}
              <ChevronRight className="size-4 text-muted" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
