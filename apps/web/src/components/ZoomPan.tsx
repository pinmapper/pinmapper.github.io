import { useGesture } from '@use-gesture/react'
import { Maximize2, Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

const MIN = 1
const MAX = 8

interface Transform {
  x: number
  y: number
  s: number
}

const IDENTITY: Transform = { x: 0, y: 0, s: 1 }

/**
 * Pinch to zoom, drag to pan, tap to hit-test `[data-pin-id]` elements.
 * Taps are detected here (not via onClick) so a pan that ends on a pin never selects it.
 */
export function ZoomPan({
  children,
  onTapPin,
  showControls = true,
}: {
  children: React.ReactNode
  onTapPin: (id: string) => void
  showControls?: boolean
}) {
  const container = useRef<HTMLDivElement>(null)
  const [t, setTState] = useState<Transform>(IDENTITY)
  // Gesture events can arrive faster than renders, so keep the live value in a ref.
  const tRef = useRef(t)
  const setT = (next: Transform) => {
    tRef.current = next
    setTState(next)
  }

  // Stop iOS Safari's own page zoom from fighting the pinch handler.
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault()
    document.addEventListener('gesturestart', prevent)
    document.addEventListener('gesturechange', prevent)
    return () => {
      document.removeEventListener('gesturestart', prevent)
      document.removeEventListener('gesturechange', prevent)
    }
  }, [])

  const clamp = (n: Transform): Transform => {
    const el = container.current
    if (!el || n.s <= 1) return { ...n, x: 0, y: 0, s: Math.max(MIN, n.s) }
    // Keep at least half of the zoomed content on screen.
    const lx = (el.clientWidth * n.s) / 2
    const ly = (el.clientHeight * n.s) / 2
    return {
      s: Math.min(MAX, n.s),
      x: Math.max(-lx, Math.min(lx, n.x)),
      y: Math.max(-ly, Math.min(ly, n.y)),
    }
  }

  /** Zoom to `s` keeping the screen point (ox, oy) fixed. */
  const zoomAt = (s: number, ox: number, oy: number) => {
    const el = container.current
    if (!el) return
    const from = tRef.current
    const r = el.getBoundingClientRect()
    const cx = ox - (r.left + r.width / 2)
    const cy = oy - (r.top + r.height / 2)
    const ns = Math.max(MIN, Math.min(MAX, s))
    const k = ns / from.s
    setT(clamp({ s: ns, x: cx - (cx - from.x) * k, y: cy - (cy - from.y) * k }))
  }

  useGesture(
    {
      onDrag: ({ tap, event, delta: [dx, dy], pinching, cancel }) => {
        if (tap) {
          const id = (event.target as Element).closest?.('[data-pin-id]')?.getAttribute('data-pin-id')
          if (id) onTapPin(id)
          return
        }
        if (pinching) return cancel()
        const p = tRef.current
        setT(clamp({ ...p, x: p.x + dx, y: p.y + dy }))
      },
      onPinch: ({ origin: [ox, oy], offset: [s] }) => zoomAt(s, ox, oy),
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault()
        zoomAt(tRef.current.s * Math.exp(-dy * 0.002), event.clientX, event.clientY)
      },
    },
    {
      target: container,
      eventOptions: { passive: false },
      drag: { filterTaps: true, tapsThreshold: 8 },
      pinch: { scaleBounds: { min: MIN, max: MAX }, from: () => [tRef.current.s, 0] },
    },
  )

  const zoomCenter = (factor: number) => {
    const r = container.current?.getBoundingClientRect()
    if (r) zoomAt(tRef.current.s * factor, r.left + r.width / 2, r.top + r.height / 2)
  }

  // The zoom buttons sit outside the gesture container: its pointer capture would eat their clicks.
  return (
    <div className="relative h-full w-full">
      <div ref={container} className="h-full w-full touch-none overflow-hidden select-none">
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})` }}
        >
          {children}
        </div>
      </div>
      <div className={cn('absolute right-3 bottom-3 flex flex-col gap-2', !showControls && 'hidden')}>
        <ZoomButton label="Zoom in" onClick={() => zoomCenter(1.5)}>
          <Plus className="size-5" />
        </ZoomButton>
        <ZoomButton label="Zoom out" onClick={() => zoomCenter(1 / 1.5)} disabled={t.s <= MIN}>
          <Minus className="size-5" />
        </ZoomButton>
        {t.s > 1 && (
          <ZoomButton label="Fit to screen" onClick={() => setT(IDENTITY)}>
            <Maximize2 className="size-4.5" />
          </ZoomButton>
        )}
      </div>
    </div>
  )
}

function ZoomButton({
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid size-11 place-items-center rounded-full border border-border bg-surface/90 text-text shadow-md backdrop-blur transition active:scale-95 disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  )
}
