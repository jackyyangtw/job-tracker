import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs whitespace-nowrap', {
  variants: {
    variant: {
      default: 'bg-secondary text-secondary-foreground',
      warn: 'bg-warn/15 text-warn',
      destructive: 'bg-destructive/15 text-destructive',
      outline: 'rounded-md border border-dashed px-1.5 py-0 text-[11px] text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
