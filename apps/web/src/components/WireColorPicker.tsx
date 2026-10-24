import {
  isLightColor,
  WIRE_COLOR_CODES,
  WIRE_COLORS,
  type WireColor,
  type WireColorCode,
} from '@pinmapper/shared'
import { Ban, Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export function WireColorPicker({
  value,
  onChange,
}: {
  value?: WireColor
  onChange: (w: WireColor | undefined) => void
}) {
  return (
    <div className="space-y-3">
      <ColorRow
        label="Wire colour"
        selected={value?.base}
        onPick={(c) => onChange(c ? { base: c, stripe: value?.stripe !== c ? value?.stripe : undefined } : undefined)}
      />
      {value && (
        <ColorRow
          label="Stripe"
          small
          exclude={value.base}
          selected={value.stripe}
          onPick={(c) => onChange({ base: value.base, ...(c ? { stripe: c } : {}) })}
        />
      )}
    </div>
  )
}

function ColorRow({
  label,
  selected,
  onPick,
  small,
  exclude,
}: {
  label: string
  selected?: WireColorCode
  onPick: (c: WireColorCode | undefined) => void
  small?: boolean
  exclude?: WireColorCode
}) {
  const size = small ? 'size-10' : 'size-11'
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium text-muted">{label}</span>
        <span className="font-semibold">{selected ? `${WIRE_COLORS[selected].name} (${selected})` : 'None'}</span>
      </div>
      <div role="radiogroup" aria-label={label} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
        <button
          type="button"
          role="radio"
          aria-checked={!selected}
          aria-label="None"
          onClick={() => onPick(undefined)}
          className={cn(
            size,
            'grid shrink-0 place-items-center rounded-full border-2 border-dashed border-border text-muted',
            !selected && 'border-solid border-accent text-accent',
          )}
        >
          <Ban className="size-4.5" />
        </button>
        {WIRE_COLOR_CODES.filter((c) => c !== exclude).map((c) => {
          const { hex, name } = WIRE_COLORS[c]
          const on = selected === c
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={name}
              title={name}
              onClick={() => onPick(c)}
              className={cn(
                size,
                'grid shrink-0 place-items-center rounded-full ring-1 ring-black/30 transition active:scale-90',
                on && 'ring-3 ring-accent ring-offset-2 ring-offset-surface',
              )}
              style={{ background: hex }}
            >
              {on ? (
                <Check className={cn('size-5', isLightColor(hex) ? 'text-black' : 'text-white')} strokeWidth={3} />
              ) : (
                <span className={cn('text-[10px] font-bold', isLightColor(hex) ? 'text-black/70' : 'text-white/80')}>{c}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
