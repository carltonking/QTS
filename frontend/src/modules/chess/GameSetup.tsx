import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';

export type ChessColor = 'WHITE' | 'BLACK';

export type GameSetupConfig = {
  elo: number;
  color: ChessColor;
};

type GameSetupProps = {
  config: GameSetupConfig;
  onChange: (config: GameSetupConfig) => void;
  onStart: () => void;
};

function clampElo(value: number): number {
  return Math.max(0, Math.min(3000, Math.round(value)));
}

export function GameSetup({ config, onChange, onStart }: GameSetupProps) {
  return (
    <Card className="chess-setup-card">
      <div className="chess-chart-title">PLAY AGAINST AI</div>

      <div className="chess-info-grid">
        <div className="chess-meta-label">AI ELO</div>
        <div className="chess-meta-value">AI STRENGTH: {config.elo} ELO</div>
        <input
          className="chess-range chess-range-full"
          type="range"
          min={0}
          max={3000}
          value={config.elo}
          onChange={(event) =>
            onChange({
              ...config,
              elo: clampElo(Number(event.target.value)),
            })
          }
        />
      </div>

      <div className="chess-color-toggle">
        <Button
          variant={config.color === 'WHITE' ? 'default' : 'ghost'}
          onClick={() => onChange({ ...config, color: 'WHITE' })}
        >
          Play As White
        </Button>
        <Button
          variant={config.color === 'BLACK' ? 'default' : 'ghost'}
          onClick={() => onChange({ ...config, color: 'BLACK' })}
        >
          Play As Black
        </Button>
      </div>

      <Button style={{ width: '100%' }} onClick={onStart}>
        Start Game
      </Button>
    </Card>
  );
}
