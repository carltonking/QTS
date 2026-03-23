import type { AttemptResult, Category, Difficulty, Question, UserState } from './types';

export const DEFAULT_RATINGS = { MATH: 50, PROBABILITY: 50, FINANCE: 50 };

export function getDefaultUserState(): UserState {
  return {
    ratings: { ...DEFAULT_RATINGS },
    solved: 0,
    streak: 0,
    bookmarks: [],
    history: [],
  };
}

function targetDifficulty(rating: number): Difficulty {
  if (rating < 40) {
    return 'EASY';
  }

  if (rating < 70) {
    return 'MEDIUM';
  }

  return 'HARD';
}

export function selectNextQuestion(
  questions: Question[],
  userState: UserState,
  attemptedIds: Set<string>,
): Question {
  const lowestCategory = (Object.entries(userState.ratings).sort((a, b) => a[1] - b[1])[0]?.[0] ??
    'MATH') as Category;
  const preferredDifficulty = targetDifficulty(userState.ratings[lowestCategory]);

  const exact = questions.filter(
    (question) =>
      question.category === lowestCategory &&
      question.difficulty === preferredDifficulty &&
      !attemptedIds.has(question.id),
  );

  const byCategory = questions.filter(
    (question) => question.category === lowestCategory && !attemptedIds.has(question.id),
  );

  const remaining = questions.filter((question) => !attemptedIds.has(question.id));
  const pool =
    exact.length > 0
      ? exact
      : byCategory.length > 0
        ? byCategory
        : remaining.length > 0
          ? remaining
          : questions;

  return pool[Math.floor(Math.random() * pool.length)];
}

export function updateRating(
  userState: UserState,
  category: Category,
  result: AttemptResult,
): UserState {
  const delta = result === 'CORRECT' ? 3 : result === 'PARTIAL' ? 1 : -2;
  const newRating = Math.max(0, Math.min(100, userState.ratings[category] + delta));

  return {
    ...userState,
    ratings: { ...userState.ratings, [category]: newRating },
    solved: result !== 'INCORRECT' ? userState.solved + 1 : userState.solved,
    streak: result === 'CORRECT' ? userState.streak + 1 : 0,
  };
}
