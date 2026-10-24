import 'fake-indexeddb/auto'
import { resolveConnector, type PinMap } from '@pinmapper/shared'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, importMaps } from '@/db'
import { fileBase, parseBackup, toBackup, toCsv } from './data'

function map(overrides: Partial<PinMap> = {}): PinMap {
  return {
    id: 'm1',
    title: 'Rack 3 COM',
    templateId: 'de9',
    gender: 'M',
    view: 'mating',
    equipment: '',
    pins: {},
    createdAt: 1,
    updatedAt: 10,
    rev: 1,
    deleted: false,
    ...overrides,
  }
}

describe('toCsv', () => {
  it('writes one row per pin with escaped cells', () => {
    const m = map({
      pins: {
        '2': { signal: 'RXD', wire: { base: 'WH', stripe: 'BU' }, notes: 'goes to "J4", pin 2', status: 'verified' },
      },
    })
    const lines = toCsv(m, resolveConnector('de9')!).replace('﻿', '').trim().split('\r\n')
    expect(lines).toHaveLength(10)
    expect(lines[0]).toBe('Pin,Signal,Wire,Wire colour,Status,Notes')
    expect(lines[2]).toBe('2,RXD,WH/BU,White / Blue stripe,OK,"goes to ""J4"", pin 2"')
    expect(lines[1]).toBe('1,,,,,')
  })
})

describe('fileBase', () => {
  it('slugifies titles', () => {
    expect(fileBase('Rack 3 / PLC-2 COM')).toBe('rack-3-plc-2-com')
    expect(fileBase('★')).toBe('pinmap')
  })
})

describe('parseBackup', () => {
  it('round-trips a backup and skips deleted maps', async () => {
    const text = toBackup([map(), map({ id: 'gone', deleted: true })])
    const { maps, errors } = await parseBackup(text)
    expect(errors).toEqual([])
    expect(maps.map((m) => m.id)).toEqual(['m1'])
  })

  it('accepts a single map and reports bad entries', async () => {
    expect((await parseBackup(JSON.stringify(map()))).maps).toHaveLength(1)
    const r = await parseBackup(JSON.stringify([map(), { title: 'Junk' }, map({ id: 'x', templateId: 'nope' })]))
    expect(r.maps).toHaveLength(1)
    expect(r.errors).toEqual(['“Junk” isn’t a valid pin map.', '“Rack 3 COM” uses an unknown connector (nope).'])
    expect((await parseBackup('{oops')).errors).toEqual(['This file isn’t valid JSON.'])
  })
})

describe('importMaps', () => {
  beforeEach(() => db.maps.clear())

  it('adds new maps, replaces only with newer copies, and restores deleted ones', async () => {
    await db.maps.bulkPut([
      map({ id: 'old', updatedAt: 5 }),
      map({ id: 'new', updatedAt: 50, title: 'local' }),
      map({ id: 'del', deleted: true }),
    ])
    const r = await importMaps([
      map({ id: 'old', updatedAt: 6, title: 'imported' }),
      map({ id: 'new', updatedAt: 40, title: 'imported' }),
      map({ id: 'del' }),
      map({ id: 'fresh' }),
    ])
    expect(r).toEqual({ added: 2, updated: 1, skipped: 1 })
    expect((await db.maps.get('old'))!.title).toBe('imported')
    expect((await db.maps.get('new'))!.title).toBe('local')
    expect((await db.maps.get('del'))!.deleted).toBe(false)
  })
})
