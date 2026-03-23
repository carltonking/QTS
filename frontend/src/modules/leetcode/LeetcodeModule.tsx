import { Link } from 'react-router-dom';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { FilterBar } from './components/FilterBar';
import { ProblemTable } from './components/ProblemTable';
import { useProblems } from './hooks/useProblems';
import './leetcode.css';

export default function LeetcodeModule() {
  const problems = useProblems();

  return (
    <div className="lc-page">
      <Card className="lc-card">
        <div className="lc-nav-row">
          <div className="lc-heading">Problem Set</div>
          <Link to="/code/roadmap">
            <Button variant="ghost">Roadmap</Button>
          </Link>
        </div>
        <FilterBar
          search={problems.search}
          setSearch={problems.setSearch}
          difficulty={problems.difficulty}
          setDifficulty={problems.setDifficulty}
          status={problems.status}
          setStatus={problems.setStatus}
          availableTags={problems.availableTags}
          selectedTags={problems.selectedTags}
          setSelectedTags={problems.setSelectedTags}
        />
        {problems.error ? <div className="lc-error-box">{problems.error}</div> : null}
        <ProblemTable
          problems={problems.problems}
          page={problems.page}
          pages={problems.pages}
          total={problems.total}
          onPrev={() => problems.setPage(Math.max(1, problems.page - 1))}
          onNext={() => problems.setPage(Math.min(problems.pages, problems.page + 1))}
        />
      </Card>
    </div>
  );
}
