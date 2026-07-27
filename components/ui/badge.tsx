import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', {
  variants: {
    variant: {
      default: 'border-transparent bg-[#A39E75] text-white',
      secondary: 'border-[#C7C39E]/60 bg-[#E6E3C5]/40 text-[#2B2A22]',
      destructive: 'border-transparent bg-red-100 text-red-800',
      outline: 'border-[#C7C39E] text-[#2B2A22]',
      success: 'border-transparent bg-emerald-100 text-emerald-800',
      warning: 'border-transparent bg-amber-100 text-amber-800',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
