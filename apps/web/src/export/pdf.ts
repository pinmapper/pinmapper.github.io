import { WIRE_COLORS, wireLabel, type ConnectorTemplate, type PinMap } from '@pinmapper/shared'
import { jsPDF } from 'jspdf'
import { STATUS_TEXT, viewText } from './data'
import { diagramSvg, svgToPng } from './sheet'

const PAGE_W = 210
const PAGE_H = 297
const M = 14
const COL = { pin: M + 2, wire: M + 14, signal: M + 44, status: M + 104, notes: M + 120 }
const NOTES_W = PAGE_W - M - COL.notes - 2

/** jsPDF's built-in fonts are Latin-1 only, so map common symbols and drop the rest. */
function latin(s: string): string {
  return s
    .replace(/[−–—]/g, '-')
    .replace(/×/g, 'x')
    .replace(/…/g, '...')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\xff\n]/g, '?')
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

export async function toPdf(map: PinMap, t: ConnectorTemplate): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const muted = () => doc.setTextColor(93, 101, 120)
  const ink = () => doc.setTextColor(18, 21, 28)

  doc.setFont('helvetica', 'bold').setFontSize(18)
  ink()
  doc.text(latin(map.title || 'Untitled'), M, 20, { maxWidth: PAGE_W - 2 * M - 40 })
  doc.setFont('helvetica', 'normal').setFontSize(10)
  muted()
  doc.text(latin(`${t.name} · ${t.genderLabels[map.gender]} · ${viewText(map)}`), M, 27)
  if (map.equipment) doc.text(latin(map.equipment), M, 32)
  doc.setFont('helvetica', 'bold').setTextColor(217, 134, 10)
  doc.text('PinMapper', PAGE_W - M, 20, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  muted()
  doc.text(new Date(map.updatedAt).toLocaleDateString(), PAGE_W - M, 27, { align: 'right' })

  // Diagram
  let y = map.equipment ? 38 : 34
  const d = diagramSvg(map, t)
  const png = await blobToDataUrl(await svgToPng(d.svg, d.width, d.height, 1))
  const maxW = PAGE_W - 2 * M - 10
  const scale = Math.min(maxW / d.width, 95 / d.height)
  const w = d.width * scale
  const h = d.height * scale
  doc.setFillColor(244, 245, 248).roundedRect(M, y, PAGE_W - 2 * M, h + 12, 3, 3, 'F')
  doc.setFontSize(8).setFont('helvetica', 'bold')
  doc.text(map.view === 'rear' ? 'REAR - WIRE SIDE' : 'FRONT - MATING FACE', PAGE_W / 2, y + 5, { align: 'center' })
  doc.addImage(png, 'PNG', (PAGE_W - w) / 2, y + 8, w, h, undefined, 'FAST')
  y += h + 18

  // Pin table
  const header = () => {
    doc.setFillColor(236, 238, 243).rect(M, y, PAGE_W - 2 * M, 7, 'F')
    doc.setFont('helvetica', 'bold').setFontSize(8)
    muted()
    doc.text('PIN', COL.pin, y + 4.8)
    doc.text('WIRE', COL.wire, y + 4.8)
    doc.text('SIGNAL', COL.signal, y + 4.8)
    doc.text('STATUS', COL.status, y + 4.8)
    doc.text('NOTES', COL.notes, y + 4.8)
    y += 7
  }
  header()
  doc.setFontSize(10)
  t.pins.forEach((p, i) => {
    const a = map.pins[p.id]
    doc.setFont('helvetica', 'normal')
    const notes: string[] = a?.notes ? doc.splitTextToSize(latin(a.notes), NOTES_W) : []
    const signal: string[] = a?.signal ? doc.splitTextToSize(latin(a.signal), COL.status - COL.signal - 3) : []
    const rowH = Math.max(7, Math.max(notes.length, signal.length) * 4.2 + 2.8)
    if (y + rowH > PAGE_H - 14) {
      doc.addPage()
      y = 14
      header()
      doc.setFontSize(10)
    }
    if (i % 2 === 1) doc.setFillColor(248, 249, 251).rect(M, y, PAGE_W - 2 * M, rowH, 'F')
    const base = y + 4.8
    doc.setFont('helvetica', 'bold')
    ink()
    doc.text(latin(p.label), COL.pin, base)
    if (a?.wire) {
      doc.setFillColor(...rgb(WIRE_COLORS[a.wire.base].hex)).setDrawColor(120, 120, 120)
      doc.circle(COL.wire + 2, y + 3.5, 2, 'FD')
      if (a.wire.stripe) doc.setFillColor(...rgb(WIRE_COLORS[a.wire.stripe].hex)).rect(COL.wire, y + 3, 4, 1, 'F')
      doc.setFont('helvetica', 'normal')
      doc.text(wireLabel(a.wire.base, a.wire.stripe), COL.wire + 6, base)
    }
    doc.setFont('helvetica', 'bold')
    if (signal.length) doc.text(signal, COL.signal, base)
    const status = a ? STATUS_TEXT[a.status] : ''
    if (status) {
      const c: [number, number, number] = status === 'OK' ? [31, 157, 92] : status === 'Fault' ? [214, 52, 58] : [108, 116, 138]
      doc.setTextColor(...c).text(status, COL.status, base)
      ink()
    }
    if (notes.length) {
      doc.setFont('helvetica', 'normal').setFontSize(9)
      muted()
      doc.text(notes, COL.notes, base)
      doc.setFontSize(10)
      ink()
    }
    y += rowH
  })

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i).setFontSize(8).setFont('helvetica', 'normal').setTextColor(169, 175, 189)
    doc.text(`PinMapper · pinmapper.github.io · ${i}/${pages}`, PAGE_W / 2, PAGE_H - 7, { align: 'center' })
  }
  return doc.output('blob')
}
