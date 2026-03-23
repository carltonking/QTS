import { useEffect, useState } from 'react';
import type { SubmissionRunResult } from '../api';

type TestResultPanelProps = {
  result: SubmissionRunResult | null;
  loading: boolean;
};

export function TestResultPanel({ result, loading }: TestResultPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [result]);

  if (loading) {
    return (
      <div className="lc-results-shell lc-results-loading">
        RUNNING<span className="lc-blink">_</span>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const activeCase = result.testResults[activeIndex];

  return (
    <div className="lc-results-shell">
      <div className="lc-result-tabs">
        {result.testResults.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`lc-result-tab${index === activeIndex ? ' lc-result-tab-active' : ''}`}
            onClick={() => setActiveIndex(index)}
          >
            CASE {index + 1}
          </button>
        ))}
      </div>

      {activeCase ? (
        <div className="lc-result-case">
          <div>INPUT: {activeCase.input}</div>
          <div>OUTPUT: {activeCase.actualOutput}</div>
          <div>EXPECTED: {activeCase.expectedOutput}</div>
          <div>STATUS: {activeCase.passed ? '✓ PASS' : '✗ FAIL'}</div>
        </div>
      ) : null}

      <div className="lc-verdict-box">
        <div className="lc-verdict-title">{result.status.split('_').join(' ')}</div>
        {result.status === 'ACCEPTED' ? (
          <div>
            RUNTIME: {result.runtime ?? '-'} MS · MEMORY: {result.memory ?? '-'} KB · PERCENTILE:{' '}
            {result.percentile ?? '-'}%
          </div>
        ) : (
          <div>{result.errorMessage ?? `${result.passed}/${result.total} TESTS PASSED`}</div>
        )}
      </div>
    </div>
  );
}
