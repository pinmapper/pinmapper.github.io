import {
  emptyAnnotation,
  getConnector,
  type Gender,
  type PinAnnotation,
  type PinMap,
  type Preset,
} from '@pinmapper/shared'
import Dexie, { type EntityTable } from 'dexie'
import { nanoid } from 'nanoid'

export const db = new Dexie('pinmapper') as Dexie & { maps: EntityTable<PinMap, 'id'> }

db.version(1).stores({ maps: 'id, updatedAt' })

export async function createMap(opts: {
  templateId: string
  gender: Gender
  title: string
  equipment?: string
  preset?: Preset
}): Promise<PinMap> {
  const now = Date.now()
  const map: PinMap = {
    id: nanoid(10),
    title: opts.title,
    templateId: opts.templateId,
    gender: opts.gender,
    view: 'mating',
    equipment: opts.equipment ?? '',
    pins: opts.preset ? applyPreset({}, opts.preset) : {},
    createdAt: now,
    updatedAt: now,
    rev: 0,
    deleted: false,
  }
  await db.maps.add(map)
  return map
}

/** Write a full map, bumping its revision. Deleted maps are kept (soft delete) for future sync. */
export async function saveMap(map: PinMap): Promise<void> {
  await db.transaction('rw', db.maps, async () => {
    const cur = await db.maps.get(map.id)
    // A pending autosave must never resurrect a map deleted in the meantime.
    const deleted = map.deleted || !!cur?.deleted
    await db.maps.put({ ...map, deleted, updatedAt: Date.now(), rev: (cur?.rev ?? map.rev) + 1 })
  })
}

export async function deleteMap(id: string): Promise<void> {
  await db.maps.update(id, { deleted: true, updatedAt: Date.now() })
}

/** Preset values replace signal and wire on the pins they cover; notes and status are kept. */
export function applyPreset(pins: PinMap['pins'], preset: Preset): PinMap['pins'] {
  const next = { ...pins }
  for (const [id, p] of Object.entries(preset.pins)) {
    const cur = next[id] ?? emptyAnnotation()
    next[id] = { ...cur, signal: p.signal ?? cur.signal, wire: p.wire ?? cur.wire }
  }
  return next
}

export function nextTitle(templateId: string, existing: PinMap[]): string {
  const name = getConnector(templateId)?.name ?? templateId
  const n = existing.filter((m) => !m.deleted && m.templateId === templateId).length + 1
  return `${name} #${n}`
}

export type { PinAnnotation }
