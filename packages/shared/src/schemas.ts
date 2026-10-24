import { z } from 'zod'
import { WIRE_COLOR_CODES } from './wireColors'

export const Gender = z.enum(['M', 'F'])
export type Gender = z.infer<typeof Gender>

/** `mating` = looking into the connector face; `rear` = wire/solder side. */
export const View = z.enum(['mating', 'rear'])
export type View = z.infer<typeof View>

export const PinStatus = z.enum(['unknown', 'verified', 'nc', 'fault'])
export type PinStatus = z.infer<typeof PinStatus>

export const WireColorCode = z.enum(WIRE_COLOR_CODES)
export type WireColorCode = z.infer<typeof WireColorCode>

export const WireColor = z.object({
  base: WireColorCode,
  stripe: WireColorCode.optional(),
})
export type WireColor = z.infer<typeof WireColor>

export const PinAnnotation = z.object({
  signal: z.string().max(64).default(''),
  wire: WireColor.optional(),
  notes: z.string().max(2000).default(''),
  status: PinStatus.default('unknown'),
})
export type PinAnnotation = z.infer<typeof PinAnnotation>

export const PinMap = z.object({
  id: z.string().min(1),
  title: z.string().max(120),
  templateId: z.string().min(1),
  gender: Gender,
  view: View,
  equipment: z.string().max(200).default(''),
  /** Size/layout for parametric connectors (headers, custom builders). */
  params: z.record(z.string(), z.union([z.number(), z.boolean(), z.string()])).optional(),
  pins: z.record(z.string(), PinAnnotation),
  createdAt: z.number(),
  updatedAt: z.number(),
  rev: z.number().int().nonnegative(),
  deleted: z.boolean().default(false),
})
export type PinMap = z.infer<typeof PinMap>
