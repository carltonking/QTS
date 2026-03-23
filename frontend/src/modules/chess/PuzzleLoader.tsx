import { Button } from '../../shared/components/Button';

type PuzzleLoaderProps = {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  children: React.ReactNode;
};

export function PuzzleLoader({ loading, error, onRetry, children }: PuzzleLoaderProps) {
  if (loading) {
    return (
      <div className="chess-loader-box">
        <div className="chess-loader-title">LOADING PUZZLE</div>
        <div className="chess-loader-copy">FETCHING LIVE POSITION FROM LICHESS...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chess-loader-box chess-loader-error">
        <div className="chess-loader-title">PUZZLE LOAD FAILED</div>
        <div className="chess-loader-copy">{error}</div>
        <Button onClick={onRetry}>Retry</Button>
      </div>
    );
  }

  return <>{children}</>;
}
