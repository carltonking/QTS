// Black-Scholes-Merton option pricing, Greeks, Monte Carlo, implied vol, payoff.
// All pure functions — no I/O, no state. Maps to roadmap Phase 6 / Stage 4 (Hull: BSM, the Greeks).

export type OptionType = "CALL" | "PUT";

export interface BSInputs {
  spot: number; // S  — underlying price
  strike: number; // K  — strike price
  time: number; // T  — years to expiry
  vol: number; // sigma — annualized volatility (decimal, e.g. 0.2)
  rate: number; // r  — risk-free rate (decimal)
  div: number; // q  — continuous dividend yield (decimal)
  type: OptionType;
}

export interface Greeks {
  price: number;
  delta: number;
  gamma: number;
  vega: number; // per 1% vol move
  theta: number; // per calendar day
  rho: number; // per 1% rate move
}

// Standard normal PDF.
export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// erf via Abramowitz & Stegun 7.1.26 (|error| < 1.5e-7).
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

// Standard normal CDF.
export function normCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function d1d2({
  spot,
  strike,
  time,
  vol,
  rate,
  div,
}: BSInputs): [number, number] {
  const denom = vol * Math.sqrt(time);
  const d1 =
    (Math.log(spot / strike) + (rate - div + 0.5 * vol * vol) * time) / denom;
  const d2 = d1 - denom;
  return [d1, d2];
}

// Closed-form Black-Scholes-Merton price.
export function bsPrice(inputs: BSInputs): number {
  const { spot, strike, time, rate, div, type } = inputs;
  if (time <= 0 || inputs.vol <= 0) {
    // Degenerate: return intrinsic value.
    const intrinsic = type === "CALL" ? spot - strike : strike - spot;
    return Math.max(0, intrinsic);
  }
  const [d1, d2] = d1d2(inputs);
  const dfDiv = Math.exp(-div * time);
  const dfRate = Math.exp(-rate * time);
  if (type === "CALL") {
    return spot * dfDiv * normCdf(d1) - strike * dfRate * normCdf(d2);
  }
  return strike * dfRate * normCdf(-d2) - spot * dfDiv * normCdf(-d1);
}

// Closed-form price plus the primary Greeks.
export function bsGreeks(inputs: BSInputs): Greeks {
  const { spot, strike, time, vol, rate, div, type } = inputs;
  const price = bsPrice(inputs);
  if (time <= 0 || vol <= 0) {
    return { price, delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  }
  const [d1, d2] = d1d2(inputs);
  const dfDiv = Math.exp(-div * time);
  const dfRate = Math.exp(-rate * time);
  const pdfD1 = normPdf(d1);
  const sqrtT = Math.sqrt(time);

  const gamma = (dfDiv * pdfD1) / (spot * vol * sqrtT);
  const vega = spot * dfDiv * pdfD1 * sqrtT; // per 1.0 vol

  let delta: number;
  let theta: number;
  let rho: number;
  if (type === "CALL") {
    delta = dfDiv * normCdf(d1);
    theta =
      (-spot * dfDiv * pdfD1 * vol) / (2 * sqrtT) -
      rate * strike * dfRate * normCdf(d2) +
      div * spot * dfDiv * normCdf(d1);
    rho = strike * time * dfRate * normCdf(d2);
  } else {
    delta = dfDiv * (normCdf(d1) - 1);
    theta =
      (-spot * dfDiv * pdfD1 * vol) / (2 * sqrtT) +
      rate * strike * dfRate * normCdf(-d2) -
      div * spot * dfDiv * normCdf(-d1);
    rho = -strike * time * dfRate * normCdf(-d2);
  }

  return {
    price,
    delta,
    gamma,
    vega: vega / 100, // per 1% vol move
    theta: theta / 365, // per calendar day
    rho: rho / 100, // per 1% rate move
  };
}

// Box-Muller standard normal sample.
function sampleNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface MonteCarloPoint {
  x: number; // number of paths simulated
  y: number; // running MC price estimate
}

// Monte Carlo price of a European option under geometric Brownian motion,
// returning the running estimate at log-spaced sample counts so the UI can
// plot convergence toward the closed-form value (~1/sqrt(N) error).
export function monteCarloConvergence(
  inputs: BSInputs,
  maxPaths = 50000,
): MonteCarloPoint[] {
  const { spot, strike, time, vol, rate, div, type } = inputs;
  const drift = (rate - div - 0.5 * vol * vol) * time;
  const diffusion = vol * Math.sqrt(time);
  const discount = Math.exp(-rate * time);

  const checkpoints = new Set<number>();
  for (let n = 100; n <= maxPaths; n = Math.floor(n * 1.4)) checkpoints.add(n);
  checkpoints.add(maxPaths);

  const points: MonteCarloPoint[] = [];
  let payoffSum = 0;
  for (let i = 1; i <= maxPaths; i++) {
    const terminal = spot * Math.exp(drift + diffusion * sampleNormal());
    const payoff =
      type === "CALL"
        ? Math.max(0, terminal - strike)
        : Math.max(0, strike - terminal);
    payoffSum += payoff;
    if (checkpoints.has(i)) {
      points.push({ x: i, y: discount * (payoffSum / i) });
    }
  }
  return points;
}

// Implied volatility via bisection (robust, no derivative needed).
export function impliedVol(
  marketPrice: number,
  inputs: Omit<BSInputs, "vol">,
  tol = 1e-6,
  maxIter = 100,
): number | null {
  let lo = 1e-4;
  let hi = 5; // 500% vol upper bound
  const priceAt = (v: number) => bsPrice({ ...inputs, vol: v });
  if (marketPrice < priceAt(lo) || marketPrice > priceAt(hi)) return null;
  for (let i = 0; i < maxIter; i++) {
    const mid = 0.5 * (lo + hi);
    const diff = priceAt(mid) - marketPrice;
    if (Math.abs(diff) < tol) return mid;
    if (diff > 0) hi = mid;
    else lo = mid;
  }
  return 0.5 * (lo + hi);
}

export interface PayoffPoint {
  x: number; // underlying price at expiry
  y: number; // P/L of the position
}

// P/L at expiry for a single-leg position, net of the premium paid/received.
// side = +1 long, -1 short.
export function payoffCurve(
  type: OptionType,
  strike: number,
  premium: number,
  side: 1 | -1,
  spotCenter: number,
  points = 80,
): PayoffPoint[] {
  const lo = Math.max(0.01, spotCenter * 0.4);
  const hi = spotCenter * 1.6;
  const step = (hi - lo) / (points - 1);
  const curve: PayoffPoint[] = [];
  for (let i = 0; i < points; i++) {
    const s = lo + i * step;
    const intrinsic =
      type === "CALL" ? Math.max(0, s - strike) : Math.max(0, strike - s);
    const pnl = side * (intrinsic - premium);
    curve.push({ x: Number(s.toFixed(2)), y: Number(pnl.toFixed(2)) });
  }
  return curve;
}
