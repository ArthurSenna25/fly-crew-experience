import { type ElementType, type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** HTML element: 'div' (default) or 'section' */
  as?: ElementType;
}

/**
 * Responsive container with max-width and padding.
 * Replaces `max-w-7xl mx-auto px-6 sm:px-8 lg:px-12`.
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, as: Tag = 'div', ...props }, ref) => {
    return (
      <Tag
        ref={ref}
        className={cn(
          'mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-12',
          className,
        )}
        {...props}
      >
        {children}
      </Tag>
    );
  },
);

Container.displayName = 'Container';