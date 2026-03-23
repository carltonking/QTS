type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {label ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <span>{label}</span>
          <span>{normalized}%</span>
        </div>
      ) : null}
      <div
        style={{
          width: '100%',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          height: '0.85rem',
        }}
      >
        <div
          style={{
            width: `${normalized}%`,
            height: '100%',
            background: 'var(--text-1)',
            transition: 'var(--transition)',
          }}
        />
      </div>
    </div>
  );
}
