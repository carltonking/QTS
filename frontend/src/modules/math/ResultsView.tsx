import { useMemo, useState } from 'react';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Input } from '../../shared/components/Input';
import { LineChart } from '../../shared/components/LineChart';
import type { SessionResult } from './types';

type ResultsViewProps = {
  result: SessionResult;
  history: SessionResult[];
  onRestart: () => void;
  onNewSession: () => void;
  onSave: (name: string) => void;
};

export function ResultsView({
  result,
  history,
  onRestart,
  onNewSession,
  onSave,
}: ResultsViewProps) {
  const [name, setName] = useState(result.name ?? '');
  const [saved, setSaved] = useState(Boolean(result.name));

  const chartData = useMemo(
    () =>
      history.map((entry, index) => ({
        x: index + 1,
        y: entry.correct,
      })),
    [history],
  );

  const totalAnswered = result.correct + result.incorrect;

  return (
    <div className="math-module">
      <Card className="math-card">
        <div className="math-section">
          <h1 className="math-title">Session Complete</h1>
          <div className="math-stats-grid">
            <div className="math-stat-card">
              <div className="math-stat-label">Correct</div>
              <div className="math-stat-value">CORRECT: {result.correct}</div>
            </div>
            <div className="math-stat-card">
              <div className="math-stat-label">Incorrect</div>
              <div className="math-stat-value">INCORRECT: {result.incorrect}</div>
            </div>
            <div className="math-stat-card">
              <div className="math-stat-label">Accuracy</div>
              <div className="math-stat-value">ACCURACY: {result.accuracy}%</div>
            </div>
            <div className="math-stat-card">
              <div className="math-stat-label">Best Streak</div>
              <div className="math-stat-value">BEST STREAK: {result.bestStreak}</div>
            </div>
            <div className="math-stat-card">
              <div className="math-stat-label">Total Answered</div>
              <div className="math-stat-value">TOTAL ANSWERED: {totalAnswered}</div>
            </div>
            <div className="math-stat-card">
              <div className="math-stat-label">Duration</div>
              <div className="math-stat-value">DURATION: {result.config.duration}s</div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="math-card">
        <div className="math-section">
          <div className="math-section-label">History</div>
          <LineChart data={chartData.length > 0 ? chartData : [{ x: 1, y: result.correct }]} xLabel="Session" yLabel="Correct" />
        </div>
      </Card>

      <Card className="math-card">
        <div className="math-section">
          <div className="math-results-actions">
            <Button onClick={onRestart}>Restart With Same Settings</Button>
            <Button onClick={onNewSession} variant="ghost">
              New Session
            </Button>
          </div>
          <div className="math-save-row">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="ENTER NAME"
              disabled={saved}
            />
            <Button
              onClick={() => {
                if (!name.trim() || saved) {
                  return;
                }

                onSave(name.trim());
                setSaved(true);
              }}
              disabled={!name.trim() || saved}
            >
              Save To Leaderboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
