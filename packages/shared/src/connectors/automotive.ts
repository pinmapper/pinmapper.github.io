import { body, defineConnector, rectPath, roundedPolygon, trapezoid } from './geometry'
import { preset } from './preset'
import type { PinDef } from './types'

const PITCH = 2.8
const ROW_GAP = 3.6
const TOP_HALF = 3.5 * PITCH + 2.4
const TOP = -ROW_GAP / 2 - 2.2
const BOTTOM = ROW_GAP / 2 + 2.2
const BOTTOM_HALF = TOP_HALF - 1.6
const S = 1.4

const pins: PinDef[] = []
for (let row = 0; row < 2; row++)
  for (let i = 0; i < 8; i++) {
    const n = row * 8 + i + 1
    pins.push({ id: `${n}`, label: `${n}`, x: (i - 3.5) * PITCH, y: (row - 0.5) * ROW_GAP })
  }

/**
 * SAE J1962 / OBD-II as seen on the mating face of the FEMALE vehicle socket
 * (DLC): top row 1..8 left to right, bottom row 9..16.
 */
export const OBD2 = defineConnector({
  id: 'obd2',
  name: 'OBD-II (J1962)',
  aliases: ['obd', 'obd2', 'obdii', 'j1962', 'dlc', 'diagnostic', 'car'],
  family: 'Automotive',
  description: '16-pin vehicle diagnostic connector',
  refGender: 'F',
  genderLabels: { M: 'Male (scan tool plug)', F: 'Female (vehicle socket)' },
  pinShape: { kind: 'circle', r: 1.0 },
  body: [
    body('shell', roundedPolygon(trapezoid(TOP_HALF + S, BOTTOM_HALF + S, TOP - S, BOTTOM + S), 2.2)),
    body('face', roundedPolygon(trapezoid(TOP_HALF, BOTTOM_HALF, TOP, BOTTOM), 1.6)),
    body('key', rectPath(-1.6, TOP - S - 0.01, 3.2, S + 0.9, 0.3)),
  ],
  pins,
  presets: [
    preset('obd2', 'OBD-II standard', {
      2: 'J1850 Bus+',
      4: 'Chassis GND',
      5: 'Signal GND',
      6: 'CAN-H (ISO 15765)',
      7: 'K-Line (ISO 9141)',
      10: 'J1850 Bus−',
      14: 'CAN-L (ISO 15765)',
      15: 'L-Line (ISO 9141)',
      16: 'Battery +12V',
    }),
  ],
  bounds: [-TOP_HALF - S, TOP - S, TOP_HALF + S, BOTTOM + S],
})
