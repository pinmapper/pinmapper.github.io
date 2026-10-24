/** IEC 60757 colour codes, the abbreviations technicians write on wires. */
export const WIRE_COLOR_CODES = [
  'BK',
  'BN',
  'RD',
  'OG',
  'YE',
  'GN',
  'BU',
  'VT',
  'GY',
  'WH',
  'PK',
  'TQ',
] as const

export type WireColorCodeLiteral = (typeof WIRE_COLOR_CODES)[number]

export const WIRE_COLORS: Record<WireColorCodeLiteral, { name: string; hex: string }> = {
  BK: { name: 'Black', hex: '#1c1c1e' },
  BN: { name: 'Brown', hex: '#8b5a2b' },
  RD: { name: 'Red', hex: '#e5383b' },
  OG: { name: 'Orange', hex: '#f77f00' },
  YE: { name: 'Yellow', hex: '#ffd60a' },
  GN: { name: 'Green', hex: '#2a9d48' },
  BU: { name: 'Blue', hex: '#1e6fd9' },
  VT: { name: 'Violet', hex: '#8e44c9' },
  GY: { name: 'Grey', hex: '#8e8e93' },
  WH: { name: 'White', hex: '#f5f5f7' },
  PK: { name: 'Pink', hex: '#ff8fb8' },
  TQ: { name: 'Turquoise', hex: '#1fc8c8' },
}

/** Relative luminance check so pin labels stay readable on any wire colour. */
export function isLightColor(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.299 * r + 0.587 * g + 0.114 * b > 150
}

export function wireLabel(base: WireColorCodeLiteral, stripe?: WireColorCodeLiteral): string {
  return stripe ? `${base}/${stripe}` : base
}
