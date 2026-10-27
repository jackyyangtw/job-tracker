import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-normal whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary font-medium text-primary-foreground hover:bg-primary/90',
        outline: 'border bg-card text-foreground hover:bg-secondary',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        destructive: 'border border-destructive bg-card text-destructive hover:bg-destructive/10',
        'destructive-solid': 'bg-destructive font-medium text-card hover:bg-destructive/90',
      },
      // 觸控裝置（pointer: coarse）一律放大到 44px，符合 Apple HIG 建議的最小觸控範圍。
      // 覆寫高度時要連 pointer-coarse: 一起寫，否則觸控裝置上會被這裡的 44px 蓋掉。
      size: {
        default: 'h-9 px-4 py-1.5 pointer-coarse:h-11',
        sm: 'h-8 px-2.5 text-[13px] pointer-coarse:h-11 pointer-coarse:px-3.5',
        icon: 'size-9 pointer-coarse:size-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
