import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Button } from '../../shared/components/Button';
import type { Puzzle } from './types';

type ChessBoardProps = {
  puzzle: Puzzle;
  hintsEnabled: boolean;
  onToggleHints: () => void;
  onSolved: (timeTaken: number, attempts: number) => void;
  onGiveUp: (timeTaken: number, attempts: number) => void;
  onAttemptsChange: (attempts: number) => void;
  onTimeChange: (seconds: number) => void;
};

type HighlightState = {
  square: string;
  style: CSSProperties;
} | null;

function normalizeMoveUci(move: { from: string; to: string; promotion?: string }) {
  return `${move.from}${move.to}${move.promotion ?? ''}`.toLowerCase();
}

function dotSquareStyle(): CSSProperties {
  const dotSvg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="12" fill="white" /></svg>`,
  );

  return {
    backgroundImage: `url("data:image/svg+xml,${dotSvg}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '24px 24px',
  };
}

export default function ChessBoard({
  puzzle,
  hintsEnabled,
  onToggleHints,
  onSolved,
  onGiveUp,
  onAttemptsChange,
  onTimeChange,
}: ChessBoardProps) {
  const [position, setPosition] = useState(puzzle.fen);
  const [moveIndex, setMoveIndex] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [highlight, setHighlight] = useState<HighlightState>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [hintSquares, setHintSquares] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [boardWidth, setBoardWidth] = useState(520);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef(new Chess(puzzle.fen));
  const startTimeRef = useRef(Date.now());
  const mountedRef = useRef(true);
  const timeoutIdsRef = useRef<number[]>([]);

  const boardOrientation = puzzle.turnToMove === 'WHITE' ? 'white' : 'black';

  const queueTimeout = (callback: () => void, delay: number) => {
    const id = window.setTimeout(callback, delay);
    timeoutIdsRef.current.push(id);
  };

  const clearQueuedTimeouts = () => {
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutIdsRef.current = [];
  };

  const getElapsedSeconds = () => Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));

  const syncHintSquares = (square: string | null, chess: Chess) => {
    if (!hintsEnabled || !square) {
      setHintSquares([]);
      return;
    }

    const moves = chess.moves({ square: square as Square, verbose: true });
    setHintSquares(moves.map((move) => move.to));
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearQueuedTimeouts();
    };
  }, []);

  useEffect(() => {
    clearQueuedTimeouts();
    gameRef.current = new Chess(puzzle.fen);
    startTimeRef.current = Date.now();
    setPosition(puzzle.fen);
    setMoveIndex(0);
    setWrongAttempts(0);
    setStatusText('');
    setHighlight(null);
    setSelectedSquare(null);
    setHintSquares([]);
    setIsLocked(false);
    onAttemptsChange(1);
    onTimeChange(0);
  }, [onAttemptsChange, onTimeChange, puzzle]);

  useEffect(() => {
    if (!hintsEnabled) {
      setHintSquares([]);
      return;
    }

    syncHintSquares(selectedSquare, gameRef.current);
  }, [hintsEnabled, selectedSquare]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      if (!isLocked) {
        onTimeChange(getElapsedSeconds());
      }
    }, 1000);

    return () => window.clearInterval(tick);
  }, [isLocked, onTimeChange]);

  useEffect(() => {
    if (!boardRef.current) {
      return;
    }

    const updateWidth = () => {
      if (!boardRef.current) {
        return;
      }

      const width = Math.min(boardRef.current.clientWidth, 520);
      setBoardWidth(width > 0 ? width : 320);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(boardRef.current);

    return () => observer.disconnect();
  }, []);

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};

    hintSquares.forEach((square) => {
      styles[square] = dotSquareStyle();
    });

    if (selectedSquare) {
      styles[selectedSquare] = {
        ...(styles[selectedSquare] ?? {}),
        outline: '1px solid var(--text-1)',
        outlineOffset: '-1px',
      };
    }

    if (highlight) {
      styles[highlight.square] = {
        ...(styles[highlight.square] ?? {}),
        ...highlight.style,
      };
    }

    return styles;
  }, [highlight, hintSquares, selectedSquare]);

  const finishSolved = () => {
    setStatusText('SOLVED');
    setIsLocked(true);
    setSelectedSquare(null);
    setHintSquares([]);
    onSolved(getElapsedSeconds(), wrongAttempts + 1);
  };

  const applyOutline = (square: string, dashed: boolean, duration: number, callback?: () => void) => {
    setHighlight({
      square,
      style: {
        outline: dashed ? '2px dashed var(--text-1)' : '2px solid var(--text-1)',
        outlineOffset: '-2px',
      },
    });

    queueTimeout(() => {
      if (!mountedRef.current) {
        return;
      }

      setHighlight(null);
      callback?.();
    }, duration);
  };

  const playMoveUci = (uci: string): boolean => {
    const nextGame = new Chess(gameRef.current.fen());
    const move = nextGame.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci.slice(4, 5) || 'q') as 'q' | 'r' | 'b' | 'n',
    });

    if (!move) {
      return false;
    }

    gameRef.current = nextGame;
    setPosition(nextGame.fen());
    return true;
  };

  const autoPlayNextMove = (index: number) => {
    queueTimeout(() => {
      const played = playMoveUci(puzzle.moves[index]);

      if (!played || !mountedRef.current) {
        return;
      }

      if (index >= puzzle.moves.length - 1) {
        queueTimeout(() => finishSolved(), 800);
        return;
      }

      setMoveIndex(index + 1);
      setIsLocked(false);
    }, 800);
  };

  const revealSolution = () => {
    if (wrongAttempts === 0 || isLocked) {
      return;
    }

    setIsLocked(true);
    setStatusText('SOLUTION');
    setSelectedSquare(null);
    setHintSquares([]);

    const play = (index: number) => {
      queueTimeout(() => {
        const played = playMoveUci(puzzle.moves[index]);

        if (!played || !mountedRef.current) {
          return;
        }

        setMoveIndex(index + 1);

        if (index < puzzle.moves.length - 1) {
          play(index + 1);
          return;
        }

        queueTimeout(() => {
          if (!mountedRef.current) {
            return;
          }

          onGiveUp(getElapsedSeconds(), wrongAttempts + 1);
        }, 800);
      }, 800);
    };

    play(moveIndex);
  };

  const attemptMove = (from: string, to: string) => {
    if (isLocked) {
      return false;
    }

    const nextGame = new Chess(gameRef.current.fen());
    const move = nextGame.move({
      from,
      to,
      promotion: 'q',
    });

    if (!move) {
      return false;
    }

    const expectedMove = puzzle.moves[moveIndex].toLowerCase();
    const actualMove = normalizeMoveUci(move);
    const matchesExpected =
      actualMove === expectedMove ||
      actualMove.slice(0, 4) === expectedMove ||
      actualMove === `${expectedMove}q`;

    if (!matchesExpected) {
      setStatusText('INCORRECT');
      setSelectedSquare(null);
      setHintSquares([]);
      setWrongAttempts((previous) => {
        const next = previous + 1;
        onAttemptsChange(next + 1);
        return next;
      });
      applyOutline(to, true, 600);
      return false;
    }

    gameRef.current = nextGame;
    setPosition(nextGame.fen());
    setStatusText('');
    setIsLocked(true);
    setSelectedSquare(null);
    setHintSquares([]);

    applyOutline(to, false, 800, () => {
      const nextIndex = moveIndex + 1;

      if (nextIndex >= puzzle.moves.length) {
        finishSolved();
        return;
      }

      autoPlayNextMove(nextIndex);
    });

    return true;
  };

  const handlePieceDrop = (sourceSquare: string, targetSquare: string) => {
    return attemptMove(sourceSquare, targetSquare);
  };

  const handleSquareClick = (square: string) => {
    if (isLocked) {
      return;
    }

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setHintSquares([]);
        return;
      }

      const moved = attemptMove(selectedSquare, square);

      if (!moved) {
        const piece = gameRef.current.get(square as Square);
        const turn = gameRef.current.turn();
        const belongsToSideToMove =
          piece && ((piece.color === 'w' && turn === 'w') || (piece.color === 'b' && turn === 'b'));

        if (belongsToSideToMove) {
          setSelectedSquare(square);
          syncHintSquares(square, gameRef.current);
        } else {
          setSelectedSquare(null);
          setHintSquares([]);
        }
      }

      return;
    }

    const piece = gameRef.current.get(square as Square);
    const turn = gameRef.current.turn();
    const belongsToSideToMove =
      piece && ((piece.color === 'w' && turn === 'w') || (piece.color === 'b' && turn === 'b'));

    if (!belongsToSideToMove) {
      setSelectedSquare(null);
      setHintSquares([]);
      return;
    }

    setSelectedSquare(square);
    syncHintSquares(square, gameRef.current);
  };

  return (
    <div className="chess-board-shell">
      <div className="chess-turn-banner">{`${puzzle.turnToMove} TO MOVE`}</div>
      <div ref={boardRef} className="chess-board-wrap">
        <Chessboard
          id={`qts-chess-${puzzle.id}`}
          position={position}
          boardOrientation={boardOrientation}
          onPieceDrop={handlePieceDrop}
          onSquareClick={handleSquareClick}
          boardWidth={boardWidth}
          customBoardStyle={{
            border: '1px solid var(--border)',
            borderRadius: 0,
          }}
          customLightSquareStyle={{ backgroundColor: '#888888' }}
          customDarkSquareStyle={{ backgroundColor: '#333333' }}
          customSquareStyles={squareStyles}
        />
      </div>
      <div className="chess-board-footer">
        <Button variant="ghost" onClick={onToggleHints}>
          {hintsEnabled ? 'Hints: On' : 'Hints: Off'}
        </Button>
        <div className="chess-status-text">{statusText || 'READY'}</div>
        {wrongAttempts > 0 ? <Button onClick={revealSolution}>Show Solution</Button> : null}
      </div>
    </div>
  );
}
