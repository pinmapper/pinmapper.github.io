import {
  emptyAnnotation,
  getConnector,
  isAnnotated,
  isMirrored,
  type PinAnnotation,
  type PinMap,
  type View,
} from '@pinmapper/shared'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  ArrowLeftRight,
  Hash,
  LayoutGrid,
  List,
  MoreVertical,
  Tag,
  Trash2,
  Wand2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ConnectorDiagram, type LabelMode } from '@/components/ConnectorDiagram'
import { PinSheet } from '@/components/PinSheet'
import { PinTable } from '@/components/PinTable'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { ZoomPan } from '@/components/ZoomPan'
import { applyPreset, db, deleteMap, saveMap } from '@/db'
import { cn } from '@/lib/cn'
import { tick } from '@/lib/haptics'

const SAVE_DELAY_MS = 400

export function Editor() {
  const { id = '' } = useParams()
  // null = not found; undefined = still loading.
  const stored = useLiveQuery(() => db.maps.get(id).then((m) => m ?? null), [id])

  if (stored === null || stored?.deleted)
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div>
          <p className="mb-4 text-lg font-semibold">This pin map doesn’t exist on this device.</p>
          <Link to="/" className="font-semibold text-accent">
            Back to your maps
          </Link>
        </div>
      </div>
    )
  if (!stored) return null
  // The stored map only seeds the editor; later DB updates are our own autosaves.
  return <EditorView key={stored.id} initial={stored} />
}

/**
 * Edits apply to local state immediately and are written to IndexedDB after a
 * short pause, so typing never waits on storage. Pending writes flush when the
 * page is hidden or the editor unmounts.
 */
function useAutosave(map: PinMap) {
  const saved = useRef(map)
  const pending = useRef<PinMap | null>(null)

  const flush = useCallback(() => {
    if (!pending.current) return
    void saveMap(pending.current)
    pending.current = null
  }, [])

  useEffect(() => {
    if (map === saved.current) return
    saved.current = map
    pending.current = map
    const timer = window.setTimeout(flush, SAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [map, flush])

  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flush()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])
}

