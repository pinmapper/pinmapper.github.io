import type { PinAnnotation } from '@pinmapper/shared'

/** Sample annotations for the empty-state illustration. */
export const DEMO_PINS: Record<string, PinAnnotation> = {
  '2': { signal: 'RXD', wire: { base: 'RD' }, notes: '', status: 'verified' },
  '3': { signal: 'TXD', wire: { base: 'WH', stripe: 'BU' }, notes: '', status: 'unknown' },
  '5': { signal: 'GND', wire: { base: 'BK' }, notes: '', status: 'verified' },
  '7': { signal: 'RTS', wire: { base: 'YE' }, notes: '', status: 'unknown' },
  '8': { signal: 'CTS', wire: { base: 'GN', stripe: 'WH' }, notes: '', status: 'fault' },
}
