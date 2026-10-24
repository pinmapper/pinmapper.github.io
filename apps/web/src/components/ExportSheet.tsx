import type { ConnectorTemplate, PinMap } from '@pinmapper/shared'
import { ArrowLeft, Braces, Download, FileText, Image, Loader2, Share2, Sheet as SheetIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { buildExport, type ExportFormat } from '@/export'
import { canShareFile, downloadFile, shareFile } from '@/export/share'

const FORMATS: { id: ExportFormat; label: string; hint: string; icon: typeof Image }[] = [
  { id: 'png', label: 'Image', hint: 'Diagram and pin table as a PNG, good for chat apps', icon: Image },
  { id: 'pdf', label: 'PDF', hint: 'Printable A4 sheet with notes', icon: FileText },
  { id: 'csv', label: 'Spreadsheet', hint: 'CSV for Excel or Google Sheets', icon: SheetIcon },
  { id: 'json', label: 'PinMapper file', hint: 'Re-import on another device', icon: Braces },
]

type State =
  | { step: 'choose' }
  | { step: 'working'; format: ExportFormat }
  | { step: 'ready'; format: ExportFormat; file: File; url: string }
  | { step: 'error'; message: string }

export function ExportSheet({
  open,
  onClose,
  map,
  template,
}: {
  open: boolean
  onClose: () => void
  map: PinMap
  template: ConnectorTemplate
}) {
  const [state, setState] = useState<State>({ step: 'choose' })

  // Free the preview URL when it is replaced or the sheet goes away.
  const previewUrl = state.step === 'ready' ? state.url : null
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const close = () => {
    setState({ step: 'choose' })
    onClose()
  }

  const generate = async (format: ExportFormat) => {
    setState({ step: 'working', format })
    try {
      const file = await buildExport(format, map, template)
      setState({ step: 'ready', format, file, url: URL.createObjectURL(file) })
    } catch (e) {
      console.error(e)
      setState({ step: 'error', message: 'Couldn’t create the file. Please try again.' })
    }
  }

  return (
    <Sheet open={open} onClose={close} title="Export & share">
      {state.step === 'choose' && (
        <ul className="grid gap-2">
          {FORMATS.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => void generate(f.id)}
                className="flex w-full items-center gap-4 rounded-2xl border border-border bg-surface-2 p-3 text-left transition active:scale-[0.99]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <f.icon className="size-5" />
                </span>
                <span>
                  <span className="block font-bold">{f.label}</span>
                  <span className="block text-sm text-muted">{f.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {state.step === 'working' && (
        <div className="grid h-48 place-items-center text-muted" role="status">
          <span className="flex items-center gap-2">
            <Loader2 className="size-5 animate-spin" /> Preparing {FORMATS.find((f) => f.id === state.format)?.label.toLowerCase()}…
          </span>
        </div>
      )}

      {state.step === 'ready' && (
        <div className="space-y-4">
          {state.format === 'png' ? (
            <img
              src={state.url}
              alt="Export preview"
              className="max-h-[45dvh] w-full rounded-xl border border-border bg-white object-contain object-top"
            />
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-4">
              <FileText className="size-8 shrink-0 text-accent" />
              <div className="min-w-0">
                <div className="truncate font-bold">{state.file.name}</div>
                <div className="text-sm text-muted">{formatSize(state.file.size)}</div>
              </div>
            </div>
          )}
          <div className="grid gap-2">
            {canShareFile(state.file) && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => void shareFile(state.file, map.title).catch(() => downloadFile(state.file))}
              >
                <Share2 className="size-5" /> Share
              </Button>
            )}
            <Button size="lg" variant={canShareFile(state.file) ? 'secondary' : 'primary'} onClick={() => downloadFile(state.file)}>
              <Download className="size-5" /> Download
            </Button>
            <Button variant="ghost" onClick={() => setState({ step: 'choose' })}>
              <ArrowLeft className="size-4" /> Other format
            </Button>
          </div>
        </div>
      )}

      {state.step === 'error' && (
        <div className="space-y-4">
          <p className="rounded-xl bg-danger/15 p-3 text-danger">{state.message}</p>
          <Button className="w-full" onClick={() => setState({ step: 'choose' })}>
            Back
          </Button>
        </div>
      )}
    </Sheet>
  )
}

function formatSize(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`
}
