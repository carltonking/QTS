// Backtesting engine for a long/flat moving-average crossover.
// Deliberately teaches the roadmap Phase 3 lesson: no lookahead bias, and the
// gap between train (optimized) and test (held-out) performance = overfitting.
// All deterministic given a seed — one run, same result every time.

// Seeded PRNG (mulberry32) so backtests are reproducible.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function boxMuller(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Generate a synthetic daily price series via geometric Brownian motion.
export function generatePrices(
  days: number,
  annualDrift: number,
  annualVol: number,
  seed: number,
  start = 100,
): number[] {
  const rng = mulberry32(seed);
  const dt = 1 / 252;
  const drift = (annualDrift - 0.5 * annualVol * annualVol) * dt;
  const diffusion = annualVol * Math.sqrt(dt);
  const prices = [start];
  for (let i = 1; i < days; i++) {
    const prev = prices[i - 1];
    prices.push(prev * Math.exp(drift + diffusion * boxMuller(rng)));
  }
  return prices;
}

function sma(prices: number[], window: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < prices.length; i++) {
    sum += prices[i];
    if (i >= window) sum -= prices[i - window];
    out.push(i >= window - 1 ? sum / window : null);
  }
  return out;
}

export interface BacktestResult {
  equity: { x: number; y: number }[]; // strategy equity curve (start = 1)
  buyHold: { x: number; y: number }[]; // benchmark
  totalReturn: number; // strategy, fraction
  buyHoldReturn: number;
  sharpe: number; // annualized
  maxDrawdown: number; // fraction, positive number
  turnover: number; // position changes / periods
  exposure: number; // fraction of time in the market
}

// Run a long/flat MA-crossover backtest over prices[startIdx..endIdx).
// Position is decided on the close of day t (fast>slow → long) and earns the
// day t→t+1 return — the one-bar lag that prevents lookahead bias.
export function runBacktest(
  prices: number[],
  fastWindow: number,
  slowWindow: number,
  startIdx = 0,
  endIdx = prices.length,
): BacktestResult {
  const fast = sma(prices, fastWindow);
  const slow = sma(prices, slowWindow);

  const equity: { x: number; y: number }[] = [];
  const buyHold: { x: number; y: number }[] = [];
  const stratReturns: number[] = [];

  let eq = 1;
  let bh = 1;
  let prevPos = 0;
  let positionChanges = 0;
  let daysInMarket = 0;
  let periods = 0;
  let peak = 1;
  let maxDd = 0;

  for (let i = startIdx; i < endIdx - 1; i++) {
    const f = fast[i];
    const s = slow[i];
    if (f === null || s === null) continue;

    const pos = f > s ? 1 : 0; // decision uses info available at close of day i
    if (pos !== prevPos) positionChanges++;
    prevPos = pos;
    daysInMarket += pos;
    periods++;

    const assetRet = prices[i + 1] / prices[i] - 1; // return earned over i -> i+1
    const stratRet = pos * assetRet;
    stratReturns.push(stratRet);

    eq *= 1 + stratRet;
    bh *= 1 + assetRet;
    equity.push({ x: i, y: Number(eq.toFixed(4)) });
    buyHold.push({ x: i, y: Number(bh.toFixed(4)) });

    if (eq > peak) peak = eq;
    const dd = (peak - eq) / peak;
    if (dd > maxDd) maxDd = dd;
  }

  const n = stratReturns.length || 1;
  const mean = stratReturns.reduce((a, b) => a + b, 0) / n;
  const variance = stratReturns.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance) || 1e-12;
  const sharpe = (mean / std) * Math.sqrt(252);

  return {
    equity,
    buyHold,
    totalReturn: eq - 1,
    buyHoldReturn: bh - 1,
    sharpe,
    maxDrawdown: maxDd,
    turnover: positionChanges / (periods || 1),
    exposure: daysInMarket / (periods || 1),
  };
}

export interface OptimizeResult {
  bestFast: number;
  bestSlow: number;
  trainSharpe: number;
  testSharpe: number; // out-of-sample Sharpe at the SAME windows — the honest number
}

// Grid-search MA windows to maximize Sharpe on the TRAIN segment only,
// then report that same pair's Sharpe on the held-out TEST segment.
// The train→test Sharpe drop is the overfitting lesson made visible.
export function optimizeOnTrain(
  prices: number[],
  splitIdx: number,
): OptimizeResult {
  let best = { fast: 5, slow: 20, sharpe: -Infinity };
  for (let fast = 3; fast <= 30; fast += 1) {
    for (let slow = fast + 5; slow <= 100; slow += 5) {
      const r = runBacktest(prices, fast, slow, 0, splitIdx);
      if (Number.isFinite(r.sharpe) && r.sharpe > best.sharpe) {
        best = { fast, slow, sharpe: r.sharpe };
      }
    }
  }
  const test = runBacktest(
    prices,
    best.fast,
    best.slow,
    splitIdx,
    prices.length,
  );
  return {
    bestFast: best.fast,
    bestSlow: best.slow,
    trainSharpe: best.sharpe,
    testSharpe: test.sharpe,
  };
}
