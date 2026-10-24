import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

/** Modal bottom sheet built on <dialog>, so focus trapping and Esc come for free. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        'm-0 mt-auto max-h-[90dvh] w-full max-w-none bg-transparent p-0 text-text backdrop:bg-black/60 sm:mx-auto sm:mb-6 sm:max-w-lg',
        className,
      )}
    >
      <div className="rounded-t-3xl border border-border bg-surface px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-3xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="mb-4 text-lg font-bold">{title}</h2>
        {children}
      </div>
    </dialog>
  )
}
