import type { CSSProperties, PropsWithChildren } from 'react';

type CardProps = PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
}>;

export function Card({ children, className, style }: CardProps) {
  return (
    <section
      className={className}
      style={{
        border: '1px solid var(--border)',
        background: 'var(--surface-1)',
        padding: '1.25rem',
        borderRadius: 'var(--radius)',
        ...style,
      }}
    >
      {children}
    </section>
  );
}
