import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import type { SessionResult } from './types';

type LeaderboardViewProps = {
  entries: SessionResult[];
  onBack: () => void;
};

export function LeaderboardView({ entries, onBack }: LeaderboardViewProps) {
  return (
    <div className="math-module">
      <Card className="math-card">
        <div className="math-section">
          <h1 className="math-title">Leaderboard</h1>
          {entries.length === 0 ? (
            <div className="math-empty">No saved sessions yet</div>
          ) : (
            <table className="math-leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td>{index + 1}</td>
                    <td>{entry.name ?? 'ANON'}</td>
                    <td>{entry.correct}</td>
                    <td>{entry.accuracy}%</td>
                    <td>{entry.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Button onClick={onBack}>Back</Button>
        </div>
      </Card>
    </div>
  );
}
