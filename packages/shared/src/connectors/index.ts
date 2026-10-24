import type { Gender, View } from '../schemas'
import { OBD2 } from './automotive'
import { MINIDIN6 } from './din'
import { DA15, DB25, DC37, DE15, DE9 } from './dsub'
import { RJ11, RJ12, RJ45 } from './modular'
import { CUSTOM_CIRCULAR, CUSTOM_GRID, HEADER, IDC } from './parametric'
import type { ConnectorDef, ConnectorFamily, ConnectorTemplate, Params } from './types'
import { USB_A, USB_B, USB_C } from './usb'

export type * from './types'

function fixed(t: ConnectorTemplate): ConnectorDef {
  const { id, name, aliases, family, description, note } = t
  return { id, name, aliases, family, description, note, params: [], build: () => t }
}

/** Everything the connector picker offers, in display order. */
export const CATALOG: ConnectorDef[] = [
  ...[DE9, DA15, DE15, DB25, DC37, USB_A, USB_B, USB_C, RJ45, RJ11, RJ12, MINIDIN6].map(fixed),
  IDC,
  HEADER,
  fixed(OBD2),
  CUSTOM_GRID,
  CUSTOM_CIRCULAR,
]

export const CONNECTOR_FAMILIES: ConnectorFamily[] = [
  'D-sub',
  'USB',
  'Modular',
  'DIN',
  'Header',
  'Automotive',
  'Custom',
]

const byId = new Map(CATALOG.map((c) => [c.id, c]))

export function getConnectorDef(id: string): ConnectorDef | undefined {
  return byId.get(id)
}

/** Fill in defaults, clamp numbers into range and drop unknown keys. */
export function normalizeParams(def: ConnectorDef, params: Params = {}): Params {
  const out: Params = {}
  for (const p of def.params) {
    const v = params[p.key]
    if (p.kind === 'int')
      out[p.key] = typeof v === 'number' && Number.isFinite(v) ? Math.min(p.max, Math.max(p.min, Math.round(v))) : p.default
    else if (p.kind === 'bool') out[p.key] = typeof v === 'boolean' ? v : p.default
    else out[p.key] = p.options.some((o) => o.value === v) ? (v as string) : p.default
  }
  return out
}

const cache = new Map<string, ConnectorTemplate>()

/** The drawable template for a map: fixed connectors ignore params. */
export function resolveConnector(id: string, params?: Params): ConnectorTemplate | undefined {
  const def = byId.get(id)
  if (!def) return undefined
  const p = normalizeParams(def, params)
  const key = `${id}:${JSON.stringify(p)}`
  let t = cache.get(key)
  if (!t) {
    t = def.build(p)
    cache.set(key, t)
  }
  return t
}

/**
 * The mating faces of a plug and its socket are mirror images, and so are the
 * front and rear of one connector. Each template is drawn for `refGender`'s
 * mating face, so flip once for each difference.
 */
export function isMirrored(t: ConnectorTemplate, gender: Gender, view: View): boolean {
  return (gender !== t.refGender) !== (view === 'rear')
}

export function searchConnectors(query: string, family?: ConnectorFamily): ConnectorDef[] {
  const q = query.trim().toLowerCase().replace(/[\s-]+/g, '')
  return CATALOG.filter((c) => {
    if (family && c.family !== family) return false
    if (!q) return true
    return [c.name, c.description, ...c.aliases].some((s) =>
      s.toLowerCase().replace(/[\s-]+/g, '').includes(q),
    )
  })
}
