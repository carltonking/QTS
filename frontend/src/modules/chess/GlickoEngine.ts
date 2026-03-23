import type { PlayerRating, Puzzle, PuzzleAttempt } from './types';

export const q = Math.log(10) / 400;
export const c = 34.6;

export function g(rd: number): number {
  return 1 / Math.sqrt(1 + (3 * q * q * rd * rd) / (Math.PI * Math.PI));
}

export function E(r: number, rj: number, rdj: number): number {
  return 1 / (1 + Math.pow(10, (-g(rdj) * (r - rj)) / 400));
}

export function updateRDForInactivity(rd: number, weeksInactive: number): number {
  return Math.min(Math.sqrt(rd * rd + c * c * weeksInactive), 350);
}

export function computeNewRating(
  player: PlayerRating,
  attempts: PuzzleAttempt[],
  puzzles: Puzzle[],
): PlayerRating {
  if (attempts.length === 0 || puzzles.length === 0) {
    return player;
  }

  const weeksInactive = (Date.now() - player.lastUpdated) / (1000 * 60 * 60 * 24 * 7);
  const rd = updateRDForInactivity(player.rd, weeksInactive);

  const games = attempts.map((a, i) => ({
    rj: puzzles[i].rating,
    rdj: puzzles[i].rd,
    sj: a.score,
  }));

  const varianceBase = games.reduce((sum, { rj, rdj }) => {
    const gv = g(rdj);
    const ev = E(player.r, rj, rdj);
    return sum + gv * gv * ev * (1 - ev);
  }, 0);

  if (varianceBase === 0) {
    return { ...player, rd: Math.max(Math.round(rd), 30), lastUpdated: Date.now() };
  }

  const d2 = 1 / (q * q * varianceBase);

  const rNew =
    player.r +
    (q / (1 / (rd * rd) + 1 / d2)) *
      games.reduce(
        (sum, { rj, rdj, sj }) => sum + g(rdj) * (sj - E(player.r, rj, rdj)),
        0,
      );

  const rdNew = Math.sqrt(1 / (1 / (rd * rd) + 1 / d2));

  return { r: Math.round(rNew), rd: Math.max(Math.round(rdNew), 30), lastUpdated: Date.now() };
}

export function processRatingPeriod(
  player: PlayerRating,
  attempts: PuzzleAttempt[],
  puzzles: Puzzle[],
) {
  const updatedPlayer = computeNewRating(player, attempts, puzzles);

  const updatedPuzzles = puzzles.map((puzzle, index) => {
    const attempt = attempts[index];

    if (!attempt) {
      return puzzle;
    }

    const puzzleAsPlayer: PlayerRating = {
      r: puzzle.rating,
      rd: puzzle.rd,
      lastUpdated: attempt.solvedAt,
    };

    const updatedPuzzle = computeNewRating(
      puzzleAsPlayer,
      [
        {
          ...attempt,
          puzzleId: puzzle.id,
          puzzleRating: player.r,
          score: 1 - attempt.score,
        },
      ],
      [
        {
          ...puzzle,
          rating: player.r,
          rd: player.rd,
        },
      ],
    );

    return {
      ...puzzle,
      rating: updatedPuzzle.r,
      rd: updatedPuzzle.rd,
    };
  });

  return {
    player: updatedPlayer,
    puzzles: updatedPuzzles,
  };
}
