type BadgeProps = {
  label: string;
  size?: 'sm' | 'md';
};

const sizeMap = {
  sm: '0.7rem',
  md: '0.82rem',
};

export function Badge({ label, size = 'md' }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid var(--border)',
        padding: '0.2rem 0.45rem',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontSize: sizeMap[size],
        background: 'var(--surface-1)',
      }}
    >
      [{` ${label.toUpperCase()} `}]
    </span>
  );
}
