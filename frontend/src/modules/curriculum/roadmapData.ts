// The 36-month quant self-study roadmap, encoded as gated phases.
// Source: QUANT_ROADMAP.md. Progression is gate-driven: you advance a phase only
// when every checkpoint item can be done unaided, from a blank file.

export interface Checkpoint {
  id: string; // stable id for localStorage progress tracking
  text: string;
}

export interface Phase {
  id: string;
  title: string;
  months: string;
  focus: string;
  split: string;
  deliverables: string[];
  flagship: string;
  checkpoints: Checkpoint[];
}

export const PHASES: Phase[] = [
  {
    id: "p1",
    title: "Foundations — write code, write proofs",
    months: "Months 0–3",
    focus:
      "Get fluent enough in Python to make the computer do small things without fear, and start turning intuition into a proof. No finance yet.",
    split: "Programming 50% · Math 35% · Finance theory 5% · Projects 10%",
    deliverables: [
      "Python Crash Course Part I (Ch. 1–11): variables, lists, dicts, control flow, functions, classes, files, testing",
      "MIT 6.0001 (OCW) lectures 1–6 + first 3 problem sets",
      "How to Prove It (Velleman) Ch. 1–3: logic, quantifiers, direct/contrapositive/contradiction proofs",
      "3Blue1Brown — Essence of Calculus (full playlist)",
      "Light read: Blyth Ch. 1",
    ],
    flagship:
      "Clean and plot a stock-price CSV with plain Python first (no pandas), then matplotlib.",
    checkpoints: [
      {
        id: "p1c1",
        text: "Write a Python function with a loop + conditional, and a second that calls it — no reference",
      },
      {
        id: "p1c2",
        text: "Read a CSV, compute a column mean, plot it, explaining each line",
      },
      {
        id: "p1c3",
        text: "Define a class with one method and explain what self is",
      },
      {
        id: "p1c4",
        text: "Prove the sum of two even integers is even; state contrapositive vs contradiction",
      },
      {
        id: "p1c5",
        text: "Explain in one jargon-free sentence what a derivative measures",
      },
    ],
  },
  {
    id: "p2",
    title: "Linear algebra + pandas (the two workhorses)",
    months: "Months 3–6",
    focus:
      "Linear algebra is the language of every model. In parallel, graduate from raw Python to pandas.",
    split:
      "Math (LA) 40% · Programming (pandas/numpy) 35% · Finance theory 10% · Projects 15%",
    deliverables: [
      "Interactive Linear Algebra (Margalit) Ch. 1–4 + Strang Ch. 1–3 as deeper reference",
      "3Blue1Brown — Essence of Linear Algebra (before each Margalit chapter)",
      "Python for Data Analysis (McKinney) Ch. 4–8: numpy, pandas Series/DataFrame, indexing, groupby, time series",
      "How to Prove It Ch. 4 (relations), ~1 hr/week",
    ],
    flagship:
      "Returns, volatility, and Sharpe — by hand (numpy matrix you write) then verified with pandas one-liners.",
    checkpoints: [
      {
        id: "p2c1",
        text: "Multiply two matrices by hand; explain why matrix multiplication is not commutative",
      },
      {
        id: "p2c2",
        text: "Define linear independence; determine whether 3 given vectors are independent, showing work",
      },
      {
        id: "p2c3",
        text: "In pandas: log returns, resample to monthly, groupby year for annual volatility — no Stack Overflow",
      },
      {
        id: "p2c4",
        text: "Derive and code the Sharpe ratio from raw prices unaided; state the return assumption",
      },
      {
        id: "p2c5",
        text: "Explain the dot product geometrically and why XᵀX relates to covariance",
      },
    ],
  },
  {
    id: "p3",
    title: "Probability (the heart of quant) + a real backtest",
    months: "Months 6–12 (straddles summer)",
    focus:
      "The most important phase. Quant finance is applied probability. End by running your first methodologically honest backtest.",
    split:
      "Math (probability) 45% · Programming 20% · Finance theory 15% · Projects 20%",
    deliverables: [
      "Blitzstein & Hwang Ch. 1–7: counting, conditional probability, Bayes, random variables, expectation, variance, distributions, joint distributions",
      "Harvard Stat 110 (videos + psets) in lockstep with the book",
      "Python for Data Analysis Ch. 9–11: plotting, aggregation, time-series handling",
      "Blyth Ch. 2–5: forwards, no-arbitrage, discount factors, risk-neutral pricing",
      "Begin Algorithms (Sedgewick) Ch. 1–2: big-O, sorting, basic data structures",
    ],
    flagship:
      "Backtest a moving-average crossover with real train/test discipline — optimize on train, evaluate ONCE on held-out test. Report Sharpe, max drawdown, turnover.",
    checkpoints: [
      {
        id: "p3c1",
        text: "Prove linearity of expectation E[X+Y]=E[X]+E[Y]; state why it does not need independence",
      },
      {
        id: "p3c2",
        text: "State Bayes' theorem and solve a disease-test false-positive problem cold",
      },
      {
        id: "p3c3",
        text: "Derive Var(X)=E[X²]−(E[X])² and compute for a simple discrete RV",
      },
      {
        id: "p3c4",
        text: "Backtest the MA-crossover with no lookahead bias; explain why train/test is non-negotiable",
      },
      {
        id: "p3c5",
        text: "Implement binary search and explain its O(log n) runtime",
      },
    ],
  },
  {
    id: "p4",
    title: "Statistics, regression & the factor-model worldview",
    months: "Months 12–18",
    focus:
      "Move from probability to statistics and to the central object of equity quant: the cross-sectional regression / factor model. The bridge to Numerai.",
    split:
      "Math/Stats 40% · Programming 20% · Finance theory 20% · Projects 20%",
    deliverables: [
      "Ruppert (or Hogg): estimation, hypothesis testing, confidence intervals, linear regression (SEs, R², residual diagnostics)",
      "ISLP Ch. 1–3: regression and the bias–variance tradeoff",
      "Tidy Finance with Python: accessing data, factor returns, Fama–MacBeth / cross-sectional regressions",
      "Systematic Trading (Carver) first third: position sizing, diversification across rules, over-fit danger",
      "Algorithms Ch. 3–4: searching (hashing, BSTs), graphs",
    ],
    flagship:
      "A multi-factor cross-sectional model: build 2–3 features (momentum, reversal, vol), winsorize + z-score cross-sectionally each period, regress forward returns, evaluate out-of-sample via rank IC. A Numerai submission in miniature.",
    checkpoints: [
      {
        id: "p4c1",
        text: "Derive the OLS slope β̂=(XᵀX)⁻¹Xᵀy and explain each piece geometrically (projection onto column space)",
      },
      {
        id: "p4c2",
        text: "Explain what a p-value actually is — and one thing it is not",
      },
      {
        id: "p4c3",
        text: "Compute and interpret an information coefficient; explain why rank IC beats raw correlation in noisy cross-sections",
      },
      {
        id: "p4c4",
        text: "Explain the bias–variance tradeoff with a concrete over-fit example from your own backtest",
      },
      {
        id: "p4c5",
        text: "State why z-scoring features cross-sectionally each period avoids lookahead",
      },
    ],
  },
  {
    id: "p5",
    title: "Machine learning for finance + first Numerai submission",
    months: "Months 18–24 (straddles summer)",
    focus:
      "Add the ML toolkit (trees, gradient boosting, CV) with finance-specific discipline — naive ML on financial data fails via leakage, non-stationarity, overlapping labels. Ship your first real Numerai submission.",
    split:
      "Programming/ML 35% · Math/Stats 20% · Finance theory 15% · Projects 30%",
    deliverables: [
      "ISLP Ch. 4–8: classification, resampling/CV, regularization (ridge/lasso), trees, random forests, boosting. Do the labs",
      "Hands-On ML (Géron) Part I (Ch. 1–7): the practical scikit-learn pipeline, stop before deep learning",
      "Advances in Financial ML (López de Prado) Ch. 1–7: purged/embargoed CV, sample weights, fractional differentiation, feature importance",
      "Machine Learning for Algorithmic Trading (Jansen) as a pipeline reference",
    ],
    flagship:
      "First Numerai submission: pull the dataset, train a gradient-boosted model with purged/embargoed CV, generate live predictions, run diagnostics, submit. Iterate on neutralization + ensembling. Log every run.",
    checkpoints: [
      {
        id: "p5c1",
        text: "Explain why standard k-fold CV leaks in financial time series, and implement a purged/embargoed split",
      },
      {
        id: "p5c2",
        text: "Train an XGBoost model end-to-end; explain what depth, learning rate, n_estimators trade off",
      },
      {
        id: "p5c3",
        text: "Submit to Numerai and interpret validation correlation and MMC — explain what MMC measures",
      },
      {
        id: "p5c4",
        text: "Explain feature neutralization and why you would sacrifice training correlation for it",
      },
      {
        id: "p5c5",
        text: "Explain regularization (ridge vs lasso) and when each applies",
      },
    ],
  },
  {
    id: "p6",
    title: "Derivatives, stochastic calculus & shipping live-ish systems",
    months: "Months 24–36",
    focus:
      "Capstone year. Two threads: (a) continuous-time / derivatives math (Brownian motion → Itô → Black–Scholes), and (b) production discipline feeding your ETF paper-trader.",
    split:
      "Math (stochastic calc) 30% · Finance (derivatives) 25% · Projects/systems 30% · CS polish 15%",
    deliverables: [
      "Shreve Vol I (binomial asset pricing) → Vol II (continuous-time): risk-neutral pricing, Brownian motion, Itô, Black–Scholes, Girsanov",
      "Hull selected: mechanics, no-arbitrage, binomial tree, Wiener processes, Itô, BSM, the Greeks. Work end-of-chapter problems",
      "Blyth remaining chapters on risk-neutral pricing",
      "Øksendal selected early chapters as a rigorous backstop (do not try to finish)",
      "Systematic Trading (Carver) full + Quantitative Trading (Chan): signals into a sized, risk-targeted portfolio",
      "CS polish: Cracking the Coding Interview + Green Book / Heard on the Street / Joshi",
    ],
    flagship:
      "Price a European option three ways (closed-form BS, binomial tree, Monte Carlo of GBM) and confirm convergence; plot the Greeks. Then a vol-targeted portfolio; then harden the ETF paper-trader (PAPER-ONLY).",
    checkpoints: [
      {
        id: "p6c1",
        text: "State Itô's lemma and apply it to derive the SDE for log S_t given GBM for S_t",
      },
      {
        id: "p6c2",
        text: "Derive the Black–Scholes price of a European call; explain what risk-neutral actually means",
      },
      {
        id: "p6c3",
        text: "Price the same option via Monte Carlo and show it converges; explain the 1/√N error and one variance-reduction trick",
      },
      {
        id: "p6c4",
        text: "Explain each primary Greek (delta, gamma, vega, theta) in plain language and what delta-hedging accomplishes",
      },
      {
        id: "p6c5",
        text: "Run your ETF paper-trader through a full out-of-sample backtest with realistic costs + vol-targeted sizing, and defend the result to a skeptic",
      },
      {
        id: "p6c6",
        text: "Solve a Heard on the Street / Green Book brainteaser and a medium LeetCode problem in one sitting",
      },
    ],
  },
];

