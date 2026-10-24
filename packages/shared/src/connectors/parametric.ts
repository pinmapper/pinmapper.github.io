import { body, circlePath, defineConnector, rectPath, roundedPolygon, type Pt } from './geometry'
import type { ConnectorDef, PinDef } from './types'

const P = 2.54
const PIN = { kind: 'rect', w: 1.4, h: 1.4 } as const
const MALE_FEMALE = { M: 'Male (pins)', F: 'Female (sockets)' }

/** Downward triangle sitting in the shell just above (x, faceTop): marks pin 1. */
function pin1Marker(x: number, faceTop: number): string {
  const tri: Pt[] = [
    [x - 0.6, faceTop - 1.0],
    [x + 0.6, faceTop - 1.0],
    [x, faceTop - 0.2],
  ]
  return roundedPolygon(tri, 0.08)
}

/** Shroud around pins: rounded shell + face, with a pin-1 marker on the top edge. */
function shroud(pins: PinDef[], margin: number, pin1: PinDef) {
  const xs = pins.map((p) => p.x)
  const ys = pins.map((p) => p.y)
  const fx = Math.max(...xs.map(Math.abs)) + margin
  const top = Math.min(...ys) - margin
  const bottom = Math.max(...ys) + margin
  const s = 1.3
  return {
    fx,
    top,
    bottom,
    s,
    body: [
      body('shell', rectPath(-fx - s, top - s, 2 * (fx + s), bottom - top + 2 * s, 0.8)),
      body('face', rectPath(-fx, top, 2 * fx, bottom - top, 0.4)),
      body('marker', pin1Marker(pin1.x, top)),
    ],
    bounds: [-fx - s, top - s, fx + s, bottom + s] as [number, number, number, number],
  }
}

const int = (v: unknown) => v as number

/** 2-row 2.54 mm box header: odd pins on the top row, polarising notch at the bottom. */
export const IDC: ConnectorDef = {
  id: 'idc',
  name: 'IDC header 2×N',
  aliases: ['idc', 'box header', 'ribbon', 'shrouded', '2x5', '2x10', 'jtag', 'isp', 'swd', 'gpio', '2.54'],
  family: 'Header',
  description: '2 rows, 2.54 mm, odd pins on top',
  params: [{ key: 'n', label: 'Pins per row', kind: 'int', min: 2, max: 32, default: 5 }],
  build: (p) => {
    const n = int(p.n)
    const pins: PinDef[] = []
    for (let k = 0; k < n; k++) {
      const x = (k - (n - 1) / 2) * P
      pins.push({ id: `${2 * k + 1}`, label: `${2 * k + 1}`, x, y: -P / 2 })
      pins.push({ id: `${2 * k + 2}`, label: `${2 * k + 2}`, x, y: P / 2 })
    }
    const sh = shroud(pins, 1.6, pins[0])
    const notch = Math.min(4.4, sh.fx)
    return defineConnector({
      id: 'idc',
      name: `IDC 2×${n}`,
      aliases: IDC.aliases,
      family: 'Header',
      description: IDC.description,
      refGender: 'M',
      genderLabels: { M: 'Header (pins)', F: 'IDC socket (ribbon)' },
      pinShape: PIN,
      body: [...sh.body, body('key', rectPath(-notch / 2, sh.bottom - 0.01, notch, sh.s + 0.02))],
      pins,
      presets: [],
      bounds: sh.bounds,
    })
  },
}

const PITCHES = [
  { value: '2.54', label: '2.54 mm (Dupont, KK)' },
  { value: '2.5', label: '2.5 mm (JST XH)' },
  { value: '2.0', label: '2.0 mm (JST PH)' },
  { value: '1.25', label: '1.25 mm (PicoBlade)' },
]

/** Single-row header, pins 1..N left to right. Drawn at one size; pitch is recorded in the name. */
export const HEADER: ConnectorDef = {
  id: 'header',
  name: 'Pin header 1×N',
  aliases: ['header', 'jst', 'xh', 'ph', 'dupont', 'kk', 'picoblade', 'molex', 'single row', 'fan', 'battery', 'uart'],
  family: 'Header',
  description: 'Single row: Dupont, JST XH/PH, Molex KK…',
  params: [
    { key: 'n', label: 'Pins', kind: 'int', min: 2, max: 40, default: 4 },
    { key: 'pitch', label: 'Pitch', kind: 'choice', options: PITCHES, default: '2.54' },
  ],
  build: (p) => {
    const n = int(p.n)
    const pins: PinDef[] = Array.from({ length: n }, (_, i) => ({
      id: `${i + 1}`,
      label: `${i + 1}`,
      x: (i - (n - 1) / 2) * P,
      y: 0,
    }))
    const sh = shroud(pins, 1.4, pins[0])
    return defineConnector({
      id: 'header',
      name: `1×${n} header, ${p.pitch} mm`,
      aliases: HEADER.aliases,
      family: 'Header',
      description: HEADER.description,
      refGender: 'M',
      genderLabels: { M: 'Header (pins)', F: 'Housing (sockets)' },
      pinShape: PIN,
      body: sh.body,
      pins,
      presets: [],
      bounds: sh.bounds,
    })
  },
}

