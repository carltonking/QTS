import { useEffect, useRef, useState } from "react";
import { Badge } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { LineChart } from "../../shared/components/LineChart";
import { useLocalStorage } from "../../shared/hooks/useLocalStorage";
import { STORAGE_KEYS } from "../../shared/constants";
import {
  initState,
  step,
  type MMControls,
  type MMParams,
  type MMState,
} from "./marketMakingEngine";
import "./marketmaking.css";

const DEFAULT_PARAMS: MMParams = {
  vol: 0.15,
  informed: 0.6,
  arrival: 0.75,
  fillScale: 0.6,
  positionLimit: 20,
};

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="mm-field">
      <div className="mm-field-head">
        <span>{label}</span>
        <span className="mm-field-value">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        className="mm-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}

const usd = (v: number) => `${v < 0 ? "-" : ""}$${Math.abs(v).toFixed(2)}`;

export default function MarketMakingModule() {
  const [state, setState] = useState<MMState>(() => initState());
  const [running, setRunning] = useState(false);
  const [controls, setControls] = useState<MMControls>({
    bidOffset: 0.5,
    askOffset: 0.5,
    quoteSize: 1,
  });
  const [params, setParams] = useState<MMParams>(DEFAULT_PARAMS);
  const [bestPnl, setBestPnl] = useLocalStorage<number>(
    STORAGE_KEYS.MM_BEST_PNL,
    0,
  );

  const controlsRef = useRef(controls);
  const paramsRef = useRef(params);
  controlsRef.current = controls;
  paramsRef.current = params;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setState((s) => step(s, controlsRef.current, paramsRef.current));
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (state.pnl > bestPnl) setBestPnl(Number(state.pnl.toFixed(2)));
  }, [state.pnl, bestPnl, setBestPnl]);

  const reset = () => {
    setRunning(false);
    setState(initState());
  };

  const bid = state.mid - controls.bidOffset;
  const ask = state.mid + controls.askOffset;
  const spread = controls.bidOffset + controls.askOffset;
  const invPct = Math.min(
    100,
    (Math.abs(state.inventory) / params.positionLimit) * 100,
  );

  return (
    <div className="mm-module">
      <Card className="mm-card">
        <div className="mm-grid">
          <div className="mm-badge-row">
            <Badge label="market making" />
            <Badge label="trading sim" />
          </div>
          <h1 className="mm-title">Market-Making Simulator</h1>
          <p className="mm-subtle">
            Quote a two-sided market and capture the spread — but informed flow
            lifts your ask right before price rises and hits your bid right
            before it falls (adverse selection), and the inventory you carry is
            exposed to the next move (inventory risk). Tighten the spread for
            more fills, widen it for safety. Find the edge.
          </p>
        </div>
      </Card>

      {/* LIVE TAPE */}
      <Card className="mm-card">
        <div className="mm-tape">
          <div className="mm-quote mm-bid">
            <span className="mm-quote-label">YOUR BID</span>
            <span className="mm-quote-price">{usd(bid)}</span>
          </div>
          <div className="mm-mid">
            <span className="mm-quote-label">MID · t={state.tick}</span>
            <span className="mm-mid-price">{usd(state.mid)}</span>
            <span className="mm-spread">spread {spread.toFixed(2)}</span>
          </div>
          <div className="mm-quote mm-ask">
            <span className="mm-quote-label">YOUR ASK</span>
            <span className="mm-quote-price">{usd(ask)}</span>
          </div>
        </div>
        <div className="mm-event">{state.lastEvent}</div>
      </Card>

      {/* STATS */}
      <Card className="mm-card">
        <div className="mm-stats">
          <div className="mm-stat">
            <span className="mm-stat-label">P&L (mark-to-market)</span>
            <span
              className={`mm-stat-value ${state.pnl >= 0 ? "mm-pos" : "mm-neg"}`}
            >
              {usd(state.pnl)}
            </span>
          </div>
          <div className="mm-stat">
            <span className="mm-stat-label">Inventory</span>
            <span className="mm-stat-value">{state.inventory}</span>
          </div>
          <div className="mm-stat">
            <span className="mm-stat-label">Cash</span>
            <span className="mm-stat-value">{usd(state.cash)}</span>
          </div>
          <div className="mm-stat">
            <span className="mm-stat-label">Best P&L</span>
            <span className="mm-stat-value">{usd(bestPnl)}</span>
          </div>
        </div>
        <div className="mm-risk">
          <div className="mm-risk-head">
            <span>Inventory risk</span>
            <span>
              {state.inventory} / ±{params.positionLimit}
            </span>
          </div>
          <div className="mm-risk-bar">
            <div
              className={`mm-risk-fill ${invPct > 75 ? "mm-risk-hot" : ""}`}
              style={{ width: `${invPct}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="mm-layout">
        {/* CONTROLS */}
        <Card className="mm-card">
          <div className="mm-grid">
            <div className="mm-section-label">Your quotes</div>
            <SliderField
              label="Bid offset (below mid)"
              value={controls.bidOffset}
              min={0.05}
              max={3}
              step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(v) => setControls((c) => ({ ...c, bidOffset: v }))}
            />
            <SliderField
              label="Ask offset (above mid)"
              value={controls.askOffset}
              min={0.05}
              max={3}
              step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(v) => setControls((c) => ({ ...c, askOffset: v }))}
            />
            <SliderField
              label="Quote size"
              value={controls.quoteSize}
              min={1}
              max={10}
              step={1}
              onChange={(v) => setControls((c) => ({ ...c, quoteSize: v }))}
            />

            <div className="mm-section-label">Market conditions</div>
            <SliderField
              label="Volatility (per tick)"
              value={params.vol}
              min={0.05}
              max={0.5}
              step={0.01}
              format={(v) => v.toFixed(2)}
              onChange={(v) => setParams((p) => ({ ...p, vol: v }))}
            />
            <SliderField
              label="Adverse selection"
              value={params.informed}
              min={0}
              max={1}
              step={0.05}
              format={(v) => `${(v * 100).toFixed(0)}%`}
              onChange={(v) => setParams((p) => ({ ...p, informed: v }))}
            />
            <SliderField
              label="Order arrival rate"
              value={params.arrival}
              min={0.1}
              max={1}
              step={0.05}
              format={(v) => `${(v * 100).toFixed(0)}%`}
              onChange={(v) => setParams((p) => ({ ...p, arrival: v }))}
            />

            <div className="mm-button-row">
              <Button onClick={() => setRunning((r) => !r)}>
                {running ? "PAUSE" : "RUN"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setState((s) => step(s, controls, params))}
                disabled={running}
              >
                STEP
              </Button>
              <Button variant="ghost" onClick={reset}>
                RESET
              </Button>
            </div>
          </div>
        </Card>

        {/* CHART + FILLS */}
        <Card className="mm-card">
          <div className="mm-grid">
            <div className="mm-section-label">Mid price tape</div>
            <LineChart data={state.history} xLabel="tick" yLabel="mid" />
            <div className="mm-section-label">Recent fills</div>
            <div className="mm-fills">
              {state.fills.length === 0 ? (
                <div className="mm-empty">No fills yet.</div>
              ) : (
                [...state.fills]
                  .reverse()
                  .slice(0, 10)
                  .map((f, i) => (
                    <div key={`${f.tick}-${i}`} className="mm-fill-row">
                      <span className={f.side === "BUY" ? "mm-pos" : "mm-neg"}>
                        {f.side}
                      </span>
                      <span>{f.size}</span>
                      <span>@ {usd(f.price)}</span>
                      <span className="mm-fill-tick">t={f.tick}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
