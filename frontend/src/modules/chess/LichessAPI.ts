import { Chess } from 'chess.js';
import type { LichessPuzzleResponse, Puzzle } from './types';

function themeToAngle(theme?: string): string | null {
  if (!theme) {
    return null;
  }

  return theme.trim();
}

export async function fetchNextPuzzle(theme?: string): Promise<Puzzle> {
  const angle = themeToAngle(theme);
  const url = angle
    ? `https://lichess.org/api/puzzle/next?angle=${encodeURIComponent(angle)}`
    : 'https://lichess.org/api/puzzle/next';

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch puzzle (${response.status})`);
  }

  const data = (await response.json()) as LichessPuzzleResponse;
  const chess = new Chess();

  try {
    chess.loadPgn(data.game.pgn);
  } catch {
    throw new Error('Failed to derive puzzle position from PGN');
  }

  const fen = chess.fen();
  const turnToMove = chess.turn() === 'w' ? 'WHITE' : 'BLACK';

  return {
    id: data.puzzle.id,
    fen,
    moves: data.puzzle.solution.map((move) => move.toLowerCase()),
    themes: data.puzzle.themes,
    rating: data.puzzle.rating,
    rd: 80,
    turnToMove,
  };
}
