import { CheckCircle2, Download, Share2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { db, importMaps } from '@/db'
import { parseBackup, toBackup } from '@/export/data'
import { canShareFile, downloadFile, shareFile } from '@/export/share'

type Result = { ok: boolean; lines: string[] }

/** Whole-library backup to a JSON file, and restore from one (or from a single exported map). */
export function BackupSheet({ open, onClose, count }: { open: boolean; onClose: () => void; count: number }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [backup, setBackup] = useState<File | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)

  const close = () => {
    setBackup(null)
    setResult(null)
    onClose()
  }

  const prepareBackup = async () => {
    const maps = await db.maps.toArray()
    const date = new Date().toISOString().slice(0, 10)
    setBackup(new File([toBackup(maps)], `pinmapper-backup-${date}.json`, { type: 'application/json' }))
  }

  const restore = async (file: File) => {
    setBusy(true)
    setResult(null)
    try {
      const { maps, errors } = await parseBackup(await file.text())
      const r = await importMaps(maps)
      const lines = [
        r.added && `${r.added} map${r.added > 1 ? 's' : ''} added`,
        r.updated && `${r.updated} updated`,
        r.skipped && `${r.skipped} already up to date`,
        ...errors,
      ].filter((l): l is string => !!l)
      setResult({ ok: maps.length > 0, lines: lines.length ? lines : ['Nothing to import in this file.'] })
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <Sheet open={open} onClose={close} title="Backup & restore">
      <div className="space-y-5">
        <section>
          <p className="mb-3 text-sm text-muted">
            Maps live only on this device. Save a backup file to keep them safe or move them to another phone.
          </p>
          {!backup ? (
            <Button className="w-full" size="lg" disabled={count === 0} onClick={() => void prepareBackup()}>
              <Download className="size-5" /> Back up {count} map{count === 1 ? '' : 's'}
            </Button>
          ) : (
            <div className="grid gap-2">
              {canShareFile(backup) && (
                <Button variant="primary" size="lg" onClick={() => void shareFile(backup, backup.name).catch(() => downloadFile(backup))}>
                  <Share2 className="size-5" /> Share backup
                </Button>
              )}
              <Button size="lg" onClick={() => downloadFile(backup)}>
                <Download className="size-5" /> Download {backup.name}
              </Button>
            </div>
          )}
        </section>

        <section className="border-t border-border pt-5">
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label="Backup file to restore"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void restore(f)
            }}
          />
          <Button className="w-full" size="lg" disabled={busy} onClick={() => fileInput.current?.click()}>
            <Upload className="size-5" /> Restore from file
          </Button>
          <p className="mt-2 text-xs text-muted">Existing maps are only replaced by newer copies.</p>
          {result && (
            <div
              role="status"
              className={`mt-3 flex gap-2 rounded-xl p-3 text-sm ${result.ok ? 'bg-success/15' : 'bg-danger/15 text-danger'}`}
            >
              {result.ok && <CheckCircle2 className="size-5 shrink-0 text-success" />}
              <ul>
                {result.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </Sheet>
  )
}
