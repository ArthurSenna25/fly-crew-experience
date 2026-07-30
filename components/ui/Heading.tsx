import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface HeadingProps extends HTMLAttributes<HTMLDivElement> {
  /** Small uppercase label above the title (gold, tracked) */
  label?: string;
  /** Main heading text (white, cinzel) */
  title: string;
  /** Optional highlighted text after the title (gold) */
  highlight?: string;
  /** Text alignment */
  align?: 'center' | 'left';
}

/**
 * Section heading composed of label + title + optional highlight.
 * Replaces the common pattern:
 *   <p className="text-sm uppercase tracking-[0.2em] text-gold-prestige ...">LABEL</p>
 *   <h2 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel ...">TITLE</h2>
 */
export function Heading({
  label,
  title,
  highlight,
  align = 'center',
  className,
  ...props
}: HeadingProps) {
  return (
    <div
      className={cn(
        'space-y-6',
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    >
      {label && (
        <p className="text-sm uppercase tracking-[0.2em] text-gold-prestige font-semibold">
          {label}
        </p>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel font-light tracking-tight text-white leading-[1.1]">
        {title}
        {highlight && (
          <>
            <br />
            <span className="text-gold-prestige">{highlight}</span>
          </>
        )}
      </h2>
    </div>
  );
}