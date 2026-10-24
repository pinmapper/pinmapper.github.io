import {
  emptyAnnotation,
  resolveConnector,
  type Gender,
  type Params,
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
  params?: Params
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
    ...(opts.params && Object.keys(opts.params).length ? { params: opts.params } : {}),
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

export function nextTitle(templateId: string, params: Params, existing: PinMap[]): string {
  const name = resolveConnector(templateId, params)?.name ?? templateId
  const n = existing.filter((m) => !m.deleted && m.templateId === templateId).length + 1
  return `${name} #${n}`
}


export interface ImportResult {
  added: number
  updated: number
  skipped: number
}

/**
 * Merge imported maps by id: new or deleted-locally maps are restored, and an
 * existing map is only replaced when the imported copy is newer.
 */
export async function importMaps(maps: PinMap[]): Promise<ImportResult> {
  const result: ImportResult = { added: 0, updated: 0, skipped: 0 }
  await db.transaction('rw', db.maps, async () => {
    for (const m of maps) {
      const cur = await db.maps.get(m.id)
      if (!cur || cur.deleted) {
        await db.maps.put({ ...m, deleted: false })
        result.added++
      } else if (m.updatedAt > cur.updatedAt) {
        await db.maps.put({ ...m, rev: Math.max(cur.rev, m.rev) + 1, deleted: false })
        result.updated++
      } else result.skipped++
    }
  })
  return result
}

