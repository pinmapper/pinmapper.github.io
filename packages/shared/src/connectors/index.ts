import type { Gender, View } from '../schemas'
import { OBD2 } from './automotive'
import { MINIDIN6 } from './din'
import { DA15, DB25, DC37, DE15, DE9 } from './dsub'
import { RJ45 } from './modular'
import type { ConnectorFamily, ConnectorTemplate } from './types'

export type * from './types'

export const CONNECTORS: ConnectorTemplate[] = [DE9, DA15, DE15, DB25, DC37, MINIDIN6, RJ45, OBD2]

export const CONNECTOR_FAMILIES: ConnectorFamily[] = ['D-sub', 'DIN', 'Modular', 'Automotive']

const byId = new Map(CONNECTORS.map((c) => [c.id, c]))

export function getConnector(id: string): ConnectorTemplate | undefined {
  return byId.get(id)
}

/**
 * The mating faces of a plug and its socket are mirror images, and so are the
 * front and rear of one connector. Each template is drawn for `refGender`'s
 * mating face, so flip once for each difference.
 */
export function isMirrored(t: ConnectorTemplate, gender: Gender, view: View): boolean {
  return (gender !== t.refGender) !== (view === 'rear')
}

export function searchConnectors(query: string, family?: ConnectorFamily): ConnectorTemplate[] {
  const q = query.trim().toLowerCase().replace(/[\s-]+/g, '')
  return CONNECTORS.filter((c) => {
    if (family && c.family !== family) return false
    if (!q) return true
    return [c.name, c.description, ...c.aliases].some((s) =>
      s.toLowerCase().replace(/[\s-]+/g, '').includes(q),
    )
  })
}
