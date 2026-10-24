import { wireLabel, type ConnectorTemplate, type PinAnnotation, type PinStatus } from '@pinmapper/shared'
import { AlertTriangle, Check, ChevronRight, CircleDashed } from 'lucide-react'
import { useRef } from 'react'
import { WireSwatch } from '@/components/WireSwatch'
import { cn } from '@/lib/cn'

const NEXT_STATUS: Record<PinStatus, PinStatus> = {
  unknown: 'verified',
  verified: 'fault',
  fault: 'nc',
  nc: 'unknown',
}

const STATUS_LABEL: Record<PinStatus, string> = {
  unknown: 'Status not set',
  verified: 'Verified',
  fault: 'Fault',
  nc: 'Not connected',
}

/**
 * Every pin as a row. Signal names are typed in place (Enter jumps to the next
 * row, keeping the keyboard up); the number, swatch or chevron opens the full
 * pin editor for wire colour and notes.
 */
export function PinTable({
  template,
  pins,
  selectedId,
  onOpen,
  onPatch,
}: {
  template: ConnectorTemplate
  pins: Record<string, PinAnnotation>
  selectedId: string | null
  onOpen: (id: string) => void
  onPatch: (id: string, patch: Partial<PinAnnotation>) => void
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  return (
    <ul className="divide-y divide-border">
      {template.pins.map((p, i) => {
        const a = pins[p.id]
        const status = a?.status ?? 'unknown'
        const isLast = i === template.pins.length - 1
        return (
          <li
            key={p.id}
            className={cn(
              'flex min-h-16 items-center gap-2 py-2 pr-1 pl-3',
              selectedId === p.id && 'bg-accent-soft',
            )}
          >
            <button
              type="button"
              onClick={() => onOpen(p.id)}
              aria-label={`Edit pin ${p.label}`}
              className="flex shrink-0 items-center gap-2 rounded-xl py-1 pr-1 active:bg-surface-2"
            >
              <span className="grid size-9 place-items-center rounded-full bg-surface-2 text-sm font-bold tabular-nums">
                {p.label}
              </span>
              <WireSwatch wire={a?.wire} />
            </button>
            <div className={cn('min-w-0 flex-1', status === 'nc' && 'opacity-55')}>
              <input
                ref={(el) => {
                  inputs.current[i] = el
                }}
                aria-label={`Pin ${p.label} signal`}
                value={a?.signal ?? ''}
                placeholder="Unlabelled"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                enterKeyHint={isLast ? 'done' : 'next'}
                onChange={(e) => onPatch(p.id, { signal: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  const next = inputs.current[i + 1]
                  if (next) {
                    next.focus()
                    next.scrollIntoView({ block: 'nearest' })
                  } else e.currentTarget.blur()
                }}
                className="h-11 w-full rounded-lg border border-transparent bg-transparent px-2 font-semibold outline-none placeholder:font-normal placeholder:text-muted/70 focus:border-accent focus:bg-surface-2"
              />
              {(a?.wire || a?.notes) && (
                <div className="truncate px-2 text-xs text-muted">
                  {[a.wire && wireLabel(a.wire.base, a.wire.stripe), a.notes].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onPatch(p.id, { status: NEXT_STATUS[status] })}
              aria-label={`${STATUS_LABEL[status]}. Tap to change`}
              title={STATUS_LABEL[status]}
              className="grid size-11 shrink-0 place-items-center rounded-full active:bg-surface-2"
            >
              {status === 'verified' && <Check className="size-5 text-success" strokeWidth={2.5} />}
              {status === 'fault' && <AlertTriangle className="size-5 text-danger" />}
              {status === 'nc' && <span className="text-xs font-bold text-muted">NC</span>}
              {status === 'unknown' && <CircleDashed className="size-5 text-muted/60" />}
            </button>
            <button
              type="button"
              onClick={() => onOpen(p.id)}
              aria-label={`Open pin ${p.label} details`}
              className="grid size-11 shrink-0 place-items-center rounded-full text-muted active:bg-surface-2"
            >
              <ChevronRight className="size-5" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
