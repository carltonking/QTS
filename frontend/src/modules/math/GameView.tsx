import { useEffect, useRef, useState } from 'react';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import type { Problem } from './types';

type GameViewProps = {
  problem: Problem;
  secondsLeft: number;
  correct: number;
  incorrect: number;
  streak: number;
  onSubmitAnswer: (answer: number | null) => { correct: boolean; expected: number };
};

type FeedbackState = '' | 'solid' | 'dashed';

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.max(0, totalSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export function GameView({
  problem,
  secondsLeft,
  correct,
  incorrect,
  streak,
  onSubmitAnswer,
}: GameViewProps) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsResolving(false);
    inputRef.current?.focus();
  }, [problem]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = () => {
    if (isResolving || secondsLeft <= 0) {
      return;
    }

    const parsed =
      answer.trim() === '' || Number.isNaN(Number(answer.trim())) ? null : Number(answer.trim());
    const result = onSubmitAnswer(parsed);
    setIsResolving(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    if (result.correct) {
      setFeedback('solid');
      setFeedbackText('');
      setAnswer('');
      timeoutRef.current = window.setTimeout(() => {
        setFeedback('');
      }, 200);
      return;
    }

    setFeedback('dashed');
    setFeedbackText(`ANSWER: ${result.expected}`);
    timeoutRef.current = window.setTimeout(() => {
      setFeedback('');
      setFeedbackText('');
      setAnswer('');
    }, 1000);
  };

  return (
    <div className="math-game">
      <div className="math-topbar">
        <div className="math-topbar-item">
          <div className="math-topbar-label">Timer</div>
          <div className="math-topbar-value">{formatCountdown(secondsLeft)}</div>
        </div>
        <div className="math-topbar-item">
          <div className="math-topbar-label">Score</div>
          <div className="math-topbar-value">
            {correct} CORRECT&nbsp;&nbsp;{incorrect} WRONG
          </div>
        </div>
        <div className="math-topbar-item">
          <div className="math-topbar-label">Streak</div>
          <div className="math-topbar-value">STREAK: {streak}</div>
        </div>
      </div>

      <div className="math-problem-shell">
        <div className="math-problem">{problem.display}</div>
        <Input
          ref={inputRef}
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSubmit();
            }
          }}
          inputMode="numeric"
          autoComplete="off"
          disabled={secondsLeft <= 0}
          className={`math-answer-input${
            feedback === 'solid'
              ? ' math-answer-solid'
              : feedback === 'dashed'
                ? ' math-answer-dashed'
                : ''
          }`}
        />
        <Button onClick={handleSubmit} disabled={secondsLeft <= 0 || isResolving}>
          Submit
        </Button>
        <div className="math-answer-feedback">{feedbackText}</div>
      </div>
    </div>
  );
}
