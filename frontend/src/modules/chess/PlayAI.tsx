import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { GameSetup, type ChessColor, type GameSetupConfig } from './GameSetup';
import { StockfishEngine } from './StockfishEngine';

const HINTS_KEY = 'qts_chess_hints';

type ActiveGame = {
  elo: number;
  color: ChessColor;
};

type PromotionPiece = 'q' | 'r' | 'b' | 'n';

type PendingPromotion = {
  from: string;
  to: string;
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
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

function movePairs(history: string[]): string[] {
  const rows: string[] = [];

  for (let index = 0; index < history.length; index += 2) {
    const white = history[index];
    const black = history[index + 1] ?? '';
    rows.push(`${Math.floor(index / 2) + 1}. ${white}${black ? ` ${black}` : ''}`);
  }

  return rows;
}

function pieceGlyph(piece: string): string {
  const map: Record<string, string> = {
    p: '♙',
    n: '♘',
    b: '♗',
    r: '♖',
    q: '♕',
    k: '♔',
  };

  return map[piece.toLowerCase()] ?? '';
}

function calculateCapturedPieces(chess: Chess) {
  const board = chess.board().flat().filter(Boolean);
  const counts = {
    white: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    black: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };

  board.forEach((piece) => {
    if (!piece || piece.type === 'k') {
      return;
    }

    const side = piece.color === 'w' ? 'white' : 'black';
    counts[side][piece.type] += 1;
  });

  const base = { p: 8, n: 2, b: 2, r: 2, q: 1 };

  const whiteCaptured = (Object.keys(base) as Array<keyof typeof base>)
    .map((type) => pieceGlyph(type).repeat(base[type] - counts.black[type]))
    .join('');
  const blackCaptured = (Object.keys(base) as Array<keyof typeof base>)
    .map((type) => pieceGlyph(type).repeat(base[type] - counts.white[type]))
    .join('');

  return { whiteCaptured, blackCaptured };
}

function statusText(chess: Chess, humanTurn: boolean, aiThinking: boolean, playerColor: ChessColor): string {
  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'BLACK' : 'WHITE';
    return winner === playerColor ? 'CHECKMATE — YOU WIN' : 'CHECKMATE — AI WINS';
  }

  if (chess.isDraw() || chess.isStalemate() || chess.isInsufficientMaterial() || chess.isThreefoldRepetition()) {
    return 'DRAW';
  }

  if (aiThinking) {
    return 'AI THINKING...';
  }

  return humanTurn ? 'YOUR TURN' : 'IN PROGRESS';
}

