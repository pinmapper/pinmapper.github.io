import {
  isLightColor,
  WIRE_COLORS,
  type ConnectorTemplate,
  type PinAnnotation,
  type PinDef,
} from '@pinmapper/shared'
import { useId } from 'react'

export type LabelMode = 'number' | 'signal'

interface Props {
  template: ConnectorTemplate
  mirrored: boolean
  pins?: Record<string, PinAnnotation>
  selectedId?: string | null
  labelMode?: LabelMode
  /** Render focusable tap targets; thumbnails leave this off. */
  interactive?: boolean
  onPinActivate?: (id: string) => void
  className?: string
}

export function ConnectorDiagram({
  template: t,
  mirrored,
  pins = {},
  selectedId,
  labelMode = 'number',
  interactive = false,
  onPinActivate,
  className,
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const shape = t.pinShape
  const size = shape.kind === 'circle' ? shape.r : Math.min(shape.w, shape.h) / 2
  const sw = size * 0.14

  return (
    <svg
      viewBox={t.viewBox.join(' ')}
      className={className}
      role={interactive ? 'group' : 'img'}
      aria-label={`${t.name} pin diagram${mirrored ? ' (mirrored)' : ''}`}
    >
      <g transform={mirrored ? 'scale(-1,1)' : undefined}>
        {t.body.map((b, i) => (
          <path key={i} d={b.d} className={`pm-${b.role}`} />
        ))}
      </g>
      {t.pins.map((p) => {
        const x = mirrored ? -p.x : p.x
        const a = pins[p.id]
        const clipId = `${uid}-c${p.id}`
        const outline = pinOutline(t, x, p.y)
        const base = a?.wire ? WIRE_COLORS[a.wire.base].hex : undefined
        const stripe = a?.wire?.stripe ? WIRE_COLORS[a.wire.stripe].hex : undefined
        const nc = a?.status === 'nc'
        const text = labelMode === 'signal' && a?.signal ? a.signal : p.label
        const textColor = base ? (isLightColor(base) ? '#111318' : '#ffffff') : undefined
        return (
          <g key={p.id} opacity={nc ? 0.45 : 1}>
            <clipPath id={clipId}>{outline}</clipPath>
            {cloneShape(outline, {
              className: base ? undefined : a?.signal ? 'pm-pin-signal' : 'pm-pin',
              fill: base,
              stroke: base ? 'rgb(0 0 0 / 0.45)' : undefined,
              strokeWidth: sw,
              strokeDasharray: nc ? `${size * 0.3} ${size * 0.2}` : undefined,
            })}
            {stripe && (
              <rect
                x={x - size * 2}
                y={p.y - size * 0.32}
                width={size * 4}
                height={size * 0.64}
                fill={stripe}
                clipPath={`url(#${clipId})`}
                transform={`rotate(-35 ${x} ${p.y})`}
              />
            )}
            <text
              x={x}
              y={p.y}
              className="pm-pin-label"
              fill={textColor}
              stroke={base ? (isLightColor(base) ? '#ffffff' : '#000000') : undefined}
              strokeOpacity={0.35}
              strokeWidth={stripe ? size * 0.12 : 0}
              paintOrder="stroke"
              fontSize={labelFontSize(t, text)}
              textAnchor="middle"
              dominantBaseline="central"
              pointerEvents="none"
            >
              {text}
            </text>
            <StatusBadge annotation={a} x={x} y={p.y} t={t} />
            {selectedId === p.id && selectionRing(t, x, p.y, sw)}
            {interactive && (
              <HitTarget pin={p} x={x} t={t} annotation={a} onActivate={onPinActivate} />
            )}
          </g>
        )
      })}
    </svg>
  )
}

function pinOutline(t: ConnectorTemplate, x: number, y: number) {
  const s = t.pinShape
  return s.kind === 'circle' ? (
    <circle cx={x} cy={y} r={s.r} />
  ) : (
    <rect x={x - s.w / 2} y={y - s.h / 2} width={s.w} height={s.h} rx={s.w * 0.2} />
  )
}

function cloneShape(el: React.ReactElement, props: React.SVGProps<SVGElement>) {
  const Tag = el.type as 'circle' | 'rect'
  return <Tag {...(el.props as object)} {...(props as object)} />
}

function selectionRing(t: ConnectorTemplate, x: number, y: number, sw: number) {
  const s = t.pinShape
  const gap = sw * 2.6
  return s.kind === 'circle' ? (
    <circle cx={x} cy={y} r={s.r + gap} className="pm-selected" strokeWidth={sw * 2.2} />
  ) : (
    <rect
      x={x - s.w / 2 - gap}
      y={y - s.h / 2 - gap}
      width={s.w + gap * 2}
      height={s.h + gap * 2}
      rx={s.w * 0.3}
      className="pm-selected"
      strokeWidth={sw * 2.2}
    />
  )
}

/** Shrink long signal names so they still fit inside the pin. */
function labelFontSize(t: ConnectorTemplate, text: string) {
  const s = t.pinShape
  const room = s.kind === 'circle' ? s.r * 1.75 : s.w * 0.95
  const max = s.kind === 'circle' ? s.r * 1.05 : s.w * 0.8
  return Math.min(max, room / (0.62 * Math.max(1, text.length)))
}

function StatusBadge({
  annotation,
  x,
  y,
  t,
}: {
  annotation?: PinAnnotation
  x: number
  y: number
  t: ConnectorTemplate
}) {
  const status = annotation?.status
  if (status !== 'verified' && status !== 'fault') return null
  const s = t.pinShape
  const r = (s.kind === 'circle' ? s.r : s.w / 2) * 0.42
  const cx = x + (s.kind === 'circle' ? s.r * 0.78 : s.w / 2)
  const cy = y - (s.kind === 'circle' ? s.r * 0.78 : s.h / 2)
  return (
    <g pointerEvents="none">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={status === 'verified' ? 'var(--success)' : 'var(--danger)'}
        stroke="var(--face)"
        strokeWidth={r * 0.25}
      />
      {status === 'verified' ? (
        <path
          d={`M${cx - r * 0.45},${cy} l${r * 0.32},${r * 0.35} l${r * 0.6},${-r * 0.7}`}
          fill="none"
          stroke="#fff"
          strokeWidth={r * 0.28}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <text
          x={cx}
          y={cy}
          fill="#fff"
          fontSize={r * 1.5}
          fontWeight={800}
          textAnchor="middle"
          dominantBaseline="central"
        >
          !
        </text>
      )}
    </g>
  )
}

function HitTarget({
  pin,
  x,
  t,
  annotation,
  onActivate,
}: {
  pin: PinDef
  x: number
  t: ConnectorTemplate
  annotation?: PinAnnotation
  onActivate?: (id: string) => void
}) {
  const s = t.pinShape
  const h = t.hitRadius
  const label = `Pin ${pin.label}${annotation?.signal ? `, ${annotation.signal}` : ''}`
  const common = {
    'data-pin-id': pin.id,
    className: 'pm-hit',
    tabIndex: 0,
    role: 'button',
    'aria-label': label,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onActivate?.(pin.id)
      }
    },
  }
  return s.kind === 'circle' ? (
    <circle cx={x} cy={pin.y} r={h} {...common} />
  ) : (
    <rect x={x - h} y={pin.y - s.h / 2 - h / 2} width={h * 2} height={s.h + h} rx={h * 0.4} {...common} />
  )
}
