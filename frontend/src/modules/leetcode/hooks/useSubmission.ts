import { useCallback, useState } from 'react';
import {
  fetchSubmissionHistory,
  runSubmission,
  submitSolution,
  type SubmissionHistoryEntry,
  type SubmissionRunResult,
} from '../api';

export function useSubmission(slug: string) {
  const [result, setResult] = useState<SubmissionRunResult | null>(null);
  const [history, setHistory] = useState<SubmissionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (language: string, code: string) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const next = await runSubmission({ slug, language, code });
        setResult(next);
        return next;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Run failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [slug],
  );

  const submit = useCallback(
    async (language: string, code: string) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const next = await submitSolution({ slug, language, code });
        setResult(next);
        return next;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Submit failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [slug],
  );

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);

    try {
      const items = await fetchSubmissionHistory(slug);
      setHistory(items);
      return items;
    } finally {
      setHistoryLoading(false);
    }
  }, [slug]);

  return {
    result,
    history,
    loading,
    historyLoading,
    error,
    run,
    submit,
    loadHistory,
    clearResult: () => setResult(null),
  };
}
