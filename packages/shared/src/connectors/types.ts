import type { Gender, WireColor } from '../schemas'

export type ConnectorFamily = 'D-sub' | 'USB' | 'Modular' | 'DIN' | 'Header' | 'Automotive' | 'Custom'

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
  /** shell = outer metal/plastic, face = insulator, key = notch/void, marker = pin-1 indicator. */
  role: 'shell' | 'face' | 'key' | 'marker'
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
  /** Shown when creating a map, e.g. a reminder to check pin 1 against the datasheet. */
  note?: string
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

export type ParamValue = number | boolean | string
export type Params = Record<string, ParamValue>

export type ParamDef =
  | { key: string; label: string; kind: 'int'; min: number; max: number; default: number }
  | { key: string; label: string; kind: 'bool'; default: boolean }
  | {
      key: string
      label: string
      kind: 'choice'
      options: { value: string; label: string }[]
      default: string
    }

/**
 * A catalog entry. Fixed connectors have no params; sized ones (headers, the
 * custom builders) build their template from the params stored on the map.
 */
export interface ConnectorDef {
  id: string
  name: string
  aliases: string[]
  family: ConnectorFamily
  description: string
  note?: string
  params: ParamDef[]
  build: (params: Params) => ConnectorTemplate
}
