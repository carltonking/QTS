const STOCKFISH_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';

function createWorkerBlobUrl(): string {
  const script = `importScripts("${STOCKFISH_URL}");`;
  return URL.createObjectURL(new Blob([script], { type: 'application/javascript' }));
}

export class StockfishEngine {
  private worker: Worker | null = null;

  private workerUrl: string | null = null;

  private initialized = false;

  private bestMoveResolver: ((move: string) => void) | null = null;

  private readyResolver: (() => void) | null = null;

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.workerUrl = createWorkerBlobUrl();
    this.worker = new Worker(this.workerUrl);

    this.worker.onmessage = (event: MessageEvent<string>) => {
      const line = String(event.data ?? '');

      if (line.includes('readyok') && this.readyResolver) {
        const resolve = this.readyResolver;
        this.readyResolver = null;
        resolve();
      }

      if (line.startsWith('bestmove ') && this.bestMoveResolver) {
        const move = line.split(' ')[1];
        const resolve = this.bestMoveResolver;
        this.bestMoveResolver = null;
        resolve(move);
      }
    };

    this.send('uci');
    await this.waitUntilReady();
    this.initialized = true;
  }

  async getBestMove(fen: string, elo: number): Promise<string> {
    await this.init();

    const boundedElo = Math.max(400, Math.min(3000, Math.round(elo)));
    const skillLevel = Math.max(0, Math.min(20, Math.round((boundedElo - 400) / 130)));

    this.send(`setoption name Skill Level value ${skillLevel}`);
    this.send('setoption name UCI_LimitStrength value true');
    this.send(`setoption name UCI_Elo value ${boundedElo}`);
    this.send('ucinewgame');
    await this.waitUntilReady();
    this.send(`position fen ${fen}`);
    this.send('go movetime 1000');

    return new Promise<string>((resolve) => {
      this.bestMoveResolver = resolve;
    });
  }

  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.initialized = false;
    this.bestMoveResolver = null;
    this.readyResolver = null;

    if (this.workerUrl) {
      URL.revokeObjectURL(this.workerUrl);
      this.workerUrl = null;
    }
  }

  private waitUntilReady(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.readyResolver = resolve;
      this.send('isready');
    });
  }

  private send(command: string): void {
    this.worker?.postMessage(command);
  }
}
