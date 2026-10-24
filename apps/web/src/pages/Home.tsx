import { isAnnotated, isMirrored, resolveConnector, type PinMap } from '@pinmapper/shared'
import { useLiveQuery } from 'dexie-react-hooks'
import { Moon, Plus, Search, Sun } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ConnectorDiagram } from '@/components/ConnectorDiagram'
import { inputClass } from '@/components/ui/Field'
import { db } from '@/db'
import { cn } from '@/lib/cn'
import { useTheme } from '@/lib/theme'
import { timeAgo } from '@/lib/time'
import { DEMO_PINS } from './demo'

export function Home() {
  const maps = useLiveQuery(() =>
    db.maps.orderBy('updatedAt').reverse().filter((m) => !m.deleted).toArray(),
  )
  const [query, setQuery] = useState('')
  const { theme, toggle } = useTheme()

  const q = query.trim().toLowerCase()
  const visible = maps?.filter(
    (m) =>
      !q ||
      [m.title, m.equipment, resolveConnector(m.templateId, m.params)?.name ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q),
  )

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pt-[env(safe-area-inset-top)] pb-28">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2.5">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-9" />
          <h1 className="text-xl font-extrabold tracking-tight">PinMapper</h1>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2"
        >
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </header>

      {maps && maps.length === 0 && <EmptyState />}

      {maps && maps.length > 0 && (
        <>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
            <input
              type="search"
              aria-label="Search your pin maps"
              placeholder="Search maps"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(inputClass, 'pl-11')}
            />
          </div>
          <ul className="grid gap-3">
            {visible?.map((m) => (
              <li key={m.id}>
                <MapCard map={m} />
              </li>
            ))}
          </ul>
          {visible?.length === 0 && <p className="py-10 text-center text-muted">No maps match “{query}”.</p>}
        </>
      )}

      <Link
        to="/new"
        className="fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 mx-auto flex h-14 max-w-md items-center justify-center gap-2 rounded-2xl bg-accent text-lg font-bold text-accent-fg shadow-xl shadow-accent/25 transition active:scale-[0.98]"
      >
        <Plus className="size-6" strokeWidth={2.5} /> New pin map
      </Link>
    </div>
  )
}

function MapCard({ map }: { map: PinMap }) {
  const t = resolveConnector(map.templateId, map.params)
  if (!t) return null
  const done = t.pins.filter((p) => isAnnotated(map.pins[p.id])).length
  return (
    <Link
      to={`/map/${map.id}`}
      className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-3 transition active:scale-[0.99] active:bg-surface-2"
    >
      <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-surface-2 p-1.5">
        <ConnectorDiagram
          template={t}
          mirrored={isMirrored(t, map.gender, map.view)}
          pins={map.pins}
          className="max-h-full w-full"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{map.title || 'Untitled'}</div>
        <div className="truncate text-sm text-muted">
          {t.name} · {t.genderLabels[map.gender]}
        </div>
        {map.equipment && <div className="truncate text-sm text-muted">{map.equipment}</div>}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-accent" style={{ width: `${(done / t.pins.length) * 100}%` }} />
          </div>
          <span className="tabular-nums">
            {done}/{t.pins.length}
          </span>
          <span>·</span>
          <span>{timeAgo(map.updatedAt)}</span>
        </div>
      </div>
    </Link>
  )
}

function EmptyState() {
  const demo = resolveConnector('de9')!
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
      <div className="mb-8 w-full max-w-xs rounded-3xl border border-border bg-surface p-6">
        <ConnectorDiagram template={demo} mirrored={false} pins={DEMO_PINS} selectedId="3" className="w-full" />
      </div>
      <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-balance">
        Label connector pins, not scraps of paper.
      </h2>
      <p className="max-w-sm text-muted text-balance">
        Pick a connector, tap a pin and record its signal, wire colour and status. Everything is saved
        on this device and works offline.
      </p>
    </div>
  )
}
