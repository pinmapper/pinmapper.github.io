import type { BodyShape, ConnectorTemplate, PinDef, PinShape } from './types'

export type Pt = [number, number]

const f = (n: number) => +n.toFixed(3)

/** Closed polygon path with rounded corners (quadratic curves). */
export function roundedPolygon(points: Pt[], radius: number): string {
  const n = points.length
  let d = ''
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n]
    const cur = points[i]
    const next = points[(i + 1) % n]
    const a = towards(cur, prev, radius)
    const b = towards(cur, next, radius)
    d += `${i === 0 ? 'M' : 'L'}${f(a[0])},${f(a[1])} Q${f(cur[0])},${f(cur[1])} ${f(b[0])},${f(b[1])} `
  }
  return d + 'Z'
}

function towards(from: Pt, to: Pt, dist: number): Pt {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const len = Math.hypot(dx, dy)
  const t = Math.min(dist, len / 2) / len
  return [from[0] + dx * t, from[1] + dy * t]
}

export function circlePath(cx: number, cy: number, r: number): string {
  return `M${f(cx - r)},${f(cy)} a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0 a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0 Z`
}

export function rectPath(x: number, y: number, w: number, h: number, r = 0): string {
  return roundedPolygon(
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    r,
  )
}

/** Isosceles trapezoid centred on x=0, wider at the top (D-sub / OBD style). */
export function trapezoid(topHalf: number, bottomHalf: number, top: number, bottom: number): Pt[] {
  return [
    [-topHalf, top],
    [topHalf, top],
    [bottomHalf, bottom],
    [-bottomHalf, bottom],
  ]
}

export function pinExtent(shape: PinShape): { hw: number; hh: number } {
  return shape.kind === 'circle'
    ? { hw: shape.r, hh: shape.r }
    : { hw: shape.w / 2, hh: shape.h / 2 }
}

/**
 * Tap radius: up to 1.8x the drawn pin, capped at half the closest pin-to-pin
 * distance so neighbouring tap areas never overlap.
 */
export function computeHitRadius(pins: PinDef[], shape: PinShape): number {
  let min = Infinity
  for (let i = 0; i < pins.length; i++)
    for (let j = i + 1; j < pins.length; j++)
      min = Math.min(min, Math.hypot(pins[i].x - pins[j].x, pins[i].y - pins[j].y))
  // Rect contacts sit side by side, so only their width limits the tap area.
  const drawn = shape.kind === 'circle' ? shape.r : shape.w / 2
  return Math.floor(Math.max(drawn, Math.min(min / 2, drawn * 1.8)) * 1000) / 1000
}

type Draft = Omit<ConnectorTemplate, 'hitRadius' | 'viewBox'> & {
  /** Outer bounds of the body: [minX, minY, maxX, maxY]. */
  bounds: [number, number, number, number]
}

export function defineConnector({ bounds, ...t }: Draft): ConnectorTemplate {
  const [minX, minY, maxX, maxY] = bounds
  // Symmetric horizontal padding so mirroring (x -> -x) keeps everything in view.
  const half = Math.max(Math.abs(minX), Math.abs(maxX))
  const pad = Math.max(maxX - minX, maxY - minY) * 0.08
  return {
    ...t,
    hitRadius: computeHitRadius(t.pins, t.pinShape),
    viewBox: [f(-half - pad), f(minY - pad), f(2 * (half + pad)), f(maxY - minY + 2 * pad)],
  }
}

export function body(role: BodyShape['role'], d: string): BodyShape {
  return { role, d }
}
