import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Input } from '../../shared/components/Input';
import type { Operation, SessionConfig } from './types';

type ConfigViewProps = {
  config: SessionConfig;
  onConfigChange: (config: SessionConfig) => void;
  onStart: () => void;
  onLeaderboard: () => void;
};

const operationSymbols: Record<Operation, string> = {
  ADD: '+',
  SUB: '−',
  MUL: '×',
  DIV: '÷',
};

const durationOptions: SessionConfig['duration'][] = [30, 60, 120, 180];

export function ConfigView({
  config,
  onConfigChange,
  onStart,
  onLeaderboard,
}: ConfigViewProps) {
  const selectedOperations = useMemo(() => new Set(config.operations), [config.operations]);

  const toggleOperation = (operation: Operation) => {
    const next = selectedOperations.has(operation)
      ? config.operations.filter((item) => item !== operation)
      : [...config.operations, operation];

    if (next.length === 0) {
      return;
    }

    onConfigChange({
      ...config,
      operations: next,
    });
  };

  const updateRange = (operation: Operation, index: 0 | 1, value: string) => {
    const parsed = Number(value);
    const nextValue = Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
    const current = config.ranges[operation];
    const updatedRange: [number, number] =
      index === 0 ? [nextValue, current[1]] : [current[0], nextValue];

    onConfigChange({
      ...config,
      ranges: {
        ...config.ranges,
        [operation]: updatedRange,
      },
    });
  };

  return (
    <div className="math-module">
      <Card className="math-card">
        <div className="math-section">
          <h1 className="math-title">Mental Math Trainer</h1>
          <p>
            Configure the operations, number ranges, and timer, then start a focused speed round.
          </p>
        </div>
      </Card>

      <Card className="math-card">
        <div className="math-section">
          <div className="math-section-label">Operations</div>
          <div className="math-toggle-row">
            {(['ADD', 'SUB', 'MUL', 'DIV'] as Operation[]).map((operation) => {
              const active = selectedOperations.has(operation);

              return (
                <Button
                  key={operation}
                  className={`math-toggle${active ? ' math-toggle-active' : ''}`}
                  onClick={() => toggleOperation(operation)}
                  type="button"
                >
                  [ {operationSymbols[operation]} ]
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="math-card">
        <div className="math-section">
          <div className="math-section-label">Number Ranges</div>
          <div className="math-range-grid">
            {config.operations.map((operation) => (
              <div key={operation} className="math-range-card">
                <div className="math-range-header">
                  <div>{operation}</div>
                  <div>[ {operationSymbols[operation]} ]</div>
                </div>
                <div className="math-input-grid">
                  <label className="math-input-label">
                    Min
                    <Input
                      type="number"
                      min={1}
                      value={config.ranges[operation][0]}
                      onChange={(event) => updateRange(operation, 0, event.target.value)}
                    />
                  </label>
                  <label className="math-input-label">
                    Max
                    <Input
                      type="number"
                      min={1}
                      value={config.ranges[operation][1]}
                      onChange={(event) => updateRange(operation, 1, event.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="math-card">
        <div className="math-section">
          <div className="math-section-label">Duration</div>
          <div className="math-toggle-row">
            {durationOptions.map((option) => (
              <Button
                key={option}
                className={`math-toggle${config.duration === option ? ' math-toggle-active' : ''}`}
                onClick={() => onConfigChange({ ...config, duration: option })}
                type="button"
              >
                {option}s
              </Button>
            ))}
          </div>
          <Button onClick={onStart} style={{ width: '100%' }}>
            Start Session
          </Button>
          <div className="math-link-row">
            <Link to="/math" onClick={(event) => { event.preventDefault(); onLeaderboard(); }}>
              [ VIEW LEADERBOARD ]
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
