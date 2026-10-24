import {
  resolveConnector,
  WIRE_COLORS,
  wireLabel,
  type ConnectorTemplate,
  type PinMap,
  type PinStatus,
} from '@pinmapper/shared'

export const STATUS_TEXT: Record<PinStatus, string> = {
  unknown: '',
  verified: 'OK',
  nc: 'NC',
  fault: 'Fault',
}

export function viewText(map: PinMap): string {
  return map.view === 'rear' ? 'Rear (wire side)' : 'Front (mating face)'
}

export function fileBase(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
  return slug || 'pinmap'
}

function csvCell(v: string): string {
  return /[",\n\r]/.test(v) || /^\s|\s$/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

/** One row per pin. Starts with a BOM so Excel opens UTF-8 correctly. */
export function toCsv(map: PinMap, t: ConnectorTemplate): string {
  const rows = [['Pin', 'Signal', 'Wire', 'Wire colour', 'Status', 'Notes']]
  for (const p of t.pins) {
    const a = map.pins[p.id]
    const w = a?.wire
    rows.push([
      p.label,
      a?.signal ?? '',
      w ? wireLabel(w.base, w.stripe) : '',
      w ? [WIRE_COLORS[w.base].name, w.stripe && `${WIRE_COLORS[w.stripe].name} stripe`].filter(Boolean).join(' / ') : '',
      a ? STATUS_TEXT[a.status] : '',
      a?.notes ?? '',
    ])
  }
  return '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

export const BACKUP_KIND = 'pinmapper-backup'

export interface Backup {
  kind: typeof BACKUP_KIND
  version: 1
  exportedAt: string
  maps: PinMap[]
}

export function toBackup(maps: PinMap[]): string {
  const backup: Backup = {
    kind: BACKUP_KIND,
    version: 1,
    exportedAt: new Date().toISOString(),
    maps: maps.filter((m) => !m.deleted),
  }
  return JSON.stringify(backup, null, 2)
}

/**
 * Accepts a backup file, a bare array of maps, or a single map. Every map is
 * schema-checked (zod is loaded on demand to keep it out of the main bundle)
 * and must use a connector this version knows.
 */
export async function parseBackup(text: string): Promise<{ maps: PinMap[]; errors: string[] }> {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { maps: [], errors: ['This file isn’t valid JSON.'] }
  }
  const list: unknown[] = Array.isArray(data)
    ? data
    : isObject(data) && data.kind === BACKUP_KIND && Array.isArray(data.maps)
      ? data.maps
      : [data]

  const { PinMap } = await import('@pinmapper/shared/schemas')
  const maps: PinMap[] = []
  const errors: string[] = []
  list.forEach((item, i) => {
    const r = PinMap.safeParse(item)
    const label = isObject(item) && typeof item.title === 'string' ? `“${item.title}”` : `Item ${i + 1}`
    if (!r.success) errors.push(`${label} isn’t a valid pin map.`)
    else if (!resolveConnector(r.data.templateId, r.data.params))
      errors.push(`${label} uses an unknown connector (${r.data.templateId}).`)
    else maps.push(r.data)
  })
  return { maps, errors }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}
