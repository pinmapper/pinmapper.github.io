import type { WireColorCode } from '../schemas'
import { body, defineConnector, rectPath, roundedPolygon } from './geometry'
import { preset } from './preset'
import type { PinDef } from './types'

const w = (base: WireColorCode) => ({ base })
const CHECK_PIN1 = 'Check pin 1 against the datasheet for your part before relying on it.'

const USB2 = preset('usb2', 'USB 2.0', {
  1: { signal: 'VBUS +5V', wire: w('RD') },
  2: { signal: 'D−', wire: w('WH') },
  3: { signal: 'D+', wire: w('GN') },
  4: { signal: 'GND', wire: w('BK') },
})

/** Standard-A as seen looking into the FEMALE receptacle, tongue on top: 4 3 2 1. */
export const USB_A = defineConnector({
  id: 'usb-a',
  name: 'USB-A',
  aliases: ['usb', 'usb a', 'type a', 'usb2'],
  family: 'USB',
  description: 'Standard-A, 4 contacts (USB 1.x/2.0)',
  note: CHECK_PIN1,
  refGender: 'F',
  genderLabels: { M: 'Plug', F: 'Receptacle (port)' },
  pinShape: { kind: 'rect', w: 1.4, h: 1.3 },
  body: [
    body('shell', rectPath(-6.6, -2.85, 13.2, 5.7, 0.5)),
    body('key', rectPath(-6, -2.25, 12, 4.5, 0.2)),
    body('face', rectPath(-5.4, -2.25, 10.8, 2.35, 0.2)),
  ],
  pins: [4, 3, 2, 1].map((n, i) => ({ id: `${n}`, label: `${n}`, x: (i - 1.5) * 2.5, y: -0.6 })),
  presets: [USB2],
  bounds: [-6.6, -2.85, 6.6, 2.85],
})

/** Standard-B as seen looking into the FEMALE receptacle, bevelled corners up: 2 1 over 3 4. */
export const USB_B = defineConnector({
  id: 'usb-b',
  name: 'USB-B',
  aliases: ['usb', 'usb b', 'type b', 'printer'],
  family: 'USB',
  description: 'Standard-B, 4 contacts (printers, devices)',
  note: CHECK_PIN1,
  refGender: 'F',
  genderLabels: { M: 'Plug', F: 'Receptacle (port)' },
  pinShape: { kind: 'rect', w: 1.4, h: 1.1 },
  body: [
    body(
      'shell',
      roundedPolygon(
        [
          [-3.2, -4.6],
          [3.2, -4.6],
          [4.9, -2.9],
          [4.9, 4.5],
          [-4.9, 4.5],
          [-4.9, -2.9],
        ],
        0.5,
      ),
    ),
    body(
      'key',
      roundedPolygon(
        [
          [-2.8, -3.9],
          [2.8, -3.9],
          [4.2, -2.5],
          [4.2, 3.8],
          [-4.2, 3.8],
          [-4.2, -2.5],
        ],
        0.3,
      ),
    ),
    body('face', rectPath(-2.5, -1.9, 5, 3.9, 0.3)),
  ],
  pins: [
    { id: '2', label: '2', x: -1.25, y: -1.25 },
    { id: '1', label: '1', x: 1.25, y: -1.25 },
    { id: '3', label: '3', x: -1.25, y: 1.35 },
    { id: '4', label: '4', x: 1.25, y: 1.35 },
  ],
  presets: [USB2],
  bounds: [-4.9, -4.6, 4.9, 4.5],
})

const C_PITCH = 1.5
const C_SIGNALS = [
  'GND', 'TX1+', 'TX1−', 'VBUS', 'CC1', 'D+', 'D−', 'SBU1', 'VBUS', 'RX2−', 'RX2+', 'GND',
]
const C_SIGNALS_B = [
  'GND', 'TX2+', 'TX2−', 'VBUS', 'CC2', 'D+', 'D−', 'SBU2', 'VBUS', 'RX1−', 'RX1+', 'GND',
]

/**
 * USB-C as seen looking into the FEMALE receptacle: A1..A12 along the top row
 * left to right, B12..B1 along the bottom row (B1 sits under A12).
 */
export const USB_C = (() => {
  const pins: PinDef[] = []
  for (let i = 0; i < 12; i++) pins.push({ id: `A${i + 1}`, label: `A${i + 1}`, x: (i - 5.5) * C_PITCH, y: -1.5 })
  for (let i = 0; i < 12; i++) pins.push({ id: `B${12 - i}`, label: `B${12 - i}`, x: (i - 5.5) * C_PITCH, y: 1.5 })
  const halfW = 6 * C_PITCH + 2.2
  return defineConnector({
    id: 'usb-c',
    name: 'USB-C',
    aliases: ['usb', 'type c', 'usbc', 'usb3', 'usb4', 'thunderbolt'],
    family: 'USB',
    description: '24 contacts, reversible',
    refGender: 'F',
    genderLabels: { M: 'Plug', F: 'Receptacle (port)' },
    pinShape: { kind: 'rect', w: 1.0, h: 1.9 },
    body: [
      body('shell', rectPath(-halfW, -4.2, halfW * 2, 8.4, 4.2)),
      body('key', rectPath(-halfW + 0.7, -3.5, halfW * 2 - 1.4, 7, 3.5)),
      body('face', rectPath(-6 * C_PITCH - 0.4, -2.7, 12 * C_PITCH + 0.8, 5.4, 0.6)),
    ],
    pins,
    presets: [
      preset(
        'usb-c',
        'USB-C receptacle',
        Object.fromEntries([
          ...C_SIGNALS.map((s, i) => [`A${i + 1}`, s]),
          ...C_SIGNALS_B.map((s, i) => [`B${i + 1}`, s]),
        ]),
      ),
    ],
    bounds: [-halfW, -4.2, halfW, 4.2],
  })
})()