/** Free-form rectangular layout for anything not in the library. */
export const CUSTOM_GRID: ConnectorDef = {
  id: 'grid',
  name: 'Custom grid',
  aliases: ['custom', 'grid', 'matrix', 'rectangular', 'mini-fit', 'microfit', 'molex', 'dip', 'terminal'],
  family: 'Custom',
  description: 'Any rows × columns layout',
  note: 'Pin 1 is top-left as drawn. Pick the numbering that matches your datasheet.',
  params: [
    { key: 'rows', label: 'Rows', kind: 'int', min: 1, max: 16, default: 2 },
    { key: 'cols', label: 'Columns', kind: 'int', min: 1, max: 40, default: 4 },
    {
      key: 'numbering',
      label: 'Numbering',
      kind: 'choice',
      options: [
        { value: 'rows', label: 'Row by row' },
        { value: 'columns', label: 'Column by column' },
        { value: 'snake', label: 'Zig-zag rows' },
      ],
      default: 'rows',
    },
    { key: 'stagger', label: 'Offset alternate rows', kind: 'bool', default: false },
  ],
  build: (p) => {
    const rows = int(p.rows)
    const cols = int(p.cols)
    const stagger = p.stagger === true && rows > 1
    const pins: PinDef[] = []
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const n =
          p.numbering === 'columns'
            ? c * rows + r + 1
            : p.numbering === 'snake'
              ? r * cols + (r % 2 ? cols - 1 - c : c) + 1
              : r * cols + c + 1
        const shift = stagger ? (r % 2 ? P / 4 : -P / 4) : 0
        pins.push({ id: `${n}`, label: `${n}`, x: (c - (cols - 1) / 2) * P + shift, y: (r - (rows - 1) / 2) * P })
      }
    pins.sort((a, b) => +a.id - +b.id)
    const sh = shroud(pins, 1.5, pins[0])
    return defineConnector({
      id: 'grid',
      name: `Grid ${rows}×${cols}`,
      aliases: CUSTOM_GRID.aliases,
      family: 'Custom',
      description: CUSTOM_GRID.description,
      note: CUSTOM_GRID.note,
      refGender: 'M',
      genderLabels: MALE_FEMALE,
      pinShape: { kind: 'circle', r: 0.8 },
      body: sh.body,
      pins,
      presets: [],
      bounds: sh.bounds,
    })
  },
}

const START_ANGLE: Record<string, number> = { top: -90, right: 0, bottom: 90, left: 180 }

/** Pins evenly spaced on a circle: XLR, M8/M12, DIN, GX aviation plugs… */
export const CUSTOM_CIRCULAR: ConnectorDef = {
  id: 'circular',
  name: 'Custom circular',
  aliases: ['custom', 'circular', 'round', 'xlr', 'm8', 'm12', 'din', 'mini din', 'gx16', 'gx12', 'aviation', 'speakon', 'amphenol'],
  family: 'Custom',
  description: 'Pins on a circle, optional centre pin',
  note: 'Set where pin 1 is and which way the numbers run to match your datasheet (XLR, M12, DIN…).',
  params: [
    { key: 'count', label: 'Pins on the circle', kind: 'int', min: 2, max: 24, default: 4 },
    { key: 'center', label: 'Centre pin', kind: 'bool', default: false },
    {
      key: 'start',
      label: 'Pin 1 at',
      kind: 'choice',
      options: [
        { value: 'top', label: 'Top' },
        { value: 'right', label: 'Right' },
        { value: 'bottom', label: 'Bottom' },
        { value: 'left', label: 'Left' },
      ],
      default: 'top',
    },
    {
      key: 'direction',
      label: 'Numbers run',
      kind: 'choice',
      options: [
        { value: 'cw', label: 'Clockwise' },
        { value: 'ccw', label: 'Anticlockwise' },
      ],
      default: 'cw',
    },
  ],
  build: (p) => {
    const count = int(p.count)
    const dir = p.direction === 'ccw' ? -1 : 1
    const start = START_ANGLE[p.start as string] ?? -90
    // Keep neighbours ~2.7 apart on the circle and away from the centre pin.
    const R = Math.max(2.8, 2.7 / (2 * Math.sin(Math.PI / count)))
    const pins: PinDef[] = Array.from({ length: count }, (_, i) => {
      const a = ((start + (dir * i * 360) / count) * Math.PI) / 180
      return { id: `${i + 1}`, label: `${i + 1}`, x: R * Math.cos(a), y: R * Math.sin(a) }
    })
    if (p.center === true) pins.push({ id: `${count + 1}`, label: `${count + 1}`, x: 0, y: 0 })
    const face = R + 1.6
    const shell = face + 1.0
    return defineConnector({
      id: 'circular',
      name: `Circular ${count}${p.center ? '+1' : ''}-pin`,
      aliases: CUSTOM_CIRCULAR.aliases,
      family: 'Custom',
      description: CUSTOM_CIRCULAR.description,
      note: CUSTOM_CIRCULAR.note,
      refGender: 'M',
      genderLabels: MALE_FEMALE,
      pinShape: { kind: 'circle', r: 0.85 },
      body: [
        body('shell', circlePath(0, 0, shell)),
        body('face', circlePath(0, 0, face)),
        body('key', rectPath(-0.9, -shell - 0.01, 1.8, shell - R - 1.0, 0.2)),
      ],
      pins,
      presets: [],
      bounds: [-shell, -shell, shell, shell],
    })
  },
}
