import type { Gender, WireColor } from '../schemas'

export type ConnectorFamily = 'D-sub' | 'DIN' | 'Modular' | 'Automotive'

export interface PinDef {
  /** Stable id used as the key in PinMap.pins. */
  id: string
  /** Printed pin number. */
  label: string
  x: number
  y: number
}

export type PinShape = { kind: 'circle'; r: number } | { kind: 'rect'; w: number; h: number }

export interface BodyShape {
  /** SVG path in template units (roughly mm). */
  d: string
  /** shell = outer metal/plastic, face = insulator, key = notch/void. */
  role: 'shell' | 'face' | 'key'
}

export interface Preset {
  id: string
  name: string
  pins: Record<string, { signal?: string; wire?: WireColor }>
}

export interface ConnectorTemplate {
  id: string
  name: string
  /** Search terms: "vga", "ps2", "serial"... */
  aliases: string[]
  family: ConnectorFamily
  description: string
  /** The gender whose mating face the geometry below depicts. */
  refGender: Gender
  genderLabels: Record<Gender, string>
  pinShape: PinShape
  /** Tap radius around each pin; at least the drawn size, never overlapping a neighbour. */
  hitRadius: number
  viewBox: [number, number, number, number]
  body: BodyShape[]
  pins: PinDef[]
  presets: Preset[]
}