export interface CourseRow {
  name: string;
  platform: string;
  spine?: boolean; // the single best free resource for the stage
}

export interface Stage {
  id: string;
  title: string;
  blurb: string;
  courses: CourseRow[];
  milestone: string;
}

export const STAGES: Stage[] = [
  {
    id: "s1",
    title: "Stage 1 — Foundations",
    blurb: "Absolute-beginner coding + math refresh + intro stats.",
    courses: [
      {
        name: "MIT 6.0001 → 6.100A Intro to CS & Programming in Python",
        platform: "MIT OCW (free)",
        spine: true,
      },
      { name: "3Blue1Brown — Essence of Calculus", platform: "YouTube (free)" },
      {
        name: "Khan Academy — Algebra/Precalc + Calculus",
        platform: "Khan (free)",
      },
      {
        name: "freeCodeCamp — Scientific Computing with Python",
        platform: "freeCodeCamp (free)",
      },
      { name: "Harvard CS50P", platform: "edX / YouTube (free)" },
      {
        name: "Udemy — Angela Yu, 100 Days of Code",
        platform: "Udemy (~$15 on sale)",
      },
    ],
    milestone:
      "Finish 6.0001 (or CS50P), then re-implement a few exercises by hand in Quant-Projects.",
  },
  {
    id: "s2",
    title: "Stage 2 — Core Quant Skills",
    blurb:
      "Multivariable calc, linear algebra, probability, the Python data stack, basic DS&A.",
    courses: [
      {
        name: "MIT 18.06 Linear Algebra (Strang)",
        platform: "MIT OCW (free)",
        spine: true,
      },
      {
        name: "3Blue1Brown — Essence of Linear Algebra",
        platform: "YouTube (free)",
      },
      {
        name: "Harvard Stat 110 (Blitzstein)",
        platform: "YouTube / edX (free)",
      },
      {
        name: "Khan Academy — Multivariable Calculus",
        platform: "Khan (free)",
      },
      {
        name: "Kaggle micro-courses: Python → Pandas → Data Viz",
        platform: "Kaggle (free)",
      },
      {
        name: "MIT 6.0002 Intro to Computational Thinking & Data Science",
        platform: "MIT OCW (free)",
      },
      {
        name: "Udemy — Jose Portilla, Python for Data Science & ML Bootcamp",
        platform: "Udemy (on sale)",
      },
    ],
    milestone:
      "Rebuild covariance/PCA by hand using 18.06; first end-to-end pandas data-clean on Numerai data.",
  },
  {
    id: "s3",
    title: "Stage 3 — Intermediate Quant",
    blurb:
      "Statistical inference, time series, econometrics, numerical methods, honest intro ML.",
    courses: [
      {
        name: "MIT 18.S096 Topics in Math with Applications in Finance",
        platform: "MIT OCW (free)",
        spine: true,
      },
      { name: "3Blue1Brown — Neural Networks", platform: "YouTube (free)" },
      {
        name: "Andrew Ng — Machine Learning Specialization",
        platform: "Coursera (audit free)",
      },
      { name: "StatQuest (Josh Starmer)", platform: "YouTube (free)" },
      {
        name: "Forecasting: Principles and Practice (Hyndman)",
        platform: "Free online book",
      },
      { name: "MIT 14.32 Econometrics", platform: "MIT OCW (free)" },
      {
        name: "Kaggle: Intro ML → Intermediate ML → Feature Engineering",
        platform: "Kaggle (free)",
      },
    ],
    milestone:
      "Train + cross-validate your first real Numerai model with proper walk-forward validation (not a random split).",
  },
  {
    id: "s4",
    title: "Stage 4 — Intro Quant Trading Strategies",
    blurb:
      "Derivatives/options, backtesting, portfolio construction & risk, financial ML.",
    courses: [
      {
        name: "Columbia — Financial Engineering & Risk Management (Haugh & Iyengar)",
        platform: "Coursera (audit free)",
        spine: true,
      },
      { name: "QuantConnect Bootcamp + Docs", platform: "QuantConnect (free)" },
      {
        name: "Advances in Financial ML (López de Prado)",
        platform: "Book + free talks",
      },
      { name: "Hudson & Thames / mlfinlab docs + blog", platform: "Free" },
      {
        name: "Ernest Chan — Quantitative Trading / Algorithmic Trading",
        platform: "Book (owned)",
      },
      {
        name: "Udemy — Portilla, Python for Financial Analysis & Algo Trading",
        platform: "Udemy (on sale)",
      },
    ],
    milestone:
      "Ship one fully-backtested strategy in QuantConnect with purged/walk-forward validation, then paper-trade it under PAPER-ONLY guards.",
  },
];

export const WEEK_ONE_ACTIONS: string[] = [
  "Pick the ONE calculus copy and archive the rest. Do the same for LA (Margalit), Python (Crash Course), probability (Blitzstein).",
  "Install Python 3 + VS Code and complete MIT 6.0001 Lecture 1 — type, do not paste, every line.",
  "Start Blitzstein Stat 110 Lecture 1 + read Chapter 1 alongside it.",
  "Set up Quant-Projects/phase-01-bond-math: git init, load a few years of one ticker CSV with plain Python, print the most-recent close.",
  "Block 8–12 hrs/week of recurring quant-study time on your calendar; write the crunch-week rule (midterms/finals → 4 hrs, review-only).",
];
