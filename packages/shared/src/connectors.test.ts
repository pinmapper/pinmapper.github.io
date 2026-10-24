import { describe, expect, it } from 'vitest'
import {
  CATALOG,
  getConnectorDef,
  isMirrored,
  normalizeParams,
  resolveConnector,
  searchConnectors,
  type ConnectorDef,
  type Params,
} from './connectors'
import { pinExtent } from './connectors/geometry'
import { PinMap } from './schemas'

/** Defaults, plus each param pushed to every extreme/option one at a time. */
function variants(def: ConnectorDef): Params[] {
  const base = normalizeParams(def)
  const out: Params[] = [base]
  for (const p of def.params) {
    const values =
      p.kind === 'int' ? [p.min, p.max] : p.kind === 'bool' ? [!p.default] : p.options.map((o) => o.value)
    for (const v of values) out.push({ ...base, [p.key]: v })
  }
  return out
}

const CASES = CATALOG.flatMap((def) =>
  variants(def).map((params) => [`${def.id} ${JSON.stringify(params)}`, def.build(params)] as const),
)

describe.each(CASES)('%s', (_name, c) => {
  it('has unique pin ids and labels', () => {
    expect(new Set(c.pins.map((p) => p.id)).size).toBe(c.pins.length)
    expect(new Set(c.pins.map((p) => p.label)).size).toBe(c.pins.length)
  })

  it('keeps every pin inside the viewBox, mirrored or not', () => {
    const [x, y, w, h] = c.viewBox
    const { hw, hh } = pinExtent(c.pinShape)
    for (const p of c.pins)
      for (const px of [p.x, -p.x]) {
        expect(px - hw).toBeGreaterThanOrEqual(x)
        expect(px + hw).toBeLessThanOrEqual(x + w)
        expect(p.y - hh).toBeGreaterThanOrEqual(y)
        expect(p.y + hh).toBeLessThanOrEqual(y + h)
      }
  })

  it('has tap areas that do not overlap', () => {
    for (const a of c.pins)
      for (const b of c.pins)
        if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(2 * c.hitRadius - 1e-6)
  })

  it('only references real pins in presets', () => {
    const ids = new Set(c.pins.map((p) => p.id))
    for (const preset of c.presets) for (const k of Object.keys(preset.pins)) expect(ids).toContain(k)
  })
})

describe('parametric connectors', () => {
  const pin = (id: string, params: Params, n: string) => resolveConnector(id, params)!.pins.find((p) => p.id === n)!

  it('numbers IDC headers odd on top, even below', () => {
    const t = resolveConnector('idc', { n: 3 })!
    expect(t.name).toBe('IDC 2×3')
    expect(pin('idc', { n: 3 }, '1').y).toBeLessThan(pin('idc', { n: 3 }, '2').y)
    expect(pin('idc', { n: 3 }, '1').x).toBe(pin('idc', { n: 3 }, '2').x)
    expect(pin('idc', { n: 3 }, '3').x).toBeGreaterThan(pin('idc', { n: 3 }, '1').x)
  })

  it('supports grid numbering schemes', () => {
    const rows = { rows: 2, cols: 3, numbering: 'rows' }
    const cols = { rows: 2, cols: 3, numbering: 'columns' }
    const snake = { rows: 2, cols: 3, numbering: 'snake' }
    expect(pin('grid', rows, '4').x).toBe(pin('grid', rows, '1').x) // 4 starts row 2
    expect(pin('grid', cols, '2').x).toBe(pin('grid', cols, '1').x) // 2 is under 1
    expect(pin('grid', snake, '4').x).toBe(pin('grid', snake, '3').x) // row 2 runs back
  })

  it('places circular pin 1 and runs the chosen direction', () => {
    const cw = { count: 4, start: 'top', direction: 'cw' }
    const ccw = { count: 4, start: 'top', direction: 'ccw' }
    expect(pin('circular', cw, '1').y).toBeLessThan(0)
    expect(pin('circular', cw, '2').x).toBeGreaterThan(0.1) // clockwise: top then right
    expect(pin('circular', ccw, '2').x).toBeLessThan(-0.1)
    expect(resolveConnector('circular', { count: 5, center: true })!.pins).toHaveLength(6)
  })

  it('normalises bad or missing params', () => {
    const def = getConnectorDef('idc')!
    expect(normalizeParams(def, { n: 999, junk: 1 })).toEqual({ n: 32 })
    expect(normalizeParams(def, { n: 'x' })).toEqual({ n: 5 })
    expect(resolveConnector('idc', { n: 4 })).toBe(resolveConnector('idc', { n: 4 })) // memoised
    expect(resolveConnector('nope')).toBeUndefined()
  })
})

describe('isMirrored', () => {
  const de9 = resolveConnector('de9')! // drawn as male mating face
  it('flips once per difference from the reference', () => {
    expect(isMirrored(de9, 'M', 'mating')).toBe(false)
    expect(isMirrored(de9, 'F', 'mating')).toBe(true)
    expect(isMirrored(de9, 'M', 'rear')).toBe(true)
    expect(isMirrored(de9, 'F', 'rear')).toBe(false)
  })
})

describe('searchConnectors', () => {
  it('matches aliases loosely', () => {
    expect(searchConnectors('vga').map((c) => c.id)).toContain('de15')
    expect(searchConnectors('PS 2').map((c) => c.id)).toContain('minidin6')
    expect(searchConnectors('obd ii').map((c) => c.id)).toContain('obd2')
    expect(searchConnectors('', 'Modular').map((c) => c.id)).toEqual(['rj45', 'rj11', 'rj12'])
    expect(searchConnectors('xlr').map((c) => c.id)).toEqual(['circular'])
    expect(searchConnectors('jst').map((c) => c.id)).toContain('header')
  })
})

describe('PinMap schema', () => {
  it('fills defaults for pin annotations', () => {
    const m = PinMap.parse({
      id: 'a', title: 't', templateId: 'de9', gender: 'M', view: 'mating',
      pins: { '1': {} }, createdAt: 0, updatedAt: 0, rev: 0,
    })
    expect(m.pins['1']).toEqual({ signal: '', notes: '', status: 'unknown' })
    expect(m.deleted).toBe(false)
  })
})
