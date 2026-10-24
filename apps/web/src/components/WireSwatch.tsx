import { WIRE_COLORS, type WireColor } from '@pinmapper/shared'
import { cn } from '@/lib/cn'

/** Small round swatch showing a wire colour with its optional stripe. */
export function WireSwatch({ wire, className }: { wire?: WireColor; className?: string }) {
  if (!wire)
    return (
      <span
        className={cn('inline-block size-5 shrink-0 rounded-full border-2 border-dashed border-border', className)}
      />
    )
  const base = WIRE_COLORS[wire.base].hex
  const stripe = wire.stripe ? WIRE_COLORS[wire.stripe].hex : undefined
  return (
    <span
      className={cn('inline-block size-5 shrink-0 rounded-full ring-1 ring-black/30', className)}
      style={{
        background: stripe
          ? `linear-gradient(135deg, ${base} 0 35%, ${stripe} 35% 65%, ${base} 65%)`
          : base,
      }}
    />
  )
}
