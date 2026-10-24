import { body, defineConnector, roundedPolygon, trapezoid } from './geometry'
import { preset } from './preset'
import type { ConnectorTemplate, PinDef, Preset } from './types'

const TAN10 = Math.tan((10 * Math.PI) / 180)
const GENDER_LABELS = { M: 'Male (pins)', F: 'Female (sockets)' }

/**
 * Two-row D-sub as seen on the mating face of the MALE connector:
 * top row 1..n left to right, bottom row n+1.. left to right.
 */
function dsub(opts: {
  id: string
  name: string
  aliases: string[]
  description: string
  topRow: number
  presets?: Preset[]
}): ConnectorTemplate {
  const p = 2.77
  const rowGap = 2.84
  const r = 0.95
  const n = opts.topRow
  const pins: PinDef[] = []
  for (let i = 0; i < n; i++)
    pins.push({ id: `${i + 1}`, label: `${i + 1}`, x: (i - (n - 1) / 2) * p, y: -rowGap / 2 })
  for (let i = 0; i < n - 1; i++)
    pins.push({ id: `${n + i + 1}`, label: `${n + i + 1}`, x: (i - (n - 2) / 2) * p, y: rowGap / 2 })
  return dsubBody({ ...opts, pins, r, topHalf: ((n - 1) / 2) * p + 2.1, top: -rowGap / 2 - 2, bottom: rowGap / 2 + 2 })
}

function dsubBody(opts: {
  id: string
  name: string
  aliases: string[]
  description: string
  pins: PinDef[]
  r: number
  topHalf: number
  top: number
  bottom: number
  presets?: Preset[]
}): ConnectorTemplate {
  const { topHalf, top, bottom } = opts
  const bottomHalf = topHalf - (bottom - top) * TAN10
  const s = 1.3 // metal shell thickness
  const face = trapezoid(topHalf, bottomHalf, top, bottom)
  const shell = trapezoid(topHalf + s, bottomHalf + s, top - s, bottom + s)
  return defineConnector({
    id: opts.id,
    name: opts.name,
    aliases: opts.aliases,
    family: 'D-sub',
    description: opts.description,
    refGender: 'M',
    genderLabels: GENDER_LABELS,
    pinShape: { kind: 'circle', r: opts.r },
    body: [body('shell', roundedPolygon(shell, 1.6)), body('face', roundedPolygon(face, 1.1))],
    pins: opts.pins,
    presets: opts.presets ?? [],
    bounds: [-topHalf - s, top - s, topHalf + s, bottom + s],
  })
}

export const DE9 = dsub({
  id: 'de9',
  name: 'DE-9',
  aliases: ['db9', 'db-9', 'serial', 'rs232', 'rs-232', 'com', 'can'],
  description: '9-pin D-sub (serial, CAN, console)',
  topRow: 5,
  presets: [
    preset('rs232-dte', 'RS-232 (DTE)', {
      1: 'DCD', 2: 'RXD', 3: 'TXD', 4: 'DTR', 5: 'GND', 6: 'DSR', 7: 'RTS', 8: 'CTS', 9: 'RI',
    }),
    preset('can-cia', 'CAN (CiA 303-1)', { 2: 'CAN-L', 3: 'CAN-GND', 5: 'Shield', 7: 'CAN-H', 9: 'CAN-V+' }),
  ],
})

export const DA15 = dsub({
  id: 'da15',
  name: 'DA-15',
  aliases: ['db15', 'db-15', 'game port', 'joystick', 'midi', 'aui'],
  description: '15-pin D-sub, 2 rows (game port, AUI)',
  topRow: 8,
  presets: [
    preset('gameport', 'PC game port', {
      1: '+5V', 2: 'Button 1', 3: 'X1 axis', 4: 'GND', 5: 'GND', 6: 'Y1 axis', 7: 'Button 2', 8: '+5V',
      9: '+5V', 10: 'Button 4', 11: 'X2 axis', 12: 'GND / MIDI out', 13: 'Y2 axis', 14: 'Button 3',
      15: '+5V / MIDI in',
    }),
  ],
})

export const DB25 = dsub({
  id: 'db25',
  name: 'DB-25',
  aliases: ['parallel', 'lpt', 'printer', 'rs232', 'serial', 'scsi'],
  description: '25-pin D-sub (parallel, serial)',
  topRow: 13,
  presets: [
    preset('rs232-db25', 'RS-232 (DTE)', {
      1: 'Shield', 2: 'TXD', 3: 'RXD', 4: 'RTS', 5: 'CTS', 6: 'DSR', 7: 'GND', 8: 'DCD', 20: 'DTR', 22: 'RI',
    }),
    preset('lpt', 'Parallel port (IEEE 1284)', {
      1: '/Strobe', 2: 'D0', 3: 'D1', 4: 'D2', 5: 'D3', 6: 'D4', 7: 'D5', 8: 'D6', 9: 'D7', 10: '/Ack',
      11: 'Busy', 12: 'Paper out', 13: 'Select', 14: '/Autofeed', 15: '/Error', 16: '/Init',
      17: '/Select in', 18: 'GND', 19: 'GND', 20: 'GND', 21: 'GND', 22: 'GND', 23: 'GND', 24: 'GND',
      25: 'GND',
    }),
  ],
})

export const DC37 = dsub({
  id: 'dc37',
  name: 'DC-37',
  aliases: ['db37', 'db-37'],
  description: '37-pin D-sub',
  topRow: 19,
})

/** High-density 15-pin, 3 rows of 5 (VGA). */
export const DE15 = (() => {
  const p = 2.29
  const rowGap = 1.98
  const pins: PinDef[] = []
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 5; i++) {
      const n = row * 5 + i + 1
      pins.push({
        id: `${n}`,
        label: `${n}`,
        x: (i - 2) * p - (row === 1 ? p / 2 : 0),
        y: (row - 1) * rowGap,
      })
    }
  return dsubBody({
    id: 'de15',
    name: 'DE-15 (VGA)',
    aliases: ['vga', 'hd15', 'hd-15', 'db15', 'svga', 'monitor'],
    description: 'High-density 15-pin, 3 rows (VGA)',
    pins,
    r: 0.8,
    topHalf: 2 * p + p / 2 + 2,
    top: -rowGap - 1.8,
    bottom: rowGap + 1.8,
    presets: [
      preset('vga', 'VGA', {
        1: 'Red', 2: 'Green', 3: 'Blue', 4: 'ID2 / Res', 5: 'GND', 6: 'Red RTN', 7: 'Green RTN',
        8: 'Blue RTN', 9: '+5V', 10: 'GND', 11: 'ID0 / Res', 12: 'SDA', 13: 'HSync', 14: 'VSync',
        15: 'SCL',
      }),
    ],
  })
})()
