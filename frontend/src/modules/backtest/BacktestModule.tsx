import { useMemo, useState } from "react";
import { Badge } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { LineChart } from "../../shared/components/LineChart";
import {
  generatePrices,
  optimizeOnTrain,
  runBacktest,
  type OptimizeResult,
} from "./backtestEngine";
import "./backtest.css";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fix = (v: number, d = 2) => v.toFixed(d);

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
    <div className="bt-field">
      <div className="bt-field-head">
        <span>{label}</span>
        <span className="bt-field-value">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        className="bt-range"
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

export default function BacktestModule() {
  const [days, setDays] = useState(1000);
  const [drift, setDrift] = useState(0.08);
  const [vol, setVol] = useState(0.2);
  const [seed, setSeed] = useState(42);
  const [fastW, setFastW] = useState(10);
  const [slowW, setSlowW] = useState(50);
  const [optimized, setOptimized] = useState<OptimizeResult | null>(null);

  const prices = useMemo(
    () => generatePrices(days, drift, vol, seed),
    [days, drift, vol, seed],
  );
  const splitIdx = Math.floor(prices.length * 0.6);

  const train = useMemo(
    () => runBacktest(prices, fastW, slowW, 0, splitIdx),
    [prices, fastW, slowW, splitIdx],
  );
  const test = useMemo(
    () => runBacktest(prices, fastW, slowW, splitIdx, prices.length),
    [prices, fastW, slowW, splitIdx],
  );
  const full = useMemo(
    () => runBacktest(prices, fastW, slowW),
    [prices, fastW, slowW],
  );

  const optimize = () => {
    const result = optimizeOnTrain(prices, splitIdx);
    setOptimized(result);
    setFastW(result.bestFast);
    setSlowW(result.bestSlow);
  };

  return (
    <div className="bt-module">
      <Card className="bt-card">
        <div className="bt-grid">
          <div className="bt-badge-row">
            <Badge label="backtest" />
            <Badge label="systematic lab" />
          </div>
          <h1 className="bt-title">Backtesting Lab</h1>
          <p className="bt-subtle">
            A long/flat moving-average crossover on synthetic GBM price data,
            with a strict time-ordered train/test split. Position is decided on
            each day's close and earns the <em>next</em> day's return — the
            one-bar lag that kills lookahead bias. Maps to roadmap Phase 3:
            optimize on train, judge on the held-out test, and learn that the
            test number is the honest one.
          </p>
        </div>
      </Card>

      <div className="bt-layout">
        {/* MARKET */}
        <Card className="bt-card">
          <div className="bt-grid">
            <div className="bt-section-label">Synthetic market</div>
            <SliderField
              label="Trading days"
              value={days}
              min={300}
              max={2500}
              step={100}
              onChange={setDays}
            />
            <SliderField
              label="Annual drift μ"
              value={drift}
              min={-0.1}
              max={0.2}
              step={0.01}
              format={pct}
              onChange={setDrift}
            />
            <SliderField
              label="Annual vol σ"
              value={vol}
              min={0.05}
              max={0.6}
              step={0.01}
              format={pct}
              onChange={setVol}
            />
            <SliderField
              label="Random seed"
              value={seed}
              min={1}
              max={200}
              step={1}
              onChange={setSeed}
            />
            <div className="bt-note">
              Same seed ⇒ same prices ⇒ reproducible backtest.
            </div>
          </div>
        </Card>

        {/* STRATEGY */}
        <Card className="bt-card">
          <div className="bt-grid">
            <div className="bt-section-label">Strategy — MA crossover</div>
            <SliderField
              label="Fast MA window"
              value={fastW}
              min={3}
              max={50}
              step={1}
              onChange={setFastW}
            />
            <SliderField
              label="Slow MA window"
              value={slowW}
              min={fastW + 1}
              max={200}
              step={1}
              onChange={setSlowW}
            />
            <div className="bt-note">
              Long when fast MA &gt; slow MA, flat otherwise.
            </div>
            <Button onClick={optimize}>Auto-optimize windows on TRAIN</Button>
            {optimized && (
              <div className="bt-optim">
                <div>
                  Best on train: fast={optimized.bestFast}, slow=
                  {optimized.bestSlow}
                </div>
                <div className="bt-optim-warn">
                  Train Sharpe {fix(optimized.trainSharpe)} → Test Sharpe{" "}
                  {fix(optimized.testSharpe)}
                  {optimized.testSharpe < optimized.trainSharpe
                    ? " — that drop is overfitting. The test number is the real one."
                    : ""}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* METRICS */}
      <Card className="bt-card">
        <div className="bt-grid">
          <div className="bt-section-label">
            Results — train vs out-of-sample test
          </div>
          <table className="bt-metrics">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Train (first 60%)</th>
                <th>Test (held-out 40%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total return</td>
                <td>{pct(train.totalReturn)}</td>
                <td>{pct(test.totalReturn)}</td>
              </tr>
              <tr>
                <td>Sharpe (annualized)</td>
                <td>{fix(train.sharpe)}</td>
                <td>{fix(test.sharpe)}</td>
              </tr>
              <tr>
                <td>Max drawdown</td>
                <td>{pct(train.maxDrawdown)}</td>
                <td>{pct(test.maxDrawdown)}</td>
              </tr>
              <tr>
                <td>Turnover</td>
                <td>{pct(train.turnover)}</td>
                <td>{pct(test.turnover)}</td>
              </tr>
              <tr>
                <td>Market exposure</td>
                <td>{pct(train.exposure)}</td>
                <td>{pct(test.exposure)}</td>
              </tr>
            </tbody>
          </table>
          <div className="bt-note">
            Buy &amp; hold over the full window returned{" "}
            {pct(full.buyHoldReturn)}. A strategy that can't beat buy-and-hold
            out-of-sample, after costs, has no edge.
          </div>
        </div>
      </Card>

      {/* EQUITY CURVE */}
      <Card className="bt-card">
        <div className="bt-grid">
          <div className="bt-section-label">
            Equity curve — strategy (full series, $1 start)
          </div>
          <LineChart data={full.equity} xLabel="day" yLabel="equity" />
          <div className="bt-note">
            Train/test boundary at day {prices[splitIdx] ? splitIdx : "—"}. If
            the curve looks beautiful only on the left half, you fit the past,
            not the future.
          </div>
        </div>
      </Card>
    </div>
  );
}
