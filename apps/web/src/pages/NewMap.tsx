import {
  CONNECTOR_FAMILIES,
  searchConnectors,
  type ConnectorFamily,
  type ConnectorTemplate,
  type Gender,
} from '@pinmapper/shared'
import { ArrowLeft, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ConnectorDiagram } from '@/components/ConnectorDiagram'
import { Button } from '@/components/ui/Button'
import { Field, inputClass } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { createMap, db, nextTitle } from '@/db'
import { cn } from '@/lib/cn'

export function NewMap() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<ConnectorFamily | undefined>()
  const [picked, setPicked] = useState<ConnectorTemplate | null>(null)
  const results = searchConnectors(query, family)

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 pt-[env(safe-area-inset-top)] pb-8">
      <header className="flex items-center gap-1 py-3">
        <Button variant="ghost" size="icon" className="-ml-2" aria-label="Back" onClick={() => navigate('/')}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-extrabold tracking-tight">Choose a connector</h1>
      </header>

      <div className="sticky top-0 z-10 -mx-4 space-y-3 bg-bg/95 px-4 pt-1 pb-3 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            aria-label="Search connectors"
            placeholder="Search: vga, ps2, serial, obd…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(inputClass, 'pl-11')}
          />
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {[undefined, ...CONNECTOR_FAMILIES].map((f) => (
            <button
              key={f ?? 'all'}
              type="button"
              aria-pressed={family === f}
              onClick={() => setFamily(f)}
              className={cn(
                'h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition',
                family === f ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface text-muted',
              )}
            >
              {f ?? 'All'}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {results.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => setPicked(t)}
              className="flex h-full w-full flex-col rounded-2xl border border-border bg-surface p-3 text-left transition active:scale-[0.98] active:bg-surface-2"
            >
              <div className="mb-3 grid aspect-[4/3] w-full place-items-center rounded-xl bg-surface-2 p-2">
                <ConnectorDiagram template={t} mirrored={false} className="max-h-full w-full" />
              </div>
              <div className="font-bold">{t.name}</div>
              <div className="text-xs text-muted">
                {t.pins.length} pins · {t.description}
              </div>
            </button>
          </li>
        ))}
      </ul>
      {results.length === 0 && (
        <p className="py-12 text-center text-muted">
          No connector matches “{query}”. More types and a custom builder are coming.
        </p>
      )}

      {picked && <CreateSheet template={picked} onClose={() => setPicked(null)} />}
    </div>
  )
}

function CreateSheet({ template: t, onClose }: { template: ConnectorTemplate; onClose: () => void }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [gender, setGender] = useState<Gender>(t.refGender)
  const [presetId, setPresetId] = useState('')
  const [equipment, setEquipment] = useState('')
  const [busy, setBusy] = useState(false)

  const create = async () => {
    setBusy(true)
    const fallback = nextTitle(t.id, await db.maps.toArray())
    const map = await createMap({
      templateId: t.id,
      gender,
      title: title.trim() || fallback,
      equipment: equipment.trim(),
      preset: t.presets.find((p) => p.id === presetId),
    })
    navigate(`/map/${map.id}`, { replace: true })
  }

  return (
    <Sheet open onClose={onClose} title={`New ${t.name} map`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void create()
        }}
      >
        <div>
          <span className="mb-1.5 block text-sm font-medium text-muted">Which one are you holding?</span>
          <Segmented<Gender>
            label="Connector gender"
            value={gender}
            onChange={setGender}
            options={[
              { value: 'M', label: t.genderLabels.M },
              { value: 'F', label: t.genderLabels.F },
            ]}
          />
        </div>
        {t.presets.length > 0 && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-muted">Start from a standard pinout</span>
            <select value={presetId} onChange={(e) => setPresetId(e.target.value)} className={inputClass}>
              <option value="">Blank: I’ll label it myself</option>
              {t.presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <Field label="Name (optional)" placeholder={`${t.name} #1`} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Field
          label="Equipment / location (optional)"
          placeholder="e.g. Rack 3, PLC-2 COM port"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
        />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
          Create map
        </Button>
      </form>
    </Sheet>
  )
}