export function PlayAI() {
  const [setup, setSetup] = useState<GameSetupConfig>({
    elo: 1200,
    color: 'WHITE',
  });
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [position, setPosition] = useState('start');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [hintSquares, setHintSquares] = useState<string[]>([]);
  const [hintsEnabled, setHintsEnabled] = useState<boolean>(() =>
    loadJson<boolean>(HINTS_KEY, true),
  );
  const [aiThinking, setAiThinking] = useState(false);
  const [boardWidth, setBoardWidth] = useState(520);
  const [resultText, setResultText] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [viewIndex, setViewIndex] = useState(0);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const chessRef = useRef(new Chess());
  const engineRef = useRef<StockfishEngine | null>(null);

  useEffect(() => {
    window.localStorage.setItem(HINTS_KEY, JSON.stringify(hintsEnabled));
  }, [hintsEnabled]);

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

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  const playerTurn = useMemo(() => {
    if (!activeGame) {
      return false;
    }

    const turn = chessRef.current.turn();
    return (activeGame.color === 'WHITE' && turn === 'w') || (activeGame.color === 'BLACK' && turn === 'b');
  }, [activeGame, moveHistory]);

  const syncHints = (square: string | null) => {
    if (!hintsEnabled || !square) {
      setHintSquares([]);
      return;
    }

    const moves = chessRef.current.moves({ square: square as Square, verbose: true });
    setHintSquares(moves.map((move) => move.to));
  };

  const updateView = () => {
    setPosition(chessRef.current.fen());
    const nextHistory = chessRef.current.history();
    setMoveHistory(nextHistory);
    setViewIndex(nextHistory.length);
  };

  const isPromotionMove = (from: string, to: string): boolean => {
    const piece = chessRef.current.get(from as Square);

    if (!piece || piece.type !== 'p') {
      return false;
    }

    return (piece.color === 'w' && to.endsWith('8')) || (piece.color === 'b' && to.endsWith('1'));
  };

  const finishIfGameOver = () => {
    const game = activeGame;

    if (!game) {
      return false;
    }

    if (chessRef.current.isGameOver()) {
      setResultText(statusText(chessRef.current, false, false, game.color));
      setAiThinking(false);
      return true;
    }

    return false;
  };

  const applyAiMove = async () => {
    if (!activeGame) {
      return;
    }

    setAiThinking(true);
    setSelectedSquare(null);
    setHintSquares([]);
    setPendingPromotion(null);

    try {
      if (!engineRef.current) {
        engineRef.current = new StockfishEngine();
        await engineRef.current.init();
      }

      const bestMove = await engineRef.current.getBestMove(chessRef.current.fen(), activeGame.elo);
      const promotion = bestMove.slice(4, 5) || undefined;
      const move = chessRef.current.move({
        from: bestMove.slice(0, 2),
        to: bestMove.slice(2, 4),
        ...(promotion ? { promotion: promotion as PromotionPiece } : {}),
      });

      if (!move) {
        throw new Error('Stockfish returned an invalid move');
      }

      updateView();
      if (!finishIfGameOver()) {
        setAiThinking(false);
      }
    } catch {
      setResultText('ENGINE ERROR');
      setAiThinking(false);
    }
  };

  useEffect(() => {
    if (!activeGame || resultText || aiThinking) {
      return;
    }

    const aiTurn =
      (activeGame.color === 'WHITE' && chessRef.current.turn() === 'b') ||
      (activeGame.color === 'BLACK' && chessRef.current.turn() === 'w');

    if (!aiTurn) {
      return;
    }

    void applyAiMove();
  }, [activeGame, aiThinking, moveHistory, resultText]);

  const startGame = () => {
    chessRef.current = new Chess();
    setActiveGame({
      color: setup.color,
      elo: setup.elo,
    });
    setPosition('start');
    setMoveHistory([]);
    setViewIndex(0);
    setSelectedSquare(null);
    setHintSquares([]);
    setAiThinking(false);
    setResultText(null);
    setPendingPromotion(null);
  };

  const newGame = () => {
    startGame();
  };

  const resign = () => {
    if (!activeGame) {
      return;
    }

    setResultText('CHECKMATE — AI WINS');
    setAiThinking(false);
  };

  const applyHumanMove = (from: string, to: string, promotion?: PromotionPiece) => {
    if (!activeGame || aiThinking || resultText) {
      return false;
    }

    const move = chessRef.current.move({
      from,
      to,
      ...(promotion ? { promotion } : {}),
    });

    if (!move) {
      return false;
    }

    updateView();
    setSelectedSquare(null);
    setHintSquares([]);

    if (!finishIfGameOver()) {
      setAiThinking(false);
    }

    return true;
  };

  const tryMove = (from: string, to: string) => {
    if (isPromotionMove(from, to)) {
      setPendingPromotion({ from, to });
      setSelectedSquare(null);
      setHintSquares([]);
      return false;
    }

    return applyHumanMove(from, to);
  };

  const handleDrop = (sourceSquare: string, targetSquare: string) => {
    if (!playerTurn || aiThinking || resultText || viewIndex !== moveHistory.length) {
      return false;
    }

    return tryMove(sourceSquare, targetSquare);
  };

  const handleSquareClick = (square: string) => {
    if (!playerTurn || aiThinking || resultText || viewIndex !== moveHistory.length) {
      return;
    }

    const piece = chessRef.current.get(square as Square);
    const turn = chessRef.current.turn();
    const belongsToMover =
      piece && ((piece.color === 'w' && turn === 'w') || (piece.color === 'b' && turn === 'b'));

    if (selectedSquare) {
      if (belongsToMover) {
        setSelectedSquare(square);
        syncHints(square);
        return;
      }

      if (hintSquares.includes(square)) {
        void tryMove(selectedSquare, square);
        return;
      }

      setSelectedSquare(null);
      setHintSquares([]);
      return;
    }

    if (!belongsToMover) {
      setSelectedSquare(null);
      setHintSquares([]);
      return;
    }

    setSelectedSquare(square);
    syncHints(square);
  };

  const confirmPromotion = (promotion: PromotionPiece) => {
    if (!pendingPromotion) {
      return;
    }

    const applied = applyHumanMove(pendingPromotion.from, pendingPromotion.to, promotion);

    if (applied) {
      setPendingPromotion(null);
      return;
    }

    setPendingPromotion(null);
  };

  const cancelPromotion = () => {
    setPendingPromotion(null);
  };

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

    return styles;
  }, [hintSquares, selectedSquare]);

  const reviewChess = useMemo(() => {
    const review = new Chess();

    moveHistory.slice(0, viewIndex).forEach((move) => {
      review.move(move);
    });

    return review;
  }, [moveHistory, viewIndex]);

  const reviewMode = viewIndex < moveHistory.length;
  const displayPosition = reviewMode ? reviewChess.fen() : position;
  const reviewRows = useMemo(
    () =>
      Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, rowIndex) => {
        const whiteIndex = rowIndex * 2;
        const blackIndex = whiteIndex + 1;

        return {
          moveNumber: rowIndex + 1,
          white: moveHistory[whiteIndex] ?? '',
          black: moveHistory[blackIndex] ?? '',
          whiteIndex,
          blackIndex,
        };
      }),
    [moveHistory],
  );

  if (!activeGame) {
    return <GameSetup config={setup} onChange={setSetup} onStart={startGame} />;
  }

  const captured = calculateCapturedPieces(chessRef.current);
  const boardOrientation = activeGame.color === 'WHITE' ? 'white' : 'black';
  const status = resultText
    ?? (reviewMode && playerTurn
      ? 'FINISH REVIEWING TO MAKE YOUR MOVE'
      : statusText(chessRef.current, playerTurn, aiThinking, activeGame.color));

  return (
    <div className="chess-ai-layout">
      <div className="chess-column">
        <Card>
          <div className="chess-turn-banner">
            {status}
            {aiThinking ? <span className="chess-thinking-cursor">_</span> : null}
          </div>
          {reviewMode ? (
            <div className="chess-review-banner">
              <span>{`REVIEWING MOVE ${viewIndex} OF ${moveHistory.length}`}</span>
              <Button variant="ghost" onClick={() => setViewIndex(moveHistory.length)}>
                Back To Game
              </Button>
            </div>
          ) : null}
          <div ref={boardRef} className="chess-board-wrap">
            <Chessboard
              id="qts-play-ai-board"
              position={displayPosition}
              boardOrientation={boardOrientation}
              onPieceDrop={handleDrop}
              onSquareClick={handleSquareClick}
              arePiecesDraggable={!reviewMode && !aiThinking && !resultText && playerTurn}
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
            <Button variant="ghost" onClick={() => setHintsEnabled((previous) => !previous)}>
              {hintsEnabled ? 'Hints: On' : 'Hints: Off'}
            </Button>
          </div>
        </Card>

        {pendingPromotion ? (
          <Card className="chess-promotion-card">
            <div className="chess-chart-title">CHOOSE PROMOTION</div>
            <div className="chess-promotion-row">
              <Button onClick={() => confirmPromotion('q')}>♛ Queen</Button>
              <Button onClick={() => confirmPromotion('r')}>♜ Rook</Button>
              <Button onClick={() => confirmPromotion('b')}>♝ Bishop</Button>
              <Button onClick={() => confirmPromotion('n')}>♞ Knight</Button>
            </div>
            <Button variant="ghost" onClick={cancelPromotion}>
              Cancel
            </Button>
          </Card>
        ) : null}

        {resultText ? (
          <Card>
            <div className="chess-result-banner">{resultText}</div>
            <Button onClick={newGame}>New Game</Button>
          </Card>
        ) : null}
      </div>

      <div className="chess-column">
        <Card>
          <div className="chess-stats-grid">
            <div className="chess-stat-row">
              <span className="chess-stat-label">Opponent</span>
              <span className="chess-stat-value">OPPONENT: {activeGame.elo} ELO</span>
            </div>
            <div className="chess-stat-row">
              <span className="chess-stat-label">Captured By White</span>
              <span className="chess-stat-value">{captured.whiteCaptured || 'NONE'}</span>
            </div>
            <div className="chess-stat-row">
              <span className="chess-stat-label">Captured By Black</span>
              <span className="chess-stat-value">{captured.blackCaptured || 'NONE'}</span>
            </div>
          </div>
        </Card>

        <Card className="chess-move-card">
          <div className="chess-chart-title">MOVE HISTORY</div>
          <div className="chess-move-history">
            {reviewRows.length > 0 ? (
              reviewRows.map((row) => (
                <div key={`${row.moveNumber}-${row.white}-${row.black}`} className="chess-move-row">
                  <span className="chess-move-number">{row.moveNumber}.</span>
                  <span
                    className={viewIndex === row.whiteIndex + 1 ? 'chess-move-active' : undefined}
                  >
                    {row.white}
                  </span>
                  <span
                    className={viewIndex === row.blackIndex + 1 ? 'chess-move-active' : undefined}
                  >
                    {row.black}
                  </span>
                </div>
              ))
            ) : (
              <div className="chess-period">NO MOVES YET</div>
            )}
          </div>
          <div className="chess-review-controls">
            <Button variant="ghost" onClick={() => setViewIndex(0)} disabled={viewIndex === 0}>
              |&lt;
            </Button>
            <Button
              variant="ghost"
              onClick={() => setViewIndex((previous) => Math.max(0, previous - 1))}
              disabled={viewIndex === 0}
            >
              &lt;
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                setViewIndex((previous) => Math.min(moveHistory.length, previous + 1))
              }
              disabled={viewIndex === moveHistory.length}
            >
              &gt;
            </Button>
            <Button
              variant="ghost"
              onClick={() => setViewIndex(moveHistory.length)}
              disabled={viewIndex === moveHistory.length}
            >
              &gt;|
            </Button>
          </div>
        </Card>

        <Card className="chess-control-card">
          <Button variant="ghost" onClick={resign} disabled={Boolean(resultText)}>
            Resign
          </Button>
          <Button onClick={newGame}>New Game</Button>
        </Card>
      </div>
    </div>
  );
}
