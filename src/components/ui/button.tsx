import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center rounded-md px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-ink hover:brightness-110',
        outline: 'border border-secondary text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

// Local shadcn/ui Button pattern, adapted to Kurio tokens.
export function Button({
  asChild = false,
  className,
  variant,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : 'button'
  return <Component className={twMerge(clsx(buttonVariants({ variant }), className))} {...props} />
}
