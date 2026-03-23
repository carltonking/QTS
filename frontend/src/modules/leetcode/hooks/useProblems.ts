import { useEffect, useMemo, useState } from 'react';
import { fetchProblems, type Difficulty, type ProblemListItem } from '../api';

type StatusFilter = 'ALL' | 'SOLVED' | 'ATTEMPTED' | 'TODO';

export function useProblems() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | 'ALL'>('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<{
    problems: ProblemListItem[];
    total: number;
    page: number;
    pages: number;
  }>({
    problems: [],
    total: 0,
    page: 1,
    pages: 1,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProblems({
      page,
      limit: 50,
      difficulty,
      search,
      tag: selectedTags[0],
    })
      .then((data) => {
        if (!cancelled) {
          setResponse(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load problems');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [difficulty, page, search, selectedTags]);

  const filteredProblems = useMemo(() => {
    return response.problems.filter((problem) => {
      const statusMatches =
        status === 'ALL' ||
        (status === 'SOLVED' && problem.status === 'SOLVED') ||
        (status === 'ATTEMPTED' && problem.status === 'ATTEMPTED') ||
        (status === 'TODO' && !problem.status);

      const tagMatches =
        selectedTags.length === 0 || selectedTags.every((tag) => problem.tags.includes(tag));

      return statusMatches && tagMatches;
    });
  }, [response.problems, selectedTags, status]);

  const availableTags = useMemo(() => {
    return [...new Set(response.problems.flatMap((problem) => problem.tags))].sort();
  }, [response.problems]);

  return {
    problems: filteredProblems,
    total: response.total,
    page: response.page,
    pages: response.pages,
    search,
    setSearch,
    difficulty,
    setDifficulty,
    status,
    setStatus,
    selectedTags,
    setSelectedTags,
    availableTags,
    loading,
    error,
    setPage,
  };
}
