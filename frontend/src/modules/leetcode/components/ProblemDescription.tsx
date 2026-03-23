import { useEffect } from 'react';
import type { ProblemDetail, SubmissionHistoryEntry } from '../api';

type ProblemDescriptionProps = {
  problem: ProblemDetail;
  submissions: SubmissionHistoryEntry[];
  showSubmissions: boolean;
  activeTab: 'DESCRIPTION' | 'SUBMISSIONS';
  setActiveTab: (tab: 'DESCRIPTION' | 'SUBMISSIONS') => void;
};

export function ProblemDescription({
  problem,
  submissions,
  showSubmissions,
  activeTab,
  setActiveTab,
}: ProblemDescriptionProps) {
  useEffect(() => {
    if (!showSubmissions && activeTab === 'SUBMISSIONS') {
      setActiveTab('DESCRIPTION');
    }
  }, [activeTab, setActiveTab, showSubmissions]);

  return (
    <div className="lc-description-shell">
      <div className="lc-problem-meta">
        <div className="lc-problem-title">
          {problem.id}. {problem.title.toUpperCase()}
        </div>
        <div className="lc-problem-badges">
          <span className={`lc-difficulty lc-${problem.difficulty.toLowerCase()}`}>
            [ {problem.difficulty} ]
          </span>
          {problem.tags.map((tag) => (
            <span key={tag} className="lc-tag-badge">
              [ {tag.toUpperCase()} ]
            </span>
          ))}
        </div>
      </div>

      <div className="lc-tab-row">
        <button
          type="button"
          className={`lc-tab${activeTab === 'DESCRIPTION' ? ' lc-tab-active' : ''}`}
          onClick={() => setActiveTab('DESCRIPTION')}
        >
          DESCRIPTION
        </button>
        {showSubmissions ? (
          <button
            type="button"
            className={`lc-tab${activeTab === 'SUBMISSIONS' ? ' lc-tab-active' : ''}`}
            onClick={() => setActiveTab('SUBMISSIONS')}
          >
            SUBMISSIONS
          </button>
        ) : null}
      </div>

      {activeTab === 'DESCRIPTION' ? (
        <div className="lc-description-content">
          <p>{problem.description}</p>
          {problem.examples.map((example, index) => (
            <div key={index} className="lc-example-box">
              <div className="lc-example-title">EXAMPLE {index + 1}</div>
              <div>Input: {example.input}</div>
              <div>Output: {example.output}</div>
              {example.explanation ? <div>Explanation: {example.explanation}</div> : null}
            </div>
          ))}
          <div className="lc-constraints">
            {problem.constraints.map((constraint) => (
              <div key={constraint}>· {constraint}</div>
            ))}
          </div>
        </div>
      ) : (
        <table className="lc-submissions-table">
          <thead>
            <tr>
              <th>STATUS</th>
              <th>LANGUAGE</th>
              <th>RUNTIME</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id}>
                <td>{submission.status}</td>
                <td>{submission.language}</td>
                <td>{submission.runtime ?? '-'}</td>
                <td>{new Date(submission.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
