import { isMirrored, WIRE_COLORS, wireLabel, type ConnectorTemplate, type PinMap } from '@pinmapper/shared'
import { renderToStaticMarkup } from 'react-dom/server'
import { ConnectorDiagram, type LabelMode } from '@/components/ConnectorDiagram'
import { STATUS_TEXT, viewText } from './data'

/** Light, print-friendly palette; the app's CSS isn't available inside an exported image. */
const STYLE = `
  svg { --shell:#a9afbd; --face:#dfe2e9; --key:#ffffff; --pin-empty:#ffffff; --pin-stroke:#6c748a;
        --pin-label:#12151c; --pin-signal:#d4e1fb; --accent:#d9860a; --success:#1f9d5c; --danger:#d6343a; }
  .pm-shell{fill:var(--shell)} .pm-face{fill:var(--face)} .pm-key{fill:var(--key)} .pm-marker{fill:var(--accent)}
  .pm-pin{fill:var(--pin-empty);stroke:var(--pin-stroke)} .pm-pin-signal{fill:var(--pin-signal);stroke:var(--accent)}
  .pm-pin-label{fill:var(--pin-label);font-weight:650}
  text{font-family:Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
`

const W = 1000
const PAD = 40
const ROW = 40
const DIAGRAM_MAX_H = 460

const STATUS_COLOR: Record<string, string> = { OK: '#1f9d5c', Fault: '#d6343a', NC: '#6c748a' }

function clip(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

/** Diagram only, as a standalone SVG string (used inside the PDF). */
export function diagramSvg(map: PinMap, t: ConnectorTemplate, labelMode: LabelMode = 'number') {
  const [, , vw, vh] = t.viewBox
  const width = 1200
  const height = Math.round((width * vh) / vw)
  const inner = renderToStaticMarkup(
    <ConnectorDiagram template={t} mirrored={isMirrored(t, map.gender, map.view)} pins={map.pins} labelMode={labelMode} />,
  )
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><style>${STYLE}</style>${inner.replace('<svg ', `<svg width="${width}" height="${height}" `)}</svg>`
  return { svg, width, height }
}

/** Full export sheet: header, diagram, pin table. */
export function sheetSvg(map: PinMap, t: ConnectorTemplate) {
  const [, , vw, vh] = t.viewBox
  const diagramW = W - 2 * PAD
  const diagramH = Math.min(DIAGRAM_MAX_H, (diagramW * vh) / vw)
  const headerH = map.equipment ? 150 : 124
  const tableTop = headerH + diagramH + 48
  const height = tableTop + ROW * (t.pins.length + 1) + 70
  const cols = { pin: PAD + 16, wire: PAD + 90, signal: PAD + 230, status: PAD + 520, notes: PAD + 600 }

  const markup = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={height} viewBox={`0 0 ${W} ${height}`}>
      <style>{STYLE}</style>
      <rect width={W} height={height} fill="#ffffff" />

      <text x={PAD} y={PAD + 28} fontSize={30} fontWeight={800} fill="#12151c">
        {clip(map.title || 'Untitled', 48)}
      </text>
      <text x={PAD} y={PAD + 62} fontSize={18} fill="#5d6578">
        {t.name} · {t.genderLabels[map.gender]} · {viewText(map)}
      </text>
      {map.equipment && (
        <text x={PAD} y={PAD + 90} fontSize={18} fill="#5d6578">
          {clip(map.equipment, 80)}
        </text>
      )}
      <text x={W - PAD} y={PAD + 28} fontSize={16} fontWeight={700} fill="#d9860a" textAnchor="end">
        PinMapper
      </text>
      <text x={W - PAD} y={PAD + 62} fontSize={14} fill="#5d6578" textAnchor="end">
        {new Date(map.updatedAt).toLocaleString()}
      </text>

      <rect x={PAD} y={headerH} width={diagramW} height={diagramH + 24} rx={16} fill="#f4f5f8" />
      <text x={W / 2} y={headerH + 22} fontSize={13} fontWeight={700} fill="#5d6578" textAnchor="middle" letterSpacing={1}>
        {map.view === 'rear' ? 'REAR · WIRE SIDE' : 'FRONT · MATING FACE'}
      </text>
      {/* No viewBox here: the diagram's own svg must fill this viewport in pixels. */}
      <svg x={PAD} y={headerH + 24} width={diagramW} height={diagramH}>
        <ConnectorDiagram template={t} mirrored={isMirrored(t, map.gender, map.view)} pins={map.pins} />
      </svg>

      <g fontSize={13} fontWeight={700} fill="#5d6578">
        <rect x={PAD} y={tableTop} width={diagramW} height={ROW} fill="#eceef3" rx={8} />
        <text x={cols.pin} y={tableTop + 26}>PIN</text>
        <text x={cols.wire} y={tableTop + 26}>WIRE</text>
        <text x={cols.signal} y={tableTop + 26}>SIGNAL</text>
        <text x={cols.status} y={tableTop + 26}>STATUS</text>
        <text x={cols.notes} y={tableTop + 26}>NOTES</text>
      </g>
      {t.pins.map((p, i) => {
        const a = map.pins[p.id]
        const y = tableTop + ROW * (i + 1)
        const status = a ? STATUS_TEXT[a.status] : ''
        return (
          <g key={p.id} fontSize={17}>
            {i % 2 === 1 && <rect x={PAD} y={y} width={diagramW} height={ROW} fill="#f8f9fb" />}
            <text x={cols.pin} y={y + 26} fontWeight={700} fill="#12151c">
              {p.label}
            </text>
            {a?.wire && (
              <>
                <circle cx={cols.wire + 10} cy={y + 20} r={10} fill={WIRE_COLORS[a.wire.base].hex} stroke="#00000055" />
                {a.wire.stripe && (
                  <rect x={cols.wire} y={y + 17} width={20} height={6} fill={WIRE_COLORS[a.wire.stripe].hex} />
                )}
                <text x={cols.wire + 28} y={y + 26} fill="#12151c">
                  {wireLabel(a.wire.base, a.wire.stripe)}
                </text>
              </>
            )}
            <text x={cols.signal} y={y + 26} fontWeight={600} fill={a?.signal ? '#12151c' : '#a9afbd'}>
              {a?.signal ? clip(a.signal, 26) : '—'}
            </text>
            <text x={cols.status} y={y + 26} fontWeight={700} fill={STATUS_COLOR[status] ?? '#6c748a'}>
              {status}
            </text>
            <text x={cols.notes} y={y + 26} fill="#5d6578" fontSize={15}>
              {clip(a?.notes.replace(/\s+/g, ' ') ?? '', 34)}
            </text>
          </g>
        )
      })}
      <text x={W / 2} y={height - 28} fontSize={13} fill="#a9afbd" textAnchor="middle">
        Made with PinMapper · pinmapper.github.io
      </text>
    </svg>,
  )
  return { svg: markup, width: W, height }
}

/**
 * Rasterise an SVG string. Scale is capped so the canvas stays inside mobile
 * Safari's limits (about 16.7 MP and 16k px per side).
 */
export async function svgToPng(svg: string, width: number, height: number, scale = 2): Promise<Blob> {
  const s = Math.min(scale, Math.sqrt(16_000_000 / (width * height)), 16_000 / height)
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * s)
    canvas.height = Math.round(height * s)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create image'))), 'image/png'),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}
