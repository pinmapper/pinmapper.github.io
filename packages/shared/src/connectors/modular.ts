import type { WireColorCode } from '../schemas'
import { body, defineConnector, roundedPolygon } from './geometry'
import { preset } from './preset'
import type { ConnectorTemplate, Preset } from './types'

const w = (base: WireColorCode, stripe?: WireColorCode) => ({ base, ...(stripe ? { stripe } : {}) })

// Contacts drawn wider than the real 1.02 mm pitch so they stay tappable.
const PITCH = 1.6
const TOP = -4.2
const BOTTOM = 3.4
const LATCH_HALF = 3.0
const LATCH_DEPTH = 2.0

/**
 * Modular jack as seen looking into the FEMALE jack with the latch slot at the
 * bottom: contacts along the top, pin 1 on the left. `contacts` fitted
 * positions are centred in the `positions`-wide opening (6P4C = 4 of 6).
 */
function modular(opts: {
  id: string
  name: string
  aliases: string[]
  description: string
  positions: number
  contacts: number
  presets?: Preset[]
}): ConnectorTemplate {
  const halfW = (opts.positions * PITCH) / 2 + 1.0
  const s = 1.2
  return defineConnector({
    id: opts.id,
    name: opts.name,
    aliases: opts.aliases,
    family: 'Modular',
    description: opts.description,
    refGender: 'F',
    genderLabels: { M: 'Plug', F: 'Jack' },
    pinShape: { kind: 'rect', w: 1.15, h: 3.0 },
    body: [
      body(
        'shell',
        roundedPolygon(
          [
            [-halfW - s, TOP - s],
            [halfW + s, TOP - s],
            [halfW + s, BOTTOM + LATCH_DEPTH + s],
            [-halfW - s, BOTTOM + LATCH_DEPTH + s],
          ],
          s,
        ),
      ),
      body(
        'face',
        roundedPolygon(
          [
            [-halfW, TOP],
            [halfW, TOP],
            [halfW, BOTTOM],
            [LATCH_HALF, BOTTOM],
            [LATCH_HALF, BOTTOM + LATCH_DEPTH],
            [-LATCH_HALF, BOTTOM + LATCH_DEPTH],
            [-LATCH_HALF, BOTTOM],
            [-halfW, BOTTOM],
          ],
          0.5,
        ),
      ),
    ],
    pins: Array.from({ length: opts.contacts }, (_, i) => ({
      id: `${i + 1}`,
      label: `${i + 1}`,
      x: (i - (opts.contacts - 1) / 2) * PITCH,
      y: TOP + 2.0,
    })),
    presets: opts.presets ?? [],
    bounds: [-halfW - s, TOP - s, halfW + s, BOTTOM + LATCH_DEPTH + s],
  })
}

export const RJ45 = modular({
  id: 'rj45',
  name: 'RJ45 (8P8C)',
  aliases: ['ethernet', 'lan', 'cat5', 'cat6', '8p8c', 't568a', 't568b', 'network'],
  description: '8-position modular (Ethernet)',
  positions: 8,
  contacts: 8,
  presets: [
    preset('t568b', 'T568B', {
      1: { signal: 'TX+ / BI_DA+', wire: w('WH', 'OG') },
      2: { signal: 'TX− / BI_DA−', wire: w('OG') },
      3: { signal: 'RX+ / BI_DB+', wire: w('WH', 'GN') },
      4: { signal: 'BI_DC+', wire: w('BU') },
      5: { signal: 'BI_DC−', wire: w('WH', 'BU') },
      6: { signal: 'RX− / BI_DB−', wire: w('GN') },
      7: { signal: 'BI_DD+', wire: w('WH', 'BN') },
      8: { signal: 'BI_DD−', wire: w('BN') },
    }),
    preset('t568a', 'T568A', {
      1: { signal: 'TX+ / BI_DA+', wire: w('WH', 'GN') },
      2: { signal: 'TX− / BI_DA−', wire: w('GN') },
      3: { signal: 'RX+ / BI_DB+', wire: w('WH', 'OG') },
      4: { signal: 'BI_DC+', wire: w('BU') },
      5: { signal: 'BI_DC−', wire: w('WH', 'BU') },
      6: { signal: 'RX− / BI_DB−', wire: w('OG') },
      7: { signal: 'BI_DD+', wire: w('WH', 'BN') },
      8: { signal: 'BI_DD−', wire: w('BN') },
    }),
  ],
})

export const RJ12 = modular({
  id: 'rj12',
  name: 'RJ12 (6P6C)',
  aliases: ['6p6c', 'rj25', 'phone', 'telephone', 'icsp', 'pickit'],
  description: '6-position, 6 contacts',
  positions: 6,
  contacts: 6,
})

export const RJ11 = modular({
  id: 'rj11',
  name: 'RJ11 (6P4C)',
  aliases: ['6p4c', 'phone', 'telephone', 'pots', 'dsl'],
  description: '6-position, 4 contacts (telephone)',
  positions: 6,
  contacts: 4,
  presets: [
    preset('usoc', 'Telephone, 2 lines (USOC)', {
      1: { signal: 'Line 2 Tip', wire: w('BK') },
      2: { signal: 'Line 1 Ring', wire: w('RD') },
      3: { signal: 'Line 1 Tip', wire: w('GN') },
      4: { signal: 'Line 2 Ring', wire: w('YE') },
    }),
  ],
})
