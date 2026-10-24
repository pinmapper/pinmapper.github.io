import type { PinAnnotation, PinDef, PinStatus } from '@pinmapper/shared'
import { AlertTriangle, Check, ChevronLeft, ChevronRight, StickyNote, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/Segmented'
import { WireColorPicker } from '@/components/WireColorPicker'
import { cn } from '@/lib/cn'

const COMMON_SIGNALS = ['GND', '+5V', '+12V', '+3.3V', 'VCC', 'TX', 'RX', 'CAN-H', 'CAN-L', 'SDA', 'SCL', 'Shield', 'NC']

/**
 * Editor for the selected pin. It is a docked panel rather than a modal so the
 * diagram stays visible and tappable above it.
 */
export function PinSheet({
  pin,
  annotation: a,
  position,
  usedSignals,
  onChange,
  onPrev,
  onNext,
  onClose,
}: {
  pin: PinDef
  annotation: PinAnnotation
  position: { index: number; total: number }
  usedSignals: string[]
  onChange: (patch: Partial<PinAnnotation>) => void
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}) {
  const signalRef = useRef<HTMLInputElement>(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const showNotes = notesOpen || a.notes !== ''
  const suggestions = [...new Set([...usedSignals, ...COMMON_SIGNALS])]
    .filter((s) => s !== a.signal && s.toLowerCase().includes(a.signal.trim().toLowerCase()))
    .slice(0, 12)
  const isLast = position.index === position.total - 1

  return (
    <section
      aria-label={`Pin ${pin.label}`}
      className="relative z-10 max-h-[52dvh] shrink-0 overflow-y-auto rounded-t-3xl border-t border-border bg-surface shadow-[0_-12px_32px_rgb(0_0_0/0.35)]"
    >
      <header className="sticky top-0 z-10 flex items-center gap-1 bg-surface px-2 pt-2 pb-1">
        <Button variant="ghost" size="icon" aria-label="Previous pin" onClick={onPrev}>
          <ChevronLeft className="size-6" />
        </Button>
        <div className="flex-1 text-center">
          <div className="text-xl leading-tight font-bold">Pin {pin.label}</div>
          <div className="text-xs text-muted">
            {position.index + 1} of {position.total}
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Next pin" onClick={onNext}>
          <ChevronRight className="size-6" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Close pin editor" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </header>

      <div className="space-y-4 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div>
          <label htmlFor="pin-signal" className="mb-1.5 block text-sm font-medium text-muted">
            Signal / label
          </label>
          <input
            id="pin-signal"
            ref={signalRef}
            className={cn(inputClass, 'h-13 text-lg font-semibold')}
            value={a.signal}
            placeholder="e.g. GND, TX, Red"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            enterKeyHint={isLast ? 'done' : 'next'}
            onChange={(e) => onChange({ signal: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (isLast) signalRef.current?.blur()
                onNext()
              }
            }}
          />
          {suggestions.length > 0 && (
            <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ signal: s })}
                  className="h-9 shrink-0 rounded-full border border-border bg-surface-2 px-3.5 text-sm font-semibold active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <WireColorPicker value={a.wire} onChange={(wire) => onChange({ wire })} />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-muted">Status</span>
          <Segmented<PinStatus>
            label="Pin status"
            value={a.status}
            onChange={(status) => onChange({ status })}
            options={[
              { value: 'unknown', label: 'Unset' },
              { value: 'verified', label: <><Check className="size-4" /> OK</>, className: 'text-success' },
              { value: 'nc', label: 'NC' },
              { value: 'fault', label: <><AlertTriangle className="size-4" /> Fault</>, className: 'text-danger' },
            ]}
          />
        </div>

        {showNotes ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-muted">Notes</span>
            <textarea
              className={cn(inputClass, 'h-auto min-h-20 py-2.5')}
              rows={2}
              value={a.notes}
              autoFocus={notesOpen && a.notes === ''}
              placeholder="Continuity, measured voltage, where the wire goes…"
              onChange={(e) => onChange({ notes: e.target.value })}
            />
          </label>
        ) : (
          <Button variant="ghost" size="sm" className="-ml-3 text-muted" onClick={() => setNotesOpen(true)}>
            <StickyNote className="size-4" /> Add note
          </Button>
        )}

        <Button variant="primary" size="lg" className="w-full" onClick={onNext}>
          {isLast ? 'Done' : 'Next pin'} <ChevronRight className="size-5" />
        </Button>
      </div>
    </section>
  )
}
