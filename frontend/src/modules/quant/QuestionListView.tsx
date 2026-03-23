import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../shared/components/Card';
import { getDefaultUserState } from './AdaptiveEngine';
import { QUESTIONS } from './questions';
import './quant.css';
import type { AttemptResult, Category, Difficulty, UserState } from './types';

const USER_KEY = 'qts_quant_user';

function loadUserState(): UserState {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserState) : getDefaultUserState();
  } catch {
    return getDefaultUserState();
  }
}

function latestStatuses(history: UserState['history']) {
  const latest = new Map<string, AttemptResult>();
  history.forEach((entry) => latest.set(entry.questionId, entry.result));
  return latest;
}

function statusSymbol(result?: AttemptResult) {
  if (result === 'CORRECT') {
    return '✓';
  }

  if (result === 'PARTIAL') {
    return '~';
  }

  if (result === 'INCORRECT') {
    return '✗';
  }

  return '';
}

export function QuestionListView() {
  const navigate = useNavigate();
  const userState = loadUserState();
  const statusMap = latestStatuses(userState.history);
  const [category, setCategory] = useState<'ALL' | Category>('ALL');
  const [difficulty, setDifficulty] = useState<'ALL' | Difficulty>('ALL');
  const [search, setSearch] = useState('');

  const filteredQuestions = useMemo(
    () =>
      QUESTIONS.filter((question) => {
        const matchesCategory = category === 'ALL' || question.category === category;
        const matchesDifficulty = difficulty === 'ALL' || question.difficulty === difficulty;
        const haystack = `${question.title} ${question.body} ${question.tags.join(' ')}`.toLowerCase();
        const matchesSearch = search.trim() === '' || haystack.includes(search.toLowerCase());
        return matchesCategory && matchesDifficulty && matchesSearch;
      }),
    [category, difficulty, search],
  );

  return (
    <div className="quant-module">
      <Card className="quant-card">
        <div className="quant-grid">
          <div className="quant-title" style={{ fontSize: '1.4rem' }}>
            Question Bank
          </div>

          <div className="quant-filters">
            <label className="quant-field">
              Category
              <select
                className="quant-select"
                value={category}
                onChange={(event) => setCategory(event.target.value as 'ALL' | Category)}
              >
                <option value="ALL">ALL</option>
                <option value="MATH">MATH</option>
                <option value="PROBABILITY">PROBABILITY</option>
                <option value="FINANCE">FINANCE</option>
              </select>
            </label>
            <label className="quant-field">
              Difficulty
              <select
                className="quant-select"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as 'ALL' | Difficulty)}
              >
                <option value="ALL">ALL</option>
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </label>
            <label className="quant-field">
              Search
              <input
                className="quant-select"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="SEARCH"
              />
            </label>
          </div>

          <div className="quant-history-wrap">
            <table className="quant-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((question) => (
                  <tr
                    key={question.id}
                    className="quant-click-row"
                    onClick={() => navigate(`/quant/questions/${question.id}`)}
                  >
                    <td>{question.title}</td>
                    <td>{question.category}</td>
                    <td>{question.difficulty}</td>
                    <td>{statusSymbol(statusMap.get(question.id))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
