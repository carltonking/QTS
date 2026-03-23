import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  return (
    <input
      ref={ref}
      {...props}
      style={{
        width: '100%',
        border: '1px solid var(--text-1)',
        background: 'var(--bg)',
        color: 'var(--text-1)',
        padding: '0.75rem 0.9rem',
        outline: 'none',
        borderRadius: 'var(--radius)',
        fontFamily: 'var(--font-mono)',
        transition: 'var(--transition)',
        ...(props.style ?? {}),
      }}
    />
  );
});
