// @/components/ui/Label.jsx
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-gray-900 dark:text-gray-100',
        muted: 'text-gray-500 dark:text-gray-400',
        destructive: 'text-red-600 dark:text-red-400',
        success: 'text-green-600 dark:text-green-400',
      },
      size: {
        default: 'text-sm',
        sm: 'text-xs',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Label = React.forwardRef(({ 
  className, 
  variant,
  size,
  required = false,
  children,
  ...props 
}, ref) => {
  return (
    <label
      ref={ref}
      className={cn(labelVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
});

Label.displayName = 'Label';

export { Label, labelVariants };