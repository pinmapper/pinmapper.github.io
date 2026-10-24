import { describe, expect, it } from 'vitest'
import { CONNECTORS, getConnector, isMirrored, searchConnectors } from './connectors'
import { pinExtent } from './connectors/geometry'
import { PinMap } from './schemas'

describe.each(CONNECTORS.map((c) => [c.id, c] as const))('%s', (_id, c) => {
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

describe('isMirrored', () => {
  const de9 = getConnector('de9')! // drawn as male mating face
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
    expect(searchConnectors('', 'Modular').map((c) => c.id)).toEqual(['rj45'])
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
