import type { ConnectorTemplate, PinMap } from '@pinmapper/shared'
import { fileBase, toBackup, toCsv } from './data'

export type ExportFormat = 'png' | 'pdf' | 'csv' | 'json'

/** Builds the export file. Image/PDF code is loaded only when first used. */
export async function buildExport(format: ExportFormat, map: PinMap, t: ConnectorTemplate): Promise<File> {
  const base = fileBase(map.title)
  switch (format) {
    case 'png': {
      const { sheetSvg, svgToPng } = await import('./sheet')
      const s = sheetSvg(map, t)
      return new File([await svgToPng(s.svg, s.width, s.height)], `${base}.png`, { type: 'image/png' })
    }
    case 'pdf': {
      const { toPdf } = await import('./pdf')
      return new File([await toPdf(map, t)], `${base}.pdf`, { type: 'application/pdf' })
    }
    case 'csv':
      return new File([toCsv(map, t)], `${base}.csv`, { type: 'text/csv' })
    case 'json':
      return new File([toBackup([map])], `${base}.pinmap.json`, { type: 'application/json' })
  }
}
