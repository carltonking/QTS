import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { LineChart } from "../../shared/components/LineChart";
import { renderLatex } from "../quant/latex";
import {
  bsGreeks,
  impliedVol,
  monteCarloConvergence,
  payoffCurve,
  type MonteCarloPoint,
  type OptionType,
} from "./optionsEngine";
import "./options.css";

interface SliderFieldProps {
  label: string;
  symbol: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderField({
  label,
  symbol,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="opt-field">
      <div className="opt-field-head">
        <span className="opt-field-label">
          {label} <span className="opt-sym">{symbol}</span>
        </span>
        <span className="opt-field-value">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        className="opt-range"
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

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const usd = (v: number) => `$${v.toFixed(2)}`;
const num = (v: number, d = 4) => v.toFixed(d);

export default function OptionsModule() {
  const [spot, setSpot] = useState(100);
  const [strike, setStrike] = useState(100);
  const [time, setTime] = useState(0.5);
  const [vol, setVol] = useState(0.2);
  const [rate, setRate] = useState(0.04);
  const [div, setDiv] = useState(0);
  const [type, setType] = useState<OptionType>("CALL");
  const [side, setSide] = useState<1 | -1>(1);
  const [mc, setMc] = useState<MonteCarloPoint[]>([]);
  const [mcRunning, setMcRunning] = useState(false);
  const [ivPrice, setIvPrice] = useState("");

  const inputs = { spot, strike, time, vol, rate, div, type };
  const greeks = useMemo(
    () => bsGreeks(inputs),
    [spot, strike, time, vol, rate, div, type],
  );

  const payoff = useMemo(
    () => payoffCurve(type, strike, greeks.price, side, spot),
    [type, strike, greeks.price, side, spot],
  );

  const iv = useMemo(() => {
    const target = Number(ivPrice);
    if (!ivPrice || Number.isNaN(target) || target <= 0) return null;
    return impliedVol(target, { spot, strike, time, rate, div, type });
  }, [ivPrice, spot, strike, time, rate, div, type]);

  const runMonteCarlo = () => {
    setMcRunning(true);
    // Defer so the button can show its busy state before the synchronous sim.
    setTimeout(() => {
      setMc(monteCarloConvergence(inputs, 50000));
      setMcRunning(false);
    }, 10);
  };

  const mcFinal = mc.length ? mc[mc.length - 1].y : null;

  return (
    <div className="opt-module">
      <Card className="opt-card">
        <div className="opt-grid">
          <div className="opt-badge-row">
            <Badge label="options" />
            <Badge label="pricing lab" />
          </div>
          <h1 className="opt-title">Options Pricing Playground</h1>
          <p className="opt-subtle">
            Black-Scholes-Merton pricing, live Greeks, payoff diagrams, and
            Monte Carlo convergence. Move the inputs and watch every number
            react. Maps to roadmap Phase 6 (Hull: BSM + the Greeks; Monte Carlo
            of GBM).
          </p>
        </div>
      </Card>

      <div className="opt-layout">
        {/* INPUTS */}
        <Card className="opt-card">
          <div className="opt-grid">
            <div className="opt-section-label">Inputs</div>
            <div className="opt-toggle-row">
              <button
                type="button"
                className={`opt-toggle${type === "CALL" ? " opt-toggle-on" : ""}`}
                onClick={() => setType("CALL")}
              >
                CALL
              </button>
              <button
                type="button"
                className={`opt-toggle${type === "PUT" ? " opt-toggle-on" : ""}`}
                onClick={() => setType("PUT")}
              >
                PUT
              </button>
              <button
                type="button"
                className={`opt-toggle${side === 1 ? " opt-toggle-on" : ""}`}
                onClick={() => setSide(1)}
              >
                LONG
              </button>
              <button
                type="button"
                className={`opt-toggle${side === -1 ? " opt-toggle-on" : ""}`}
                onClick={() => setSide(-1)}
              >
                SHORT
              </button>
            </div>

            <SliderField
              label="Spot"
              symbol="S"
              value={spot}
              min={1}
              max={300}
              step={1}
              format={usd}
              onChange={setSpot}
            />
            <SliderField
              label="Strike"
              symbol="K"
              value={strike}
              min={1}
              max={300}
              step={1}
              format={usd}
              onChange={setStrike}
            />
            <SliderField
              label="Time to expiry"
              symbol="T"
              value={time}
              min={0.01}
              max={3}
              step={0.01}
              format={(v) => `${v.toFixed(2)}y`}
              onChange={setTime}
            />
            <SliderField
              label="Volatility"
              symbol="σ"
              value={vol}
              min={0.01}
              max={1.5}
              step={0.01}
              format={pct}
              onChange={setVol}
            />
            <SliderField
              label="Risk-free rate"
              symbol="r"
              value={rate}
              min={0}
              max={0.2}
              step={0.005}
              format={pct}
              onChange={setRate}
            />
            <SliderField
              label="Dividend yield"
              symbol="q"
              value={div}
              min={0}
              max={0.1}
              step={0.005}
              format={pct}
              onChange={setDiv}
            />
          </div>
        </Card>

        {/* GREEKS */}
        <Card className="opt-card">
          <div className="opt-grid">
            <div className="opt-section-label">Price & Greeks</div>
            <div className="opt-price">{usd(greeks.price)}</div>
            <div className="opt-subtle">
              theoretical {side === 1 ? "cost" : "credit"} of{" "}
              {side === 1 ? "buying" : "selling"} one {type.toLowerCase()}
            </div>
            <table className="opt-greeks">
              <tbody>
                <tr>
                  <td>Δ Delta</td>
                  <td>{num(greeks.delta)}</td>
                  <td className="opt-greek-note">
                    ∂V/∂S — directional exposure
                  </td>
                </tr>
                <tr>
                  <td>Γ Gamma</td>
                  <td>{num(greeks.gamma)}</td>
                  <td className="opt-greek-note">∂Δ/∂S — convexity</td>
                </tr>
                <tr>
                  <td>ν Vega</td>
                  <td>{num(greeks.vega)}</td>
                  <td className="opt-greek-note">per +1% vol</td>
                </tr>
                <tr>
                  <td>Θ Theta</td>
                  <td>{num(greeks.theta)}</td>
                  <td className="opt-greek-note">per calendar day</td>
                </tr>
                <tr>
                  <td>ρ Rho</td>
                  <td>{num(greeks.rho)}</td>
                  <td className="opt-greek-note">per +1% rate</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* PAYOFF */}
      <Card className="opt-card">
        <div className="opt-grid">
          <div className="opt-section-label">
            Payoff at expiry — P/L vs underlying
          </div>
          <LineChart data={payoff} xLabel="underlying price" yLabel="P/L" />
          <div className="opt-subtle">
            Break-even where the curve crosses zero. Premium (
            {usd(greeks.price)}) is baked in, so a{" "}
            {side === 1 ? "long" : "short"} {type.toLowerCase()}{" "}
            {side === 1 ? "loses" : "keeps"} the premium when it expires
            worthless.
          </div>
        </div>
      </Card>

      {/* MONTE CARLO */}
      <Card className="opt-card">
        <div className="opt-grid">
          <div className="opt-section-label">Monte Carlo convergence</div>
          <p className="opt-subtle">
            Simulate terminal prices under GBM, discount the average payoff, and
            watch the estimate converge to the closed-form value as paths grow
            (error shrinks like 1/√N).
          </p>
          <div>
            <Button onClick={runMonteCarlo} disabled={mcRunning}>
              {mcRunning ? "SIMULATING…" : "Run 50,000 paths"}
            </Button>
          </div>
          {mc.length > 0 && (
            <>
              <LineChart data={mc} xLabel="paths" yLabel="MC price" />
              <div className="opt-mc-compare">
                <span>
                  Monte Carlo: {mcFinal !== null ? usd(mcFinal) : "—"}
                </span>
                <span>Closed-form: {usd(greeks.price)}</span>
                <span>
                  abs error:{" "}
                  {mcFinal !== null
                    ? usd(Math.abs(mcFinal - greeks.price))
                    : "—"}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* IMPLIED VOL */}
      <Card className="opt-card">
        <div className="opt-grid">
          <div className="opt-section-label">Implied volatility solver</div>
          <p className="opt-subtle">
            Enter a market price for this contract; bisection inverts
            Black-Scholes to recover the volatility the market is pricing in.
          </p>
          <div className="opt-iv-row">
            <input
              type="number"
              className="opt-iv-input"
              placeholder="market price, e.g. 6.50"
              value={ivPrice}
              onChange={(e) => setIvPrice(e.target.value)}
              aria-label="market price"
            />
            <span className="opt-iv-result">
              {ivPrice && iv === null
                ? "no solution in [0%, 500%]"
                : iv !== null
                  ? `IV = ${pct(iv)}`
                  : "IV = —"}
            </span>
          </div>
        </div>
      </Card>

      {/* FORMULA */}
      <Card className="opt-card">
        <div className="opt-grid">
          <div className="opt-section-label">The formula you're driving</div>
          <div
            className="opt-formula"
            dangerouslySetInnerHTML={{
              __html: renderLatex(
                "$$C = S e^{-qT} N(d_1) - K e^{-rT} N(d_2), \\quad d_1 = \\frac{\\ln(S/K) + (r - q + \\sigma^2/2)T}{\\sigma\\sqrt{T}}, \\quad d_2 = d_1 - \\sigma\\sqrt{T}$$",
              ),
            }}
          />
          <Link to="/quant">
            <Button variant="ghost">← Quant interview prep</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
