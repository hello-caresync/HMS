import { InputHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/utils';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    className={cn(
      'flex h-10 w-full rounded-lg border border-[#C7C39E]/60 bg-white px-3 py-2 text-sm text-[#2B2A22] placeholder:text-[#5C5A4E]/70 focus:border-[#A39E75] focus:outline-none focus:ring-2 focus:ring-[#A39E75]/25 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
