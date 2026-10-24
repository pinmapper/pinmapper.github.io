// Pure helpers kept apart from schemas.ts so the web bundle doesn't pull in zod.
import type { PinAnnotation } from './schemas'

export function emptyAnnotation(): PinAnnotation {
  return { signal: '', notes: '', status: 'unknown' }
}

export function isAnnotated(a: PinAnnotation | undefined): boolean {
  return !!a && (a.signal.trim() !== '' || !!a.wire || a.status !== 'unknown' || a.notes.trim() !== '')
}
