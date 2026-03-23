import { Link } from 'react-router-dom';
import { ProgressBar } from '../../../shared/components/ProgressBar';
import type { ProblemStatus } from '../api';

type RoadmapProblem = {
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status?: ProblemStatus;
};

type RoadmapCardProps = {
  title: string;
  problems: RoadmapProblem[];
};

export function RoadmapCard({ title, problems }: RoadmapCardProps) {
  const solved = problems.filter((problem) => problem.status === 'SOLVED').length;
  const progress = problems.length > 0 ? Math.round((solved / problems.length) * 100) : 0;

  return (
    <div className="lc-roadmap-card">
      <div className="lc-roadmap-title">─ {title.toUpperCase()} ─</div>
      <ProgressBar value={progress} />
      <div className="lc-roadmap-count">
        {solved} / {problems.length}
      </div>
      <div className="lc-roadmap-list">
        {problems.map((problem) => (
          <div key={problem.slug} className="lc-roadmap-row">
            <Link to={`/code/${problem.slug}`}>· {problem.title}</Link>
            <span>
              {problem.status === 'SOLVED' ? '✓ ' : ''}
              {problem.difficulty === 'MEDIUM' ? 'MED' : problem.difficulty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
