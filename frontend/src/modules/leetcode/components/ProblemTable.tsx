import { Link } from 'react-router-dom';
import type { ProblemListItem } from '../api';

type ProblemTableProps = {
  problems: ProblemListItem[];
  page: number;
  pages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

function difficultyLabel(difficulty: ProblemListItem['difficulty']) {
  return difficulty === 'MEDIUM' ? 'MEDIUM' : difficulty;
}

function statusSymbol(status?: ProblemListItem['status']) {
  if (status === 'SOLVED') return '✓';
  if (status === 'ATTEMPTED') return '~';
  return '';
}

export function ProblemTable({ problems, page, pages, total, onPrev, onNext }: ProblemTableProps) {
  const start = total === 0 ? 0 : (page - 1) * 50 + 1;
  const end = total === 0 ? 0 : Math.min(page * 50, total);

  return (
    <div className="lc-table-shell">
      <div className="lc-table-summary">SHOWING {start}–{end} OF {total} PROBLEMS</div>
      <table className="lc-problem-table">
        <thead>
          <tr>
            <th>#</th>
            <th>TITLE</th>
            <th>ACCEPTANCE</th>
            <th>DIFFICULTY</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((problem, index) => (
            <tr key={problem.slug} className="lc-problem-row">
              <td>{(page - 1) * 50 + index + 1}</td>
              <td>
                <Link to={`/code/${problem.slug}`} className="lc-problem-link">
                  <span className="lc-status">{statusSymbol(problem.status)}</span>
                  <span>{problem.title}</span>
                </Link>
              </td>
              <td>{Math.round(problem.acceptanceRate)}%</td>
              <td>
                <span className={`lc-difficulty lc-${problem.difficulty.toLowerCase()}`}>
                  [ {difficultyLabel(problem.difficulty)} ]
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="lc-pagination">
        <button type="button" className="button-base lc-page-btn" onClick={onPrev} disabled={page <= 1}>
          ← PREV
        </button>
        <div>PAGE {page} OF {pages || 1}</div>
        <button type="button" className="button-base lc-page-btn" onClick={onNext} disabled={page >= pages}>
          NEXT →
        </button>
      </div>
    </div>
  );
}
