import type { WireColorCode } from '../schemas'
import { body, defineConnector, roundedPolygon } from './geometry'
import { preset } from './preset'

const w = (base: WireColorCode, stripe?: WireColorCode) => ({ base, ...(stripe ? { stripe } : {}) })

// Contacts drawn wider than the real 1.02 mm pitch so they stay tappable.
const PITCH = 1.6
const HALF_W = 7.4
const TOP = -4.2
const BOTTOM = 3.4
const LATCH_HALF = 3.0
const LATCH_DEPTH = 2.0

/**
 * 8P8C (RJ45) as seen looking into the FEMALE jack with the latch slot at the
 * bottom: contacts along the top, pin 1 on the left.
 */
export const RJ45 = defineConnector({
  id: 'rj45',
  name: 'RJ45 (8P8C)',
  aliases: ['ethernet', 'lan', 'cat5', 'cat6', '8p8c', 't568a', 't568b', 'network'],
  family: 'Modular',
  description: '8-position modular (Ethernet)',
  refGender: 'F',
  genderLabels: { M: 'Plug', F: 'Jack' },
  pinShape: { kind: 'rect', w: 1.15, h: 3.0 },
  body: [
    body(
      'shell',
      roundedPolygon(
        [
          [-HALF_W - 1.2, TOP - 1.2],
          [HALF_W + 1.2, TOP - 1.2],
          [HALF_W + 1.2, BOTTOM + LATCH_DEPTH + 1.2],
          [-HALF_W - 1.2, BOTTOM + LATCH_DEPTH + 1.2],
        ],
        1.2,
      ),
    ),
    body(
      'face',
      roundedPolygon(
        [
          [-HALF_W, TOP],
          [HALF_W, TOP],
          [HALF_W, BOTTOM],
          [LATCH_HALF, BOTTOM],
          [LATCH_HALF, BOTTOM + LATCH_DEPTH],
          [-LATCH_HALF, BOTTOM + LATCH_DEPTH],
          [-LATCH_HALF, BOTTOM],
          [-HALF_W, BOTTOM],
        ],
        0.5,
      ),
    ),
  ],
  pins: Array.from({ length: 8 }, (_, i) => ({
    id: `${i + 1}`,
    label: `${i + 1}`,
    x: (i - 3.5) * PITCH,
    y: TOP + 2.0,
  })),
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
  bounds: [-HALF_W - 1.2, TOP - 1.2, HALF_W + 1.2, BOTTOM + LATCH_DEPTH + 1.2],
})
