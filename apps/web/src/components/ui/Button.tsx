import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const button = cva(
  'inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg shadow-lg shadow-accent/20',
        secondary: 'bg-surface-2 text-text border border-border',
        ghost: 'text-text hover:bg-surface-2',
        danger: 'bg-danger/15 text-danger',
      },
      size: {
        md: 'h-12 px-4 text-base',
        lg: 'h-14 px-6 text-lg',
        sm: 'h-10 px-3 text-sm',
        icon: 'size-12 shrink-0',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(button({ variant, size }), className)} {...props} />
}
