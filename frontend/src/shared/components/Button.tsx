import type { ButtonHTMLAttributes, CSSProperties, PropsWithChildren } from 'react';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'ghost';
  }
>;

const variantStyles: Record<NonNullable<ButtonProps['variant']>, CSSProperties> = {
  default: {
    border: '1px solid var(--text-1)',
    background: 'var(--bg)',
    color: 'var(--text-1)',
  },
  ghost: {
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-1)',
  },
};

export function Button({
  children,
  variant = 'default',
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className="button-base"
      style={{
        ...variantStyles[variant],
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
