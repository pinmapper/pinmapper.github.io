import type { ParamDef, Params } from '@pinmapper/shared'
import { Minus, Plus } from 'lucide-react'
import { inputClass } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/Segmented'
import { cn } from '@/lib/cn'

/** Touch-friendly inputs for a parametric connector's size and layout. */
export function ParamControls({
  defs,
  value,
  onChange,
}: {
  defs: ParamDef[]
  value: Params
  onChange: (next: Params) => void
}) {
  const set = (key: string, v: Params[string]) => onChange({ ...value, [key]: v })
  return (
    <div className="space-y-3">
      {defs.map((d) => {
        if (d.kind === 'int')
          return <Stepper key={d.key} def={d} value={value[d.key] as number} onChange={(v) => set(d.key, v)} />
        if (d.kind === 'bool')
          return (
            <label key={d.key} className="flex min-h-12 items-center justify-between gap-3">
              <span className="font-medium">{d.label}</span>
              <input
                type="checkbox"
                role="switch"
                checked={value[d.key] as boolean}
                onChange={(e) => set(d.key, e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="relative h-8 w-13 shrink-0 rounded-full bg-surface-2 ring-1 ring-border transition peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent after:absolute after:top-1 after:left-1 after:size-6 after:rounded-full after:bg-text after:shadow after:transition peer-checked:after:translate-x-5 peer-checked:after:bg-accent-fg"
              />
            </label>
          )
        return (
          <div key={d.key}>
            <span className="mb-1.5 block text-sm font-medium text-muted">{d.label}</span>
            {d.options.length <= 3 ? (
              <Segmented
                label={d.label}
                value={value[d.key] as string}
                onChange={(v) => set(d.key, v)}
                options={d.options}
              />
            ) : (
              <select
                aria-label={d.label}
                value={value[d.key] as string}
                onChange={(e) => set(d.key, e.target.value)}
                className={inputClass}
              >
                {d.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Stepper({
  def,
  value,
  onChange,
}: {
  def: Extract<ParamDef, { kind: 'int' }>
  value: number
  onChange: (v: number) => void
}) {
  const clamp = (n: number) => Math.min(def.max, Math.max(def.min, n))
  const btn =
    'grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 transition active:scale-95 disabled:opacity-30'
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium">{def.label}</span>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} aria-label={`Fewer ${def.label.toLowerCase()}`} disabled={value <= def.min} onClick={() => onChange(clamp(value - 1))}>
          <Minus className="size-5" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          aria-label={def.label}
          min={def.min}
          max={def.max}
          value={value}
          onChange={(e) => e.target.value !== '' && onChange(clamp(Math.round(+e.target.value)))}
          className={cn(inputClass, 'w-16 px-1 text-center text-lg font-bold tabular-nums')}
        />
        <button type="button" className={btn} aria-label={`More ${def.label.toLowerCase()}`} disabled={value >= def.max} onClick={() => onChange(clamp(value + 1))}>
          <Plus className="size-5" />
        </button>
      </div>
    </div>
  )
}
