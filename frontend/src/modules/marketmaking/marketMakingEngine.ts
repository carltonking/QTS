// Single-dealer market-making simulator.
// You quote a two-sided market; informed flow picks you off (adverse selection),
// and inventory you carry is exposed to the next price move (inventory risk).
// Tight spread => more fills but more adverse selection; wide spread => safer but
// you earn less. The whole game is balancing those forces. This is the honest
// alternative to a "Market Master" video — you feel the tradeoff, not watch it.

export interface MMControls {
  bidOffset: number; // price below mid where you bid
  askOffset: number; // price above mid where you ask
  quoteSize: number; // size on each side
}

export interface MMParams {
  vol: number; // per-tick mid volatility (price units)
  informed: number; // 0..1 — how strongly order flow predicts the next move
  arrival: number; // 0..1 — base probability an order arrives this tick
  fillScale: number; // price scale controlling how spread suppresses fills
  positionLimit: number; // |inventory| soft cap for the risk meter
}

export interface Fill {
  tick: number;
  side: "SELL" | "BUY"; // your action: SELL = you hit on your ask, BUY = on your bid
  price: number;
  size: number;
}

export interface MMState {
  tick: number;
  mid: number;
  cash: number;
  inventory: number;
  pnl: number; // mark-to-market: cash + inventory*mid
  history: { x: number; y: number }[]; // mid over time
  fills: Fill[];
  lastEvent: string;
}

export function initState(startMid = 100): MMState {
  return {
    tick: 0,
    mid: startMid,
    cash: 0,
    inventory: 0,
    pnl: 0,
    history: [{ x: 0, y: startMid }],
    fills: [],
    lastEvent: "Market open. Set your quotes and step.",
  };
}

function gauss(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const clamp = (x: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, x));

// Advance one tick. Order flow is decided BEFORE the mid moves, but its direction
// is correlated with that move (informed) — so a tight quote gets lifted right
// before price runs against you.
export function step(state: MMState, c: MMControls, p: MMParams): MMState {
  const next = {
    ...state,
    history: [...state.history],
    fills: [...state.fills],
  };
  next.tick += 1;

  const bid = state.mid - c.bidOffset;
  const ask = state.mid + c.askOffset;

  // The (hidden) next move, and a flow direction that leans the same way.
  const delta = p.vol * gauss();
  const lean = clamp((delta / (p.vol || 1e-9)) * 0.5, -1, 1);
  const pBuy = clamp(0.5 + p.informed * lean, 0.05, 0.95);

  let event = "No fill.";
  if (Math.random() < p.arrival) {
    const isBuyOrder = Math.random() < pBuy;
    if (isBuyOrder) {
      // Buyer lifts your ask — you SELL. Tighter ask => more likely to be hit.
      const pFill = Math.exp(-c.askOffset / p.fillScale);
      if (Math.random() < pFill) {
        next.cash += ask * c.quoteSize;
        next.inventory -= c.quoteSize;
        next.fills.push({
          tick: next.tick,
          side: "SELL",
          price: ask,
          size: c.quoteSize,
        });
        event = `Sold ${c.quoteSize} @ ${ask.toFixed(2)} (your ask lifted)`;
      }
    } else {
      // Seller hits your bid — you BUY. Tighter bid => more likely to be hit.
      const pFill = Math.exp(-c.bidOffset / p.fillScale);
      if (Math.random() < pFill) {
        next.cash -= bid * c.quoteSize;
        next.inventory += c.quoteSize;
        next.fills.push({
          tick: next.tick,
          side: "BUY",
          price: bid,
          size: c.quoteSize,
        });
        event = `Bought ${c.quoteSize} @ ${bid.toFixed(2)} (your bid hit)`;
      }
    }
  }

  next.mid = Math.max(0.01, state.mid + delta);
  next.pnl = next.cash + next.inventory * next.mid;
  next.history.push({ x: next.tick, y: Number(next.mid.toFixed(2)) });
  if (next.history.length > 200) next.history.shift();
  if (next.fills.length > 50) next.fills.shift();
  next.lastEvent = event;
  return next;
}