function EditorView({ initial }: { initial: PinMap }) {
  const navigate = useNavigate()
  const [map, setMap] = useState(initial)
  useAutosave(map)
  const update = (fn: (m: PinMap) => PinMap) => setMap(fn)
  const template = getConnector(map.templateId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<'diagram' | 'table'>('diagram')
  const [labelMode, setLabelMode] = useState<LabelMode>('number')
  const [menuOpen, setMenuOpen] = useState(false)

  const usedSignals = useMemo(
    () => [...new Set(Object.values(map.pins).map((a) => a.signal.trim()).filter(Boolean))],
    [map.pins],
  )

  if (!template)
    return <p className="p-6">Unknown connector type “{map.templateId}”.</p>

  const pins = template.pins
  const index = pins.findIndex((p) => p.id === selectedId)
  const selected = index >= 0 ? pins[index] : null
  const labelled = pins.filter((p) => isAnnotated(map.pins[p.id])).length
  const mirrored = isMirrored(template, map.gender, map.view)

  const patchPin = (pinId: string, patch: Partial<PinAnnotation>) =>
    update((m) => ({
      ...m,
      pins: { ...m.pins, [pinId]: { ...(m.pins[pinId] ?? emptyAnnotation()), ...patch } },
    }))

  const step = (dir: 1 | -1) => {
    tick()
    if (dir === 1 && index === pins.length - 1) return setSelectedId(null)
    setSelectedId(pins[(index + dir + pins.length) % pins.length].id)
  }

  const startLabelling = () => {
    const first = pins.find((p) => !isAnnotated(map.pins[p.id])) ?? pins[0]
    setSelectedId(first.id)
  }

  const otherGender = map.gender === 'M' ? 'F' : 'M'

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-1 border-b border-border px-2 pt-[env(safe-area-inset-top)]">
        <Button variant="ghost" size="icon" aria-label="Back to all maps" onClick={() => navigate('/')}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1 py-1.5">
          <input
            aria-label="Map title"
            value={map.title}
            onChange={(e) => update((m) => ({ ...m, title: e.target.value }))}
            className="w-full truncate rounded-lg bg-transparent px-1 text-base font-bold outline-none focus:bg-surface-2"
          />
          <div className="truncate px-1 text-xs text-muted">
            {template.name} · {template.genderLabels[map.gender]}
            {map.equipment && ` · ${map.equipment}`}
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="More actions" onClick={() => setMenuOpen(true)}>
          <MoreVertical className="size-5" />
        </Button>
      </header>

      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Segmented
          label="View mode"
          className="w-32 shrink-0"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'diagram', label: <LayoutGrid className="size-4.5" aria-label="Diagram" /> },
            { value: 'table', label: <List className="size-4.5" aria-label="Table" /> },
          ]}
        />
        <Segmented<View>
          label="Which side you are looking at"
          className="flex-1"
          value={map.view}
          onChange={(view) => update((m) => ({ ...m, view }))}
          options={[
            { value: 'mating', label: 'Front' },
            { value: 'rear', label: 'Rear', className: 'text-accent' },
          ]}
        />
      </div>

      <main className="relative min-h-0 flex-1">
        {tab === 'diagram' ? (
          <>
            <ZoomPan onTapPin={(pid) => setSelectedId(pid)} showControls={!selected}>
              <ConnectorDiagram
                template={template}
                mirrored={mirrored}
                pins={map.pins}
                selectedId={selectedId}
                labelMode={labelMode}
                interactive
                onPinActivate={setSelectedId}
                className="max-h-full w-full max-w-3xl p-3"
              />
            </ZoomPan>
            <ViewBadge view={map.view} genderLabel={template.genderLabels[map.gender]} />
            <div className={cn('absolute bottom-3 left-3', selected && 'hidden')}>
              <button
                type="button"
                onClick={() => setLabelMode((l) => (l === 'number' ? 'signal' : 'number'))}
                aria-label={labelMode === 'number' ? 'Show signal names on pins' : 'Show pin numbers'}
                className="flex h-11 items-center gap-1.5 rounded-full border border-border bg-surface/90 px-4 text-sm font-semibold shadow-md backdrop-blur"
              >
                {labelMode === 'number' ? <Tag className="size-4" /> : <Hash className="size-4" />}
                {labelMode === 'number' ? 'Signals' : 'Numbers'}
              </button>
            </div>
          </>
        ) : (
          <div className="h-full overflow-y-auto">
            <PinTable template={template} pins={map.pins} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        )}
      </main>

      {selected ? (
        <PinSheet
          key={selected.id}
          pin={selected}
          annotation={map.pins[selected.id] ?? emptyAnnotation()}
          position={{ index, total: pins.length }}
          usedSignals={usedSignals}
          onChange={(patch) => patchPin(selected.id, patch)}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onClose={() => setSelectedId(null)}
        />
      ) : (
        <footer className="flex items-center gap-3 border-t border-border bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 text-sm">
              <span className="font-bold tabular-nums">{labelled}</span>
              <span className="text-muted"> of {pins.length} pins labelled</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${(labelled / pins.length) * 100}%` }}
              />
            </div>
          </div>
          <Button variant="primary" onClick={startLabelling}>
            {labelled === 0 ? 'Start labelling' : labelled === pins.length ? 'Review' : 'Continue'}
          </Button>
        </footer>
      )}

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Map options">
        <div className="space-y-4">
          <Field
            label="Equipment / location"
            placeholder="e.g. Rack 3, PLC-2 COM port"
            value={map.equipment}
            onChange={(e) => update((m) => ({ ...m, equipment: e.target.value }))}
          />
          <Button
            className="w-full justify-start"
            onClick={() => {
              update((m) => ({ ...m, gender: otherGender }))
              setMenuOpen(false)
            }}
          >
            <ArrowLeftRight className="size-5" /> Switch to {template.genderLabels[otherGender]}
          </Button>
          {template.presets.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium text-muted">Apply a standard pinout</div>
              <div className="grid gap-2">
                {template.presets.map((p) => (
                  <Button
                    key={p.id}
                    className="w-full justify-start"
                    onClick={() => {
                      if (labelled > 0 && !confirm(`Apply ${p.name}? Signal names and wire colours on matching pins will be replaced.`))
                        return
                      update((m) => ({ ...m, pins: applyPreset(m.pins, p) }))
                      setMenuOpen(false)
                    }}
                  >
                    <Wand2 className="size-5" /> {p.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <Button
            variant="danger"
            className="w-full justify-start"
            onClick={async () => {
              if (!confirm(`Delete “${map.title}”?`)) return
              await deleteMap(map.id)
              navigate('/', { replace: true })
            }}
          >
            <Trash2 className="size-5" /> Delete map
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

/** Always say which face is shown: mixing up mating face and wire side is the classic mistake. */
function ViewBadge({ view, genderLabel }: { view: View; genderLabel: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase shadow-md backdrop-blur',
          view === 'rear'
            ? 'border-accent/60 bg-accent-soft text-accent'
            : 'border-border bg-surface/85 text-text',
        )}
      >
        <span className={cn('size-2 rounded-full', view === 'rear' ? 'bg-accent' : 'bg-success')} />
        {view === 'rear' ? 'Rear · wire side' : 'Front · mating face'}
        <span className="font-medium normal-case opacity-70">{genderLabel}</span>
      </div>
    </div>
  )
}
