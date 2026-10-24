import type { WireColor } from '../schemas'
import type { Preset } from './types'

type Entry = string | { signal?: string; wire?: WireColor }

/** Presets keyed by pin number; a bare string is shorthand for a signal name. */
export function preset(id: string, name: string, pins: Record<number, Entry>): Preset {
  return {
    id,
    name,
    pins: Object.fromEntries(
      Object.entries(pins).map(([k, v]) => [k, typeof v === 'string' ? { signal: v } : v]),
    ),
  }
}
